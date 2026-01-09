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

# Security - HTTPS Configuration
# Note: Set SECURE_SSL_REDIRECT = True when HTTPS is fully configured on the server
SECURE_SSL_REDIRECT = False  # Enable when HTTPS is ready
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# HSTS (HTTP Strict Transport Security)
# Enable when HTTPS is configured
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session & CSRF cookies
# Set to True when HTTPS is enabled
SESSION_COOKIE_SECURE = False  # Change to True when HTTPS is enabled
CSRF_COOKIE_SECURE = False  # Change to True when HTTPS is enabled
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Must be False for JavaScript access
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# CSRF Protection - RE-ENABLED
# CSRF middleware is now enabled for security
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # CSRF PROTECTION ENABLED
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]