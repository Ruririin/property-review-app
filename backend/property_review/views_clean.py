from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from django.http import JsonResponse
from django.conf import settings
import os
import json
import subprocess

from .models import Project, ProjectSlide, ProjectLocation, SlideImage, ProjectSettings, Template
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer, ProjectListSerializer,
    ProjectSlideSerializer, SlideListSerializer, ProjectLocationSerializer,
    SlideImageSerializer, ProjectSettingsSerializer, TemplateSerializer
)
from .pdf_service import pdf_exporter
from .best_places_service import best_places_service

class ProjectViewSet(viewsets.ModelViewSet):
    """
    CLEAN Project API - No more data duplication issues
    """
    queryset = Project.objects.all()
    permission_classes = [AllowAny]  # Adjust as needed
    
    def get_serializer_class(self):
        """
        Use different serializers based on action for performance
        """
        if self.action == 'list':
            return ProjectListSerializer  # Lightweight for listings
        elif self.action == 'retrieve':
            return ProjectDetailSerializer  # Full data for single project
        else:
            return ProjectSerializer  # Standard for create/update
    
    def get_queryset(self):
        """
        Optimize queries based on action
        """
        if self.action == 'list':
            # For listings, just count slides - don't load them
            return Project.objects.prefetch_related('slides').all()
        elif self.action == 'retrieve':
            # For single project, load everything efficiently
            return Project.objects.prefetch_related(
                Prefetch('slides', queryset=ProjectSlide.objects.select_related().prefetch_related('images')),
                'locations',
                'settings'
            ).all()
        else:
            return Project.objects.all()
    
    @action(detail=True, methods=['get'])
    def slides(self, request, pk=None):
        """
        Get all slides for a project - EFFICIENT LOADING
        /api/projects/{id}/slides/
        """
        project = self.get_object()
        slides = project.slides.prefetch_related('images').all()
        serializer = ProjectSlideSerializer(slides, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def slide_list(self, request, pk=None):
        """
        Get slide metadata only (no content) - SUPER FAST
        /api/projects/{id}/slide_list/
        """
        project = self.get_object()
        slides = project.slides.all()
        serializer = SlideListSerializer(slides, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplicate entire project efficiently
        """
        original = self.get_object()
        
        # Create new project
        new_project = Project.objects.create(
            title=f"{original.title} (Copy)",
            description=original.description,
            status='draft',
            multiple_locations_mode=original.multiple_locations_mode,
            show_website=original.show_website,
            owner=request.user if request.user.is_authenticated else None
        )
        
        # Copy all slides
        for slide in original.slides.all():
            ProjectSlide.objects.create(
                project=new_project,
                slide_number=slide.slide_number,
                slide_type=slide.slide_type,
                title=slide.title,
                content=slide.content,
                field_positions=slide.field_positions
            )
        
        serializer = ProjectSerializer(new_project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProjectSlideViewSet(viewsets.ModelViewSet):
    """
    Individual Slide Management - CLEAN & EFFICIENT
    """
    serializer_class = ProjectSlideSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return ProjectSlide.objects.filter(project_id=project_id).prefetch_related('images')
        return ProjectSlide.objects.all().prefetch_related('images')
    
    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        project = get_object_or_404(Project, pk=project_id)
        serializer.save(project=project)
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, project_pk=None, pk=None):
        """
        Upload image to specific slide
        """
        slide = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_data = {
            'slide': slide.id,
            'image': request.FILES['image'],
            'filename': request.FILES['image'].name,
            'alt_text': request.data.get('alt_text', ''),
            'position_x': float(request.data.get('position_x', 0)),
            'position_y': float(request.data.get('position_y', 0)),
            'width': float(request.data.get('width', 200)),
            'height': float(request.data.get('height', 150)),
            'z_index': int(request.data.get('z_index', 1))
        }
        
        image_serializer = SlideImageSerializer(data=image_data)
        if image_serializer.is_valid():
            image = image_serializer.save()
            return Response(SlideImageSerializer(image, context={'request': request}).data, 
                          status=status.HTTP_201_CREATED)
        else:
            return Response(image_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SlideImageViewSet(viewsets.ModelViewSet):
    """
    Slide Image Management
    """
    serializer_class = SlideImageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        slide_id = self.kwargs.get('slide_pk')
        if slide_id:
            return SlideImage.objects.filter(slide_id=slide_id)
        return SlideImage.objects.all()

# Simple function-based views for specific operations
@api_view(['GET'])
def project_stats(request, project_id):
    """
    Get project statistics efficiently
    """
    try:
        project = Project.objects.prefetch_related('slides').get(pk=project_id)
        
        stats = {
            'slide_count': project.slides.count(),
            'slide_types': list(project.slides.values_list('slide_type', flat=True).distinct()),
            'last_updated': project.updated_at,
            'status': project.status,
            'has_images': project.slides.filter(images__isnull=False).exists()
        }
        
        return Response(stats)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def bulk_save_slides(request, project_id):
    """
    Save multiple slides efficiently in one transaction
    """
    try:
        project = get_object_or_404(Project, pk=project_id)
        slides_data = request.data.get('slides', [])
        
        updated_slides = []
        for slide_data in slides_data:
            slide_number = slide_data.get('slide_number')
            
            # Get or create slide
            slide, created = ProjectSlide.objects.get_or_create(
                project=project,
                slide_number=slide_number,
                defaults={
                    'slide_type': slide_data.get('slide_type', 'custom'),
                    'title': slide_data.get('title', f'Slide {slide_number}')
                }
            )
            
            # Update content
            slide.content = slide_data.get('content', {})
            slide.field_positions = slide_data.get('field_positions', {})
            slide.title = slide_data.get('title', slide.title)
            slide.save()
            
            updated_slides.append(slide)
        
        # Update project timestamp
        project.save()
        
        serializer = ProjectSlideSerializer(updated_slides, many=True, context={'request': request})
        return Response({
            'message': f'Successfully saved {len(updated_slides)} slides',
            'slides': serializer.data
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Legacy views for backward compatibility
class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [AllowAny]

# PPTX Template extraction (equivalent to Express route)
@api_view(['GET'])
def extract_template_view(request):
    """Extract content from PPTX template"""
    try:
        # Path to PPTX template (adjust as needed)
        pptx_path = os.path.join(settings.BASE_DIR.parent, 'backend', 'pptx', 'template.pptx')
        script_path = os.path.join(settings.BASE_DIR.parent, 'backend', 'pptx', 'extract_pptx_text.py')
        
        if not os.path.exists(pptx_path):
            return Response({'error': 'Template file not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Execute Python script
        result = subprocess.run(['python', script_path, pptx_path], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            return Response({'error': 'Failed to extract PPTX content'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Parse JSON output
        try:
            extracted_data = json.loads(result.stdout)
            return Response(extracted_data)
        except json.JSONDecodeError:
            return Response({'error': 'Failed to parse extracted content'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Best Places integration
@api_view(['GET'])
def get_best_places_data(request, zip_code):
    """Get Best Places crime data for a ZIP code"""
    try:
        data = best_places_service.get_crime_data(zip_code)
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# PDF export
@api_view(['POST'])
def export_project_pdf(request, project_id):
    """Export project to PDF"""
    try:
        project = get_object_or_404(Project, pk=project_id)
        pdf_data = pdf_exporter.export_project(project)
        
        response = JsonResponse({'pdf_url': pdf_data['url']})
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
