import random
import string
import hashlib
import hmac
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Order, EmailOTP, LoyaltyCoupon, ShippingSetting, PaymentWebhookEvent, log_stock_change
from .rate_limits import apply_rate_limits, get_client_ip
from .serializers import ProductSerializer, OrderSerializer


User = get_user_model()


class ProductList(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all().order_by('-id')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class ProductDetail(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()


class OrderCreate(generics.CreateAPIView):
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        idempotency_key = (request.headers.get('Idempotency-Key') or request.data.get('idempotency_key') or '').strip()
        if not idempotency_key:
            return Response(
                {'detail': 'Idempotency-Key header (or idempotency_key field) is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(idempotency_key) > 64:
            return Response({'detail': 'Idempotency key is too long.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data.copy()
        payload['idempotency_key'] = idempotency_key
        email = (payload.get('email') or '').strip().lower()

        existing_order = self._find_existing_order(email=email, idempotency_key=idempotency_key)
        if existing_order:
            serializer = self.get_serializer(existing_order)
            response_data = dict(serializer.data)
            response_data['idempotent_replay'] = True
            return Response(response_data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            # Concurrent retries can race; return the existing order for the same idempotency key.
            existing_order = self._find_existing_order(email=email, idempotency_key=idempotency_key)
            if existing_order:
                response_serializer = self.get_serializer(existing_order)
                response_data = dict(response_serializer.data)
                response_data['idempotent_replay'] = True
                return Response(response_data, status=status.HTTP_200_OK)
            raise

        headers = self.get_success_headers(serializer.data)
        response_data = dict(serializer.data)
        response_data['idempotent_replay'] = False
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def _find_existing_order(self, email, idempotency_key):
        if getattr(self.request, 'user', None) and self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user, idempotency_key=idempotency_key).order_by('-id').first()

        if not email:
            return None

        return Order.objects.filter(email__iexact=email, idempotency_key=idempotency_key).order_by('-id').first()


class OrderDetail(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()


class RequestEmailOTP(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        ip_address = get_client_ip(request)
        limited = apply_rate_limits(
            [
                {
                    'prefix': 'otp_request_ip',
                    'identifier': ip_address,
                    'limit': getattr(settings, 'RATE_LIMIT_OTP_REQUEST_IP', 8),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_OTP_REQUEST_WINDOW_SECONDS', 600),
                    'detail': 'Too many OTP requests from this network. Please try again shortly.',
                },
                {
                    'prefix': 'otp_request_email',
                    'identifier': email,
                    'limit': getattr(settings, 'RATE_LIMIT_OTP_REQUEST_EMAIL', 3),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_OTP_REQUEST_WINDOW_SECONDS', 600),
                    'detail': 'Too many OTP requests for this email. Please wait before retrying.',
                },
            ]
        )
        if limited:
            return limited

        otp = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=getattr(settings, 'OTP_EXPIRY_MINUTES', 10))

        EmailOTP.objects.filter(email=email, is_used=False).update(is_used=True)
        EmailOTP.objects.create(
            email=email,
            otp_hash=make_password(otp),
            expires_at=expires_at,
        )

        send_mail(
            subject='Your Excito Login OTP',
            message=f'Your OTP is {otp}. It is valid for {getattr(settings, "OTP_EXPIRY_MINUTES", 10)} minutes.',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({'detail': 'OTP sent successfully.'}, status=status.HTTP_200_OK)


class VerifyEmailOTP(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        otp = (request.data.get('otp') or '').strip()

        if not email or not otp:
            return Response({'detail': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        ip_address = get_client_ip(request)
        limited = apply_rate_limits(
            [
                {
                    'prefix': 'otp_verify_ip',
                    'identifier': ip_address,
                    'limit': getattr(settings, 'RATE_LIMIT_OTP_VERIFY_IP', 15),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_OTP_VERIFY_WINDOW_SECONDS', 600),
                    'detail': 'Too many OTP verification attempts from this network.',
                },
                {
                    'prefix': 'otp_verify_email',
                    'identifier': email,
                    'limit': getattr(settings, 'RATE_LIMIT_OTP_VERIFY_EMAIL', 8),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_OTP_VERIFY_WINDOW_SECONDS', 600),
                    'detail': 'Too many OTP verification attempts for this email.',
                },
            ]
        )
        if limited:
            return limited

        otp_entry = EmailOTP.objects.filter(email=email, is_used=False).order_by('-created_at').first()
        if not otp_entry:
            return Response({'detail': 'OTP not found. Request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_entry.expires_at < timezone.now():
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            return Response({'detail': 'OTP expired. Request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_entry.attempts >= 5:
            otp_entry.is_used = True
            otp_entry.save(update_fields=['is_used'])
            return Response({'detail': 'Too many attempts. Request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(otp, otp_entry.otp_hash):
            otp_entry.attempts += 1
            otp_entry.save(update_fields=['attempts'])
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_entry.is_used = True
        otp_entry.save(update_fields=['is_used'])

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'detail': 'Account not found. Please sign up first.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response({'detail': 'Account is inactive. Contact admin.'}, status=status.HTTP_403_FORBIDDEN)
        if not user.has_usable_password():
            return Response({'detail': 'Password not set for this account. Contact admin.'}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)

        return Response(
            {
                'detail': 'Login successful.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
            },
            status=status.HTTP_200_OK,
        )


class SignupWithPassword(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = (request.data.get('password') or '').strip()
        first_name = (request.data.get('first_name') or '').strip()
        last_name = (request.data.get('last_name') or '').strip()

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        base_username = email.split('@')[0][:20] or 'user'
        username = base_username
        idx = 1
        while User.objects.filter(username=username).exists():
            idx += 1
            username = f'{base_username[:16]}{idx}'

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        login(request, user)

        return Response(
            {
                'detail': 'Account created successfully.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginWithPassword(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = (request.data.get('password') or '').strip()

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        ip_address = get_client_ip(request)
        limited = apply_rate_limits(
            [
                {
                    'prefix': 'login_ip',
                    'identifier': ip_address,
                    'limit': getattr(settings, 'RATE_LIMIT_LOGIN_IP', 10),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_LOGIN_WINDOW_SECONDS', 300),
                    'detail': 'Too many login attempts from this network. Please try again later.',
                },
                {
                    'prefix': 'login_email',
                    'identifier': email,
                    'limit': getattr(settings, 'RATE_LIMIT_LOGIN_EMAIL', 5),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_LOGIN_WINDOW_SECONDS', 300),
                    'detail': 'Too many login attempts for this account. Please wait before retrying.',
                },
            ]
        )
        if limited:
            return limited

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response({'detail': 'Account is inactive. Contact admin.'}, status=status.HTTP_403_FORBIDDEN)
        if not user.has_usable_password():
            return Response({'detail': 'Password not set for this account. Contact admin.'}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response(
            {
                'detail': 'Login successful.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
            },
            status=status.HTTP_200_OK,
        )


class UpdatePasswordView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        current_password = (request.data.get('current_password') or '').strip()
        new_password = (request.data.get('new_password') or '').strip()
        confirm_password = (request.data.get('confirm_password') or '').strip()

        if not email or not current_password or not new_password or not confirm_password:
            return Response({'detail': 'Email, current password, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'detail': 'New password and confirm password do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'detail': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        if current_password == new_password:
            return Response({'detail': 'New password must be different from current password.'}, status=status.HTTP_400_BAD_REQUEST)

        ip_address = get_client_ip(request)
        limited = apply_rate_limits(
            [
                {
                    'prefix': 'password_update_ip',
                    'identifier': ip_address,
                    'limit': 8,
                    'window_seconds': 600,
                    'detail': 'Too many password update attempts from this network. Please try later.',
                },
                {
                    'prefix': 'password_update_email',
                    'identifier': email,
                    'limit': 5,
                    'window_seconds': 600,
                    'detail': 'Too many password update attempts for this account. Please try later.',
                },
            ]
        )
        if limited:
            return limited

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({'detail': 'Account is inactive. Contact admin.'}, status=status.HTTP_403_FORBIDDEN)

        if not user.check_password(current_password):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class ShippingConfigView(APIView):
    def get(self, request):
        shipping = ShippingSetting.objects.first()
        flat_fee = shipping.flat_shipping_fee if shipping else Decimal('79.00')
        free_threshold = shipping.free_shipping_threshold if shipping else Decimal('999.00')
        return Response(
            {
                'flat_shipping_fee': str(flat_fee),
                'free_shipping_threshold': str(free_threshold),
            },
            status=status.HTTP_200_OK,
        )


class ValidateCouponView(APIView):
    def post(self, request):
        code = (request.data.get('code') or '').strip().upper()
        email = (request.data.get('email') or '').strip().lower()
        subtotal_raw = request.data.get('subtotal')

        if not code or not email:
            return Response({'detail': 'Coupon code and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

        ip_address = get_client_ip(request)
        limited = apply_rate_limits(
            [
                {
                    'prefix': 'coupon_validate_ip',
                    'identifier': ip_address,
                    'limit': getattr(settings, 'RATE_LIMIT_COUPON_VALIDATE_IP', 30),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_COUPON_VALIDATE_WINDOW_SECONDS', 300),
                    'detail': 'Too many coupon validation attempts from this network.',
                },
                {
                    'prefix': 'coupon_validate_email',
                    'identifier': email,
                    'limit': getattr(settings, 'RATE_LIMIT_COUPON_VALIDATE_EMAIL', 10),
                    'window_seconds': getattr(settings, 'RATE_LIMIT_COUPON_VALIDATE_WINDOW_SECONDS', 300),
                    'detail': 'Too many coupon attempts for this email. Please try again later.',
                },
            ]
        )
        if limited:
            return limited

        try:
            subtotal = Decimal(str(subtotal_raw or '0'))
        except Exception:
            return Response({'detail': 'Invalid subtotal value.'}, status=status.HTTP_400_BAD_REQUEST)

        coupon = LoyaltyCoupon.objects.filter(code=code, is_active=True).select_related('user').first()
        if not coupon:
            return Response({'detail': 'Invalid or inactive coupon.'}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.expires_at and coupon.expires_at < timezone.now():
            return Response({'detail': 'Coupon is expired.'}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.user.email.lower() != email:
            return Response({'detail': 'Coupon does not belong to this email.'}, status=status.HTTP_400_BAD_REQUEST)

        discount_amount = (subtotal * Decimal(coupon.discount_percent) / Decimal('100')).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        return Response(
            {
                'valid': True,
                'code': coupon.code,
                'discount_percent': coupon.discount_percent,
                'discount_amount': str(discount_amount),
            },
            status=status.HTTP_200_OK,
        )


class PaymentWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        is_valid, detail = self._verify_signature(request)
        if not is_valid:
            return Response({'detail': detail}, status=status.HTTP_401_UNAUTHORIZED)

        payload = request.data if isinstance(request.data, dict) else {}
        event_id = (payload.get('event_id') or '').strip()
        event_type = (payload.get('event_type') or '').strip().lower()
        order_id = payload.get('order_id')
        payment_reference = (payload.get('payment_reference') or '').strip()
        signature = (request.headers.get('X-Excito-Signature') or '').strip()

        if not event_id or not event_type or not order_id:
            return Response(
                {'detail': 'event_id, event_type, and order_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                if PaymentWebhookEvent.objects.filter(event_id=event_id).exists():
                    return Response({'detail': 'Event already processed.'}, status=status.HTTP_200_OK)

                order = Order.objects.select_for_update().filter(pk=order_id).first()
                if not order:
                    PaymentWebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=event_type,
                        signature=signature,
                        status='order_not_found',
                        payload=payload,
                    )
                    return Response({'detail': 'Order not found; event recorded.'}, status=status.HTTP_200_OK)

                if event_type == 'payment.failed':
                    order.payment_status = 'failed'
                    order.status = 'cancelled'
                    if payment_reference:
                        order.payment_reference = payment_reference
                    order.save(update_fields=['payment_status', 'status', 'payment_reference'])

                    PaymentWebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=event_type,
                        order=order,
                        signature=signature,
                        status='processed',
                        payload=payload,
                    )
                    return Response({'detail': 'Payment failure recorded.'}, status=status.HTTP_200_OK)

                if event_type != 'payment.succeeded':
                    PaymentWebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=event_type,
                        order=order,
                        signature=signature,
                        status='ignored_event_type',
                        payload=payload,
                    )
                    return Response({'detail': 'Event ignored.'}, status=status.HTTP_200_OK)

                if order.payment_mode == 'cod':
                    PaymentWebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=event_type,
                        order=order,
                        signature=signature,
                        status='ignored_cod_order',
                        payload=payload,
                    )
                    return Response({'detail': 'COD order does not accept payment webhook.'}, status=status.HTTP_200_OK)

                if order.payment_status == 'paid':
                    PaymentWebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=event_type,
                        order=order,
                        signature=signature,
                        status='duplicate_paid',
                        payload=payload,
                    )
                    return Response({'detail': 'Order already marked as paid.'}, status=status.HTTP_200_OK)

                order_items = list(order.items.select_related('product').all())
                stock_shortages = []
                locked_products = {}

                for item in order_items:
                    product = Product.objects.select_for_update().get(pk=item.product_id)
                    locked_products[item.product_id] = product
                    if product.stock_count < item.quantity:
                        stock_shortages.append(f'{product.name} (need {item.quantity}, have {product.stock_count})')

                if stock_shortages:
                    order.payment_status = 'stock_unavailable'
                    order.status = 'cancelled'
                    if payment_reference:
                        order.payment_reference = payment_reference
                    order.save(update_fields=['payment_status', 'status', 'payment_reference'])

                    PaymentWebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=event_type,
                        order=order,
                        signature=signature,
                        status='stock_unavailable',
                        payload=payload,
                    )
                    return Response(
                        {
                            'detail': 'Payment received but stock became unavailable.',
                            'stock_shortages': stock_shortages,
                        },
                        status=status.HTTP_200_OK,
                    )

                for item in order_items:
                    product = locked_products[item.product_id]
                    old_stock = product.stock_count
                    product.stock_count -= item.quantity
                    product.is_limited_stock = 0 < product.stock_count <= 5
                    product.save(update_fields=['stock_count', 'is_limited_stock'])
                    log_stock_change(
                        product=product,
                        old_stock=old_stock,
                        new_stock=product.stock_count,
                        changed_by=None,
                        reason=f'Payment confirmed for order #{order.id}',
                    )

                order.payment_status = 'paid'
                order.status = 'pending'
                order.paid_at = timezone.now()
                if payment_reference:
                    order.payment_reference = payment_reference
                order.save(update_fields=['payment_status', 'status', 'paid_at', 'payment_reference'])

                PaymentWebhookEvent.objects.create(
                    event_id=event_id,
                    event_type=event_type,
                    order=order,
                    signature=signature,
                    status='processed',
                    payload=payload,
                )
        except IntegrityError:
            return Response({'detail': 'Event already processed.'}, status=status.HTTP_200_OK)

        return Response({'detail': 'Payment processed successfully.'}, status=status.HTTP_200_OK)

    def _verify_signature(self, request):
        secret = (getattr(settings, 'PAYMENT_WEBHOOK_SECRET', '') or '').strip()
        if not secret:
            return False, 'Payment webhook secret is not configured.'

        signature = (request.headers.get('X-Excito-Signature') or '').strip()
        timestamp = (request.headers.get('X-Excito-Timestamp') or '').strip()

        if not signature or not timestamp:
            return False, 'Missing webhook signature headers.'

        try:
            timestamp_int = int(timestamp)
        except (TypeError, ValueError):
            return False, 'Invalid webhook timestamp.'

        tolerance = int(getattr(settings, 'PAYMENT_WEBHOOK_TOLERANCE_SECONDS', 300))
        now_ts = int(timezone.now().timestamp())
        if abs(now_ts - timestamp_int) > tolerance:
            return False, 'Webhook timestamp outside tolerance.'

        signed_payload = timestamp.encode('utf-8') + b'.' + request.body
        expected_signature = hmac.new(secret.encode('utf-8'), signed_payload, hashlib.sha256).hexdigest()
        if not constant_time_compare(expected_signature, signature):
            return False, 'Invalid webhook signature.'

        return True, ''
