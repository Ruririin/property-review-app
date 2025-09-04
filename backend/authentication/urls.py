from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('check-auth/', views.check_auth_view, name='check_auth'),
    
    
    # Simple session-based authentication
    path('session/login/', views.session_login_view, name='session_login'),
    path('session/status/', views.session_status_view, name='session_status'),
    path('session/logout/', views.session_logout_view, name='session_logout'),
]