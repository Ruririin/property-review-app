from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

def add_cors_headers(response):
    """Add CORS headers to response"""
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response

@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
@csrf_exempt
def register_view(request):
    """User registration endpoint"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
        
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        response = Response({
            'success': True,
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
        return add_cors_headers(response)
    response = Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)
    return add_cors_headers(response)

@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """User login endpoint"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
        
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        response = Response({
            'success': True,
            'token': 'dummy-auth-token',  # For compatibility with frontend
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
        return add_cors_headers(response)
    response = Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_401_UNAUTHORIZED)
    return add_cors_headers(response)

@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
@authentication_classes([])
@csrf_exempt
def logout_view(request):
    """User logout endpoint"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
        
    logout(request)
    response = Response({
        'success': True,
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)
    return add_cors_headers(response)

@api_view(['GET'])
def check_auth_view(request):
    """Check authentication status"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        })
    return Response({
        'authenticated': False
    })
