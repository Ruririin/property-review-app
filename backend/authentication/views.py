from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import login, logout, get_user_model
from django_ratelimit.decorators import ratelimit
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserProfileSerializer,
    AdminUserSerializer
)
from .models import UserProfile

User = get_user_model()

# CORS headers are now handled by CORS middleware in settings.py
# No need for manual CORS header management

@api_view(['POST'])
@permission_classes([AllowAny])  # Registration must be public
@ratelimit(key='ip', rate='10/h', method='POST')  # SECURITY: Max 10 registrations per hour per IP (increased for development)
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
@ratelimit(key='ip', rate='20/15m', method='POST')  # SECURITY: Max 20 login attempts per 15 minutes per IP (increased for development)
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

        # DEBUG: Log session info before login
        print(f"[AUTH] Before login - Session key: {request.session.session_key}")
        print(f"[AUTH] Session exists: {request.session.exists(request.session.session_key) if request.session.session_key else False}")

        login(request, user)

        # Force session to save
        request.session.save()

        # DEBUG: Log session info after login
        print(f"[AUTH] After login - Session key: {request.session.session_key}")
        print(f"[AUTH] Session modified: {request.session.modified}")
        print(f"[AUTH] User authenticated: {request.user.is_authenticated}")
        print(f"[AUTH] User: {request.user.username}")
        print(f"[AUTH] Session saved: {request.session.session_key is not None}")

        response = Response({
            'success': True,
            'token': 'dummy-auth-token',  # For compatibility with frontend
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

        # DEBUG: Log response cookies (removed emojis for Windows compatibility)
        print(f"Response cookies: {response.cookies}")
        print(f"Session cookie in response: {'sessionid' in response.cookies}")

        return response
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
    try:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        })
    except Exception as e:
        print(f"❌ Error in check_auth_view: {e}")
        import traceback
        traceback.print_exc()
        # Return basic user info even if serializer fails
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': getattr(request.user, 'email', ''),
                'is_staff': getattr(request.user, 'is_staff', False)
            }
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


# ============================================
# USER PROFILE CUSTOMIZATION ENDPOINTS
# ============================================

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get or update user profile customization settings
    GET: Retrieve current user's profile
    PUT/PATCH: Update profile (supports multipart/form-data for image uploads)
    """
    # Get or create profile for current user
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        # Handle image uploads with multipart data
        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=(request.method == 'PATCH'),
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar_view(request):
    """Upload avatar image"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if 'avatar' not in request.FILES:
        return Response({'error': 'No avatar file provided'}, status=status.HTTP_400_BAD_REQUEST)

    profile.avatar = request.FILES['avatar']
    profile.save()

    serializer = UserProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_header_view(request):
    """Upload header image"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if 'header_image' not in request.FILES:
        return Response({'error': 'No header image file provided'}, status=status.HTTP_400_BAD_REQUEST)

    profile.header_image = request.FILES['header_image']
    profile.save()

    serializer = UserProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_background_view(request):
    """Upload background image"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if 'background_image' not in request.FILES:
        return Response({'error': 'No background image file provided'}, status=status.HTTP_400_BAD_REQUEST)

    profile.background_image = request.FILES['background_image']
    profile.background_type = 'image'  # Automatically set to image type
    profile.save()

    serializer = UserProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


# ============================================
# ADMIN USER MANAGEMENT ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    List all users (admin only)
    Only accessible to staff users
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    users = User.objects.all().order_by('-date_joined')
    serializer = AdminUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_role_view(request, user_id):
    """
    Update user role (admin only)
    Allows toggling is_staff status
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent admin from demoting themselves
    if user.id == request.user.id:
        return Response(
            {'error': 'Cannot modify your own admin status'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update is_staff status
    if 'is_staff' in request.data:
        user.is_staff = request.data['is_staff']
        user.save()

    serializer = AdminUserSerializer(user)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_view(request, user_id):
    """
    Delete user account (admin only)
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent admin from deleting themselves
    if user.id == request.user.id:
        return Response(
            {'error': 'Cannot delete your own account'},
            status=status.HTTP_400_BAD_REQUEST
        )

    username = user.username
    user.delete()

    return Response({
        'success': True,
        'message': f'User {username} deleted successfully'
    })
