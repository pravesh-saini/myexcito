from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from store.models import LoyaltyCoupon


User = get_user_model()


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    RATE_LIMIT_LOGIN_IP=2,
    RATE_LIMIT_LOGIN_EMAIL=2,
    RATE_LIMIT_LOGIN_WINDOW_SECONDS=120,
    RATE_LIMIT_OTP_REQUEST_IP=2,
    RATE_LIMIT_OTP_REQUEST_EMAIL=2,
    RATE_LIMIT_OTP_REQUEST_WINDOW_SECONDS=120,
    RATE_LIMIT_COUPON_VALIDATE_IP=2,
    RATE_LIMIT_COUPON_VALIDATE_EMAIL=2,
    RATE_LIMIT_COUPON_VALIDATE_WINDOW_SECONDS=120,
)
class ApiRateLimitTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username='rateuser',
            email='rateuser@example.com',
            password='ValidPass123!',
        )
        LoyaltyCoupon.objects.create(
            user=self.user,
            code='RATE10',
            discount_percent=10,
            is_active=True,
        )

    def test_login_password_rate_limited_after_threshold(self):
        payload = {
            'email': 'rateuser@example.com',
            'password': 'wrong-password',
        }

        first = self.client.post('/api/auth/login-password/', data=payload, format='json')
        second = self.client.post('/api/auth/login-password/', data=payload, format='json')
        third = self.client.post('/api/auth/login-password/', data=payload, format='json')

        self.assertEqual(first.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('retry_after_seconds', third.data)
        self.assertIn('Retry-After', third)

    def test_request_otp_rate_limited_after_threshold(self):
        payload = {'email': 'otp-limit@example.com'}

        first = self.client.post('/api/auth/request-otp/', data=payload, format='json')
        second = self.client.post('/api/auth/request-otp/', data=payload, format='json')
        third = self.client.post('/api/auth/request-otp/', data=payload, format='json')

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('retry_after_seconds', third.data)

    def test_coupon_validate_rate_limited_after_threshold(self):
        payload = {
            'code': 'RATE10',
            'email': 'rateuser@example.com',
            'subtotal': '1000',
        }

        first = self.client.post('/api/coupons/validate/', data=payload, format='json')
        second = self.client.post('/api/coupons/validate/', data=payload, format='json')
        third = self.client.post('/api/coupons/validate/', data=payload, format='json')

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(third.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('retry_after_seconds', third.data)