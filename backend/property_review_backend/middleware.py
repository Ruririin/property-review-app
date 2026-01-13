"""
Custom middleware for security and error handling
"""
import logging
from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger('security')


class ProductionErrorHandlingMiddleware:
    """
    Middleware to sanitize error messages in production

    In production (DEBUG=False), detailed error messages are replaced with
    generic messages to prevent information leakage. Detailed errors are
    logged server-side for debugging.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """
        Handle exceptions and return generic error messages in production
        """
        # In development (DEBUG=True), show detailed errors
        if settings.DEBUG:
            return None  # Let Django handle it normally

        # In production (DEBUG=False), log details but return generic message
        logger.error(
            f"Unhandled exception: {exception}",
            exc_info=True,
            extra={
                'request_path': request.path,
                'request_method': request.method,
                'user': request.user.username if request.user.is_authenticated else 'anonymous',
                'ip_address': self._get_client_ip(request),
            }
        )

        # Return generic error message
        return JsonResponse({
            'error': 'An internal server error occurred. Please contact support if the problem persists.',
            'error_code': 'INTERNAL_SERVER_ERROR'
        }, status=500)

    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Only add HSTS in production with HTTPS
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        return response
