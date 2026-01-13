from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
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

# REMOVED: Insecure Session Authentication Endpoints
# ===================================================
# The following endpoints have been REMOVED for security reasons:
# - session_login_view() - Allowed login without password verification (CRITICAL vulnerability)
# - session_status_view() - Depended on insecure authentication
# - session_logout_view() - Depended on insecure authentication
#
# SECURITY ISSUE: These endpoints allowed anyone to impersonate any user by simply
# providing a display name, with no password or authentication required.
#
# USE INSTEAD: Secure authentication endpoints above:
# - register_view() - POST /api/auth/register/ (proper user registration with password)
# - login_view() - POST /api/auth/login/ (secure login with password verification)
# - logout_view() - POST /api/auth/logout/ (secure logout)
# - check_auth_view() - GET /api/auth/check/ (secure authentication status check)
#
# If you need simple name-based authentication for development/testing:
# 1. Use it ONLY in development environment (DEBUG=True)
# 2. Add proper authentication checks
# 3. Never deploy to production
#
# For production, users MUST authenticate with proper credentials.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile"""
    return Response(UserSerializer(request.user).data)
