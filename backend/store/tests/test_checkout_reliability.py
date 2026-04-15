import hashlib
import hmac
import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from store.models import Order, PaymentWebhookEvent, Product


@override_settings(PAYMENT_WEBHOOK_SECRET='test-webhook-secret')
class CheckoutReliabilityTests(APITestCase):
    def setUp(self):
        self.order_url = '/api/orders/'
        self.webhook_url = '/api/payments/webhook/'

    def _create_product(self, name='Test Product', stock=10, price='499.00'):
        image_file = SimpleUploadedFile('product.jpg', b'fake-image-bytes', content_type='image/jpeg')
        return Product.objects.create(
            name=name,
            description='Test item',
            image=image_file,
            price=price,
            category='men',
            section='tops',
            stock_count=stock,
        )

    def _order_payload(self, product_id, quantity=1, payment_mode='cod'):
        return {
            'first_name': 'Ada',
            'last_name': 'Lovelace',
            'email': 'ada@example.com',
            'phone': '9999999999',
            'payment_mode': payment_mode,
            'address_line1': '221B Baker Street',
            'address_line2': '',
            'city': 'London',
            'state': 'London',
            'postal_code': 'NW16XE',
            'country': 'UK',
            'coupon_code': '',
            'items': [
                {
                    'product': product_id,
                    'quantity': quantity,
                    'size': 'M',
                    'color': 'Black',
                }
            ],
        }

    def _signed_webhook_headers(self, body):
        timestamp = str(int(timezone.now().timestamp()))
        signed_payload = f'{timestamp}.{body}'.encode('utf-8')
        signature = hmac.new(b'test-webhook-secret', signed_payload, hashlib.sha256).hexdigest()
        return {
            'HTTP_X_EXCITO_TIMESTAMP': timestamp,
            'HTTP_X_EXCITO_SIGNATURE': signature,
        }

    def test_order_create_is_idempotent_for_duplicate_requests(self):
        product = self._create_product(stock=10)
        payload = self._order_payload(product_id=product.id, quantity=2, payment_mode='cod')

        first = self.client.post(
            self.order_url,
            data=payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY='idem-order-1',
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertFalse(first.data['idempotent_replay'])

        second = self.client.post(
            self.order_url,
            data=payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY='idem-order-1',
        )
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertTrue(second.data['idempotent_replay'])
        self.assertEqual(first.data['id'], second.data['id'])

        self.assertEqual(Order.objects.count(), 1)
        product.refresh_from_db()
        self.assertEqual(product.stock_count, 8)

    def test_payment_webhook_rejects_invalid_signature(self):
        product = self._create_product(stock=10)
        payload = self._order_payload(product_id=product.id, quantity=2, payment_mode='upi')

        order_response = self.client.post(
            self.order_url,
            data=payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY='idem-order-2',
        )
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        order_id = order_response.data['id']

        webhook_payload = {
            'event_id': 'evt-invalid-signature',
            'event_type': 'payment.succeeded',
            'order_id': order_id,
            'payment_reference': 'pay_invalid',
        }

        bad = self.client.post(
            self.webhook_url,
            data=json.dumps(webhook_payload),
            content_type='application/json',
            HTTP_X_EXCITO_TIMESTAMP=str(int(timezone.now().timestamp())),
            HTTP_X_EXCITO_SIGNATURE='not-a-valid-signature',
        )

        self.assertEqual(bad.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(PaymentWebhookEvent.objects.count(), 0)

    def test_payment_webhook_marks_order_paid_and_is_event_idempotent(self):
        product = self._create_product(stock=6)
        payload = self._order_payload(product_id=product.id, quantity=3, payment_mode='card')

        order_response = self.client.post(
            self.order_url,
            data=payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY='idem-order-3',
        )
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        order_id = order_response.data['id']

        product.refresh_from_db()
        self.assertEqual(product.stock_count, 6)

        webhook_payload = {
            'event_id': 'evt-paid-1',
            'event_type': 'payment.succeeded',
            'order_id': order_id,
            'payment_reference': 'pay_001',
        }
        webhook_body = json.dumps(webhook_payload)

        ok = self.client.post(
            self.webhook_url,
            data=webhook_body,
            content_type='application/json',
            **self._signed_webhook_headers(webhook_body),
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK)

        order = Order.objects.get(pk=order_id)
        self.assertEqual(order.payment_status, 'paid')
        self.assertEqual(order.payment_reference, 'pay_001')
        self.assertIsNotNone(order.paid_at)

        product.refresh_from_db()
        self.assertEqual(product.stock_count, 3)
        self.assertEqual(PaymentWebhookEvent.objects.filter(event_id='evt-paid-1').count(), 1)

        duplicate = self.client.post(
            self.webhook_url,
            data=webhook_body,
            content_type='application/json',
            **self._signed_webhook_headers(webhook_body),
        )
        self.assertEqual(duplicate.status_code, status.HTTP_200_OK)

        product.refresh_from_db()
        self.assertEqual(product.stock_count, 3)
        self.assertEqual(PaymentWebhookEvent.objects.filter(event_id='evt-paid-1').count(), 1)

    def test_payment_webhook_fails_when_stock_changed_before_capture(self):
        product = self._create_product(stock=5)
        payload = self._order_payload(product_id=product.id, quantity=4, payment_mode='upi')

        order_response = self.client.post(
            self.order_url,
            data=payload,
            format='json',
            HTTP_IDEMPOTENCY_KEY='idem-order-4',
        )
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        order_id = order_response.data['id']

        product.stock_count = 2
        product.save(update_fields=['stock_count'])

        webhook_payload = {
            'event_id': 'evt-stock-fail-1',
            'event_type': 'payment.succeeded',
            'order_id': order_id,
            'payment_reference': 'pay_002',
        }
        webhook_body = json.dumps(webhook_payload)

        response = self.client.post(
            self.webhook_url,
            data=webhook_body,
            content_type='application/json',
            **self._signed_webhook_headers(webhook_body),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stock_shortages', response.data)

        order = Order.objects.get(pk=order_id)
        self.assertEqual(order.payment_status, 'stock_unavailable')
        self.assertEqual(order.status, 'cancelled')

        product.refresh_from_db()
        self.assertEqual(product.stock_count, 2)

        event = PaymentWebhookEvent.objects.get(event_id='evt-stock-fail-1')
        self.assertEqual(event.status, 'stock_unavailable')