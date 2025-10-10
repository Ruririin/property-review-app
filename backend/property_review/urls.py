from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='projects')
router.register(r'project-slides', views.ProjectSlideViewSet, basename='project-slides')
router.register(r'slide-images', views.SlideImageViewSet, basename='slide-images')

urlpatterns = [
    # Router URLs - clean ViewSet-based API
    path('', include(router.urls)),
]