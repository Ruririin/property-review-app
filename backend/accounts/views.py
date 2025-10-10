from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer
)

User = get_user_model()


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    User registration endpoint
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User registered successfully. Please log in with your credentials.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    User login endpoint - accepts either email or username
    """
    login_field = request.data.get('email') or request.data.get('username')
    password = request.data.get('password')

    if not login_field or not password:
        return Response({
            'error': 'Email/Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Try to authenticate with email first, then username
    user = None

    # Check if it's an email format
    if '@' in login_field:
        user = authenticate(request, username=login_field, password=password)
    else:
        # Try username authentication
        try:
            user_obj = User.objects.get(username=login_field)
            user = authenticate(request, username=user_obj.email, password=password)
        except User.DoesNotExist:
            pass

    if user is not None:
        login(request, user)
        user_serializer = UserSerializer(user)
        return Response({
            'user': user_serializer.data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    User logout endpoint
    """
    logout(request)
    return Response({
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """
    Update user profile
    """
    serializer = UserProfileSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Change user password
    """
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
