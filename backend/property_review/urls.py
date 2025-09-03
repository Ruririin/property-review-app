from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='projects')
router.register(r'slides', views.PropertySlideViewSet, basename='slides')
router.register(r'templates', views.TemplateViewSet, basename='templates')
router.register(r'locations', views.ProjectLocationViewSet, basename='locations')

urlpatterns = [
    path('', include(router.urls)),
    path('extract-template/', views.extract_template_view, name='extract_template'),
    path('export-pdf/', views.export_pdf_view, name='export_pdf'),
    path('export-frontend-slides/', views.export_frontend_slides_view, name='export_frontend_slides'),
    path('projects/<uuid:project_id>/export-pdf/', views.export_project_pdf_view, name='export_project_pdf'),
    path('textbox-dimensions/save/', views.save_textbox_dimensions_view, name='save_textbox_dimensions'),
    path('textbox-dimensions/<str:slide_id>/', views.get_textbox_dimensions_view, name='get_textbox_dimensions'),
    path('slides/', include('property_review.slides.urls')),
]