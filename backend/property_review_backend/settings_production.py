import os
from dotenv import load_dotenv
from .settings import *

# Load environment variables from .env file
load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    'pr-neitclem.gratusinc.org',
    'www.pr-neitclem.gratusinc.org'
] + os.getenv('ALLOWED_HOSTS', '').split(',')

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    },
    'forms_db': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('FORMS_DB_NAME'),
        'USER': os.getenv('FORMS_DB_USER'),
        'PASSWORD': os.getenv('FORMS_DB_PASSWORD'),
        'HOST': os.getenv('FORMS_DB_HOST', 'localhost'),
        'PORT': os.getenv('FORMS_DB_PORT', '3306'),
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    },
    'habitational_db': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('HABITATIONAL_DB_NAME'),
        'USER': os.getenv('HABITATIONAL_DB_USER'),
        'PASSWORD': os.getenv('HABITATIONAL_DB_PASSWORD'),
        'HOST': os.getenv('HABITATIONAL_DB_HOST', 'localhost'),
        'PORT': os.getenv('HABITATIONAL_DB_PORT', '3306'),
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    }
}

# Static & Media
STATIC_URL = '/static/'
STATIC_ROOT = '/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/gratusinc-pr-neitclem/htdocs/pr-neitclem.gratusinc.org/media/'

# CORS / CSRF
CORS_ALLOWED_ORIGINS = [
    'http://pr-neitclem.gratusinc.org',
    'https://pr-neitclem.gratusinc.org',
    'https://www.pr-neitclem.gratusinc.org',
]
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = [
    'http://pr-neitclem.gratusinc.org',
    'https://pr-neitclem.gratusinc.org',
    'https://www.pr-neitclem.gratusinc.org',
]

# Security
SECURE_SSL_REDIRECT = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Session & CSRF cookies (safe config for dev/prod hybrid)
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# COMPLETELY DISABLE CSRF - OVERRIDE MIDDLEWARE COMPLETELY
CSRF_COOKIE_NAME = None
CSRF_USE_SESSIONS = False
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# DEBUG: Print middleware to verify CSRF is removed
import sys
print("=" * 50, file=sys.stderr)
print("DJANGO SETTINGS DEBUG", file=sys.stderr)
print("MIDDLEWARE:", MIDDLEWARE, file=sys.stderr)
print("CSRF_COOKIE_NAME:", globals().get('CSRF_COOKIE_NAME'), file=sys.stderr)
print("CSRF_USE_SESSIONS:", globals().get('CSRF_USE_SESSIONS'), file=sys.stderr)
print("=" * 50, file=sys.stderr)
sys.stderr.flush()

# FORCE DISABLE CSRF COMPLETELY - NUCLEAR OPTION
# Monkey patch to disable CSRF completely
import django.middleware.csrf
django.middleware.csrf.get_token = lambda request: None
django.middleware.csrf.CsrfViewMiddleware.process_request = lambda self, request: None
django.middleware.csrf.CsrfViewMiddleware.process_view = lambda self, request, callback, callback_args, callback_kwargs: None