from django.urls import path
from . import views

urlpatterns = [
    # Secure authentication endpoints with password verification
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('check-auth/', views.check_auth_view, name='check_auth'),

    # User profile customization endpoints
    path('user-profile/', views.user_profile_view, name='user_profile'),
    path('user-profile/upload-avatar/', views.upload_avatar_view, name='upload_avatar'),
    path('user-profile/upload-header/', views.upload_header_view, name='upload_header'),
    path('user-profile/upload-background/', views.upload_background_view, name='upload_background'),

    # Admin user management endpoints
    path('admin/users/', views.list_users_view, name='list_users'),
    path('admin/users/<int:user_id>/role/', views.update_user_role_view, name='update_user_role'),
    path('admin/users/<int:user_id>/delete/', views.delete_user_view, name='delete_user'),

    # REMOVED: Insecure session-based authentication endpoints
    # These have been removed for security (allowed login without password):
    # - path('session/login/', views.session_login_view, name='session_login')
    # - path('session/status/', views.session_status_view, name='session_status')
    # - path('session/logout/', views.session_logout_view, name='session_logout')
    #
    # Use the secure endpoints above instead
]