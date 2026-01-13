from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django_ratelimit.decorators import ratelimit
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

# CORS headers are now handled by CORS middleware in settings.py
# No need for manual CORS header management

@api_view(['POST'])
@permission_classes([AllowAny])  # Registration must be public
@ratelimit(key='ip', rate='3/h', method='POST')  # SECURITY: Max 3 registrations per hour per IP
def register_view(request):
    """User registration endpoint"""
    # Check if rate limited
    if getattr(request, 'limited', False):
        return Response({
            'success': False,
            'error': 'Too many registration attempts. Please try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Login must be public
@ratelimit(key='ip', rate='5/15m', method='POST')  # SECURITY: Max 5 login attempts per 15 minutes per IP
def login_view(request):
    """User login endpoint"""
    # Check if rate limited
    if getattr(request, 'limited', False):
        return Response({
            'success': False,
            'error': 'Too many login attempts. Please try again in 15 minutes.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'success': True,
            'token': 'dummy-auth-token',  # For compatibility with frontend
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])  # Logout should be accessible
@authentication_classes([])
def logout_view(request):
    """User logout endpoint"""
    logout(request)
    return Response({
        'success': True,
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth_view(request):
    """Check authentication status"""
    return Response({
        'authenticated': True,
        'user': UserSerializer(request.user).data
    })

# Simple Session-based Authentication (for Property Review App)
@api_view(['POST'])
@permission_classes([AllowAny])  # Login must be public
@ratelimit(key='ip', rate='10/h', method='POST')  # SECURITY: Max 10 session logins per hour per IP
def session_login_view(request):
    """Simple session login - create or get user by display name"""
    # Check if rate limited
    if getattr(request, 'limited', False):
        return Response({
            'success': False,
            'error': 'Too many session requests. Please try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    display_name = request.data.get('name', '').strip()
    if not display_name:
        return Response({
            'success': False,
            'error': 'Name is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from .models import User
        
        # Try to find existing user by username (display name)
        user, created = User.objects.get_or_create(
            username=display_name,
            defaults={
                'email': f'{display_name.lower().replace(" ", "_")}@propertyreview.local',
                'first_name': display_name,
            }
        )
        
        # Log the user in (creates session)
        login(request, user)
        
        # Store recent users in session for quick access
        if 'recent_users' not in request.session:
            request.session['recent_users'] = []
        
        recent_users = request.session['recent_users']
        if display_name not in recent_users:
            recent_users.insert(0, display_name)
            # Keep only last 10 users
            request.session['recent_users'] = recent_users[:10]
        
        return Response({
            'success': True,
            'message': 'Session started successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'display_name': display_name,
                'email': user.email
            },
            'session_created': created
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # Session status should be publicly accessible
@ensure_csrf_cookie  # Ensure CSRF cookie is set for subsequent requests
def session_status_view(request):
    """Check current session status"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'display_name': request.user.first_name or request.user.username,
                'email': request.user.email
            },
            'recent_users': request.session.get('recent_users', [])
        })

    return Response({
        'authenticated': False,
        'recent_users': request.session.get('recent_users', [])
    })

@api_view(['POST'])
@permission_classes([AllowAny])  # Logout should be accessible
def session_logout_view(request):
    """Simple session logout"""
    # Keep recent users but clear authentication
    recent_users = request.session.get('recent_users', [])
    logout(request)
    request.session['recent_users'] = recent_users

    return Response({
        'success': True,
        'message': 'Session ended successfully'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile"""
    return Response(UserSerializer(request.user).data)
