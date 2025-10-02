from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='projects')
router.register(r'slides', views.PropertySlideViewSet, basename='slides')
router.register(r'templates', views.TemplateViewSet, basename='templates')
router.register(r'locations', views.ProjectLocationViewSet, basename='locations')

urlpatterns = [
    # Slide content management endpoints (Comments, Fire Hazard, etc.) - MUST come before router
    path('slides/update-content/', views.update_slide_content_view, name='update_slide_content'),
    path('slides/<uuid:project_id>/<str:slide_id>/content/', views.get_slide_content_view, name='get_slide_content'),
    
    # Image management endpoints - before router
    path('slides/upload-image/', views.upload_slide_image_view, name='upload_slide_image'),
    path('slides/<uuid:project_id>/<str:slide_id>/delete-image/', views.delete_slide_image_view, name='delete_slide_image'),
    
    # Include other slide-specific URLs (this must come after specific slide endpoints but before router)
    path('slides/', include('property_review.slides.urls')),
    
    # Router URLs - comes after specific patterns to avoid conflicts
    path('', include(router.urls)),
    
    path('extract-template/', views.extract_template_view, name='extract_template'),
    path('export-pdf/', views.export_pdf_view, name='export_pdf'),
    path('export-frontend-slides/', views.export_frontend_slides_view, name='export_frontend_slides'),
    path('projects/<uuid:project_id>/export-pdf/', views.export_project_pdf_view, name='export_project_pdf'),
    path('textbox-dimensions/save/', views.save_textbox_dimensions_view, name='save_textbox_dimensions'),
    path('textbox-dimensions/<str:slide_id>/', views.get_textbox_dimensions_view, name='get_textbox_dimensions'),
    
    # Session authentication endpoints
    path('auth/csrf-token/', views.get_csrf_token_view, name='get_csrf_token'),
    path('auth/session-login/', views.session_login_view, name='session_login'),
    path('auth/session-logout/', views.session_logout_view, name='session_logout'),
    path('auth/session-status/', views.session_status_view, name='session_status'),
    
    # Sidebar button API endpoints
    path('location-url/', views.get_location_url_view, name='get_location_url'),
    path('search-business/', views.search_business_view, name='search_business'),

    # Best Places crime data endpoint
    path('best-places/crime-data/', views.get_best_places_crime_data_view, name='get_best_places_crime_data'),
]