"""
Django settings for excito_backend project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# DEVELOPMENT ONLY: keep this secret key.
SECRET_KEY = 'django-insecure-excito-dev-key-change'

DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third-party
    'rest_framework',
    'corsheaders',
    # local apps
    'store',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'excito_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'store.context_processors.frontend_url',
            ],
        },
    },
]

WSGI_APPLICATION = 'excito_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Frontend (Next.js) base URL used by templates (e.g., admin panel "View Store")
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://127.0.0.1:3000').rstrip('/')

# Trust local dev and ngrok origins for browser form POSTs.
CSRF_TRUSTED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    'https://*.ngrok-free.dev',
    'https://*.ngrok-free.app',
]


# CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    "idempotency-key",
]

# DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# Email / OTP (dev-safe defaults; override with SMTP env vars in production)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@excito.local')
OTP_EXPIRY_MINUTES = int(os.environ.get('OTP_EXPIRY_MINUTES', '10'))

# Abuse protection: fixed-window API rate limits
RATE_LIMIT_LOGIN_IP = int(os.environ.get('RATE_LIMIT_LOGIN_IP', '10'))
RATE_LIMIT_LOGIN_EMAIL = int(os.environ.get('RATE_LIMIT_LOGIN_EMAIL', '5'))
RATE_LIMIT_LOGIN_WINDOW_SECONDS = int(os.environ.get('RATE_LIMIT_LOGIN_WINDOW_SECONDS', '300'))

RATE_LIMIT_OTP_REQUEST_IP = int(os.environ.get('RATE_LIMIT_OTP_REQUEST_IP', '8'))
RATE_LIMIT_OTP_REQUEST_EMAIL = int(os.environ.get('RATE_LIMIT_OTP_REQUEST_EMAIL', '3'))
RATE_LIMIT_OTP_REQUEST_WINDOW_SECONDS = int(os.environ.get('RATE_LIMIT_OTP_REQUEST_WINDOW_SECONDS', '600'))

RATE_LIMIT_OTP_VERIFY_IP = int(os.environ.get('RATE_LIMIT_OTP_VERIFY_IP', '15'))
RATE_LIMIT_OTP_VERIFY_EMAIL = int(os.environ.get('RATE_LIMIT_OTP_VERIFY_EMAIL', '8'))
RATE_LIMIT_OTP_VERIFY_WINDOW_SECONDS = int(os.environ.get('RATE_LIMIT_OTP_VERIFY_WINDOW_SECONDS', '600'))

RATE_LIMIT_COUPON_VALIDATE_IP = int(os.environ.get('RATE_LIMIT_COUPON_VALIDATE_IP', '30'))
RATE_LIMIT_COUPON_VALIDATE_EMAIL = int(os.environ.get('RATE_LIMIT_COUPON_VALIDATE_EMAIL', '10'))
RATE_LIMIT_COUPON_VALIDATE_WINDOW_SECONDS = int(os.environ.get('RATE_LIMIT_COUPON_VALIDATE_WINDOW_SECONDS', '300'))

# Payment webhook verification
PAYMENT_WEBHOOK_SECRET = os.environ.get('PAYMENT_WEBHOOK_SECRET', 'dev-webhook-secret-change')
PAYMENT_WEBHOOK_TOLERANCE_SECONDS = int(os.environ.get('PAYMENT_WEBHOOK_TOLERANCE_SECONDS', '300'))

# Session and Cookie settings for local development across ports
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_NAME = 'excito_sessionid'
CSRF_COOKIE_NAME = 'excito_csrftoken'
