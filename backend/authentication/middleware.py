from django.utils.deprecation import MiddlewareMixin

class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware to exempt specific endpoints from CSRF validation
    """
    
    def process_request(self, request):
        # List of paths to exempt from CSRF
        exempt_paths = [
            '/api/auth/session/logout/',
            '/api/auth/session/login/',
        ]
        
        # Check if the current path should be exempt
        if any(request.path.startswith(path) for path in exempt_paths):
            setattr(request, '_dont_enforce_csrf_checks', True)
        
        return None