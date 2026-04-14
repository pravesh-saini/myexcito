import random
import string
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Order, EmailOTP, LoyaltyCoupon, ShippingSetting
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


class OrderDetail(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    queryset = Order.objects.all()


class RequestEmailOTP(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

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
