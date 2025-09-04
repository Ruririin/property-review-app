from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
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

# Simple Session-based Authentication (for Property Review App)
@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def session_login_view(request):
    """Simple session login - create or get user by display name"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    display_name = request.data.get('name', '').strip()
    if not display_name:
        response = Response({
            'success': False,
            'error': 'Name is required'
        }, status=status.HTTP_400_BAD_REQUEST)
        return add_cors_headers(response)
    
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
        
        response = Response({
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
        return add_cors_headers(response)
        
    except Exception as e:
        response = Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return add_cors_headers(response)

@api_view(['GET'])
@permission_classes([AllowAny])
def session_status_view(request):
    """Check current session status"""
    if request.user.is_authenticated:
        response = Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'display_name': request.user.first_name or request.user.username,
                'email': request.user.email
            },
            'recent_users': request.session.get('recent_users', [])
        })
        return add_cors_headers(response)
    
    response = Response({
        'authenticated': False,
        'recent_users': request.session.get('recent_users', [])
    })
    return add_cors_headers(response)

@csrf_exempt
@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def session_logout_view(request):
    """Simple session logout"""
    if request.method == 'OPTIONS':
        response = HttpResponse()
        return add_cors_headers(response)
    
    # Keep recent users but clear authentication
    recent_users = request.session.get('recent_users', [])
    logout(request)
    request.session['recent_users'] = recent_users
    
    response = Response({
        'success': True,
        'message': 'Session ended successfully'
    }, status=status.HTTP_200_OK)
    return add_cors_headers(response)

