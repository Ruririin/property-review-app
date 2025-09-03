from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.db import models
import os
import json
import uuid
import subprocess
from pathlib import Path

from .models import Project, PropertySlide, Template, ProjectLocation
from .serializers import ProjectSerializer, PropertySlideSerializer, TemplateSerializer, ProjectLocationSerializer
from .pdf_service import pdf_exporter

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
            return Response({'error': 'Invalid JSON from extraction script'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ViewSets for CRUD operations
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get_queryset(self):
        return Project.objects.all()  # Return all projects for testing
    
    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs[lookup_url_kwarg]
        
        # Try getting by UUID first
        try:
            return Project.objects.get(id=lookup)
        except (ValidationError, Project.DoesNotExist):
            # If it's a numeric ID, try looking up by legacy_id
            if lookup.isdigit():
                project = Project.objects.filter(legacy_id=int(lookup)).first()
                if project:
                    return project
            raise
    
    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs[lookup_url_kwarg]
        
        # Try getting by UUID first
        try:
            return Project.objects.get(id=lookup)
        except (ValidationError, Project.DoesNotExist):
            # If it's a numeric ID, try looking up by legacy_id
            if lookup.isdigit():
                return Project.objects.filter(legacy_id=int(lookup)).first()
            raise
    
    def perform_create(self, serializer):
        # For now, create projects without an owner (since we're allowing AllowAny)
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def toggle_multiple_locations(self, request, pk=None):
        """Toggle multiple locations mode for a project"""
        project = self.get_object()
        project.multipleLocationsMode = not project.multipleLocationsMode
        
        # If enabling multiple locations, create default locations from premise location
        if project.multipleLocationsMode and not project.locations.exists():
            # Try to parse locations from formData.premiseLocation
            premise_location = project.formData.get('premiseLocation', '')
            if premise_location:
                # Split by lines to create separate locations
                location_lines = [line.strip() for line in premise_location.split('\n') if line.strip()]
                for i, location_text in enumerate(location_lines[:5]):  # Limit to 5 locations
                    ProjectLocation.objects.create(
                        project=project,
                        location_index=i,
                        name=f"Location {i + 1}",
                        address=location_text,
                        formData={}
                    )
            
            # If no locations were created, create a default one
            if not project.locations.exists():
                ProjectLocation.objects.create(
                    project=project,
                    location_index=0,
                    name="Main Location",
                    address=project.formData.get('premiseLocation', ''),
                    formData=project.formData.copy()  # Copy existing form data
                )
        
        project.save()
        return Response({
            'multipleLocationsMode': project.multipleLocationsMode,
            'locations': ProjectLocationSerializer(project.locations.all(), many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def set_selected_location(self, request, pk=None):
        """Set the selected location index for a project"""
        project = self.get_object()
        location_index = request.data.get('selectedLocationIndex', 0)
        project.selectedLocationIndex = location_index
        project.save()
        return Response({
            'selectedLocationIndex': project.selectedLocationIndex
        })

class PropertySlideViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySlideSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get_queryset(self):
        # Filter by project if provided
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            try:
                # Try using it as a UUID first
                return PropertySlide.objects.filter(project_id=project_id)
            except ValidationError:
                # Legacy numeric ID support
                if project_id.isdigit():
                    # Find project with legacy ID and get its UUID
                    project = Project.objects.filter(legacy_id=int(project_id)).first()
                    if project:
                        return PropertySlide.objects.filter(project=project)
                return PropertySlide.objects.none()  # Return empty queryset if no match
        return PropertySlide.objects.all()
    
    def perform_create(self, serializer):
        # Ensure formData and fieldPositions are included
        data = self.request.data
        formData = data.get('formData', {})
        fieldPositions = data.get('fieldPositions', {})
        
        # Save the slide with all its data
        serializer.save(
            formData=formData,
            fieldPositions=fieldPositions,
            content=data.get('content', {}),
            field_dimensions=data.get('field_dimensions', {})
        )
    
    def perform_update(self, serializer):
        # Update all fields including formData and fieldPositions
        data = self.request.data
        instance = serializer.save(
            formData=data.get('formData', serializer.instance.formData),
            fieldPositions=data.get('fieldPositions', serializer.instance.fieldPositions),
            content=data.get('content', serializer.instance.content),
            field_dimensions=data.get('field_dimensions', serializer.instance.field_dimensions)
        )

class TemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Template.objects.filter(is_active=True)

class ProjectLocationViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectLocationSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get_queryset(self):
        # Filter by project if provided
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            return ProjectLocation.objects.filter(project_id=project_id)
        return ProjectLocation.objects.all()
    
    def perform_create(self, serializer):
        # Auto-increment location_index for the project
        project_id = serializer.validated_data['project'].id
        max_index = ProjectLocation.objects.filter(project_id=project_id).aggregate(
            models.Max('location_index')
        )['location_index__max']
        next_index = (max_index or -1) + 1
        serializer.save(location_index=next_index)

# PDF Export Views
@api_view(['POST'])
def export_frontend_slides_view(request):
    """
    Export slides from frontend with positioning adjustments
    Specifically handles StreetView and Interior websiteInfo positioning
    """
    try:
        slides_data = request.data.get('slides', [])
        filename = request.data.get('filename', 'Property Review.pdf')
        
        if not slides_data:
            return Response({'error': 'No slides provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use the new frontend slides export method
        pdf_buffer = pdf_exporter.export_frontend_slides(slides_data, filename)
        
        # Create HTTP response with PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def export_pdf_view(request):
    """
    Export slides to PDF - Django backend version
    Accepts slide data and returns generated PDF
    """
    try:
        slides_data = request.data.get('slides', [])
        filename = request.data.get('filename', 'Property Review.pdf')
        export_method = request.data.get('method', 'weasyprint')  # 'weasyprint' or 'reportlab'
        
        if not slides_data:
            return Response({'error': 'No slides provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate PDF
        pdf_buffer = pdf_exporter.export_with_weasyprint(slides_data, filename) \
                    if export_method == 'weasyprint' \
                    else pdf_exporter.export_with_reportlab(slides_data, filename)
        
        # Create HTTP response with PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def export_project_pdf_view(request, project_id):
    """
    Export a specific project's slides to PDF
    """
    try:
        export_method = request.GET.get('method', 'weasyprint')
        
        # Check if user has access to this project
        project = Project.objects.filter(id=project_id, owner=request.user).first()
        if not project:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate PDF
        pdf_buffer = pdf_exporter.export_from_project(project_id, export_method)
        
        filename = f"{project.name.replace(' ', '_')}.pdf"
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Textbox Dimension Persistence Views
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def save_textbox_dimensions_view(request):
    """
    Save textbox dimensions for a specific slide
    """
    try:
        slide_id = request.data.get('slide_id')
        field_dimensions = request.data.get('field_dimensions', {})
        
        if not slide_id:
            return Response({'error': 'slide_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the slide and update its field_dimensions
        try:
            slide = PropertySlide.objects.get(id=slide_id)
        except PropertySlide.DoesNotExist:
            return Response({'error': 'Slide not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update the slide's field_dimensions
        slide.field_dimensions = field_dimensions
        slide.save()
        
        print(f"📥 SAVED textbox dimensions for slide {slide_id}: {field_dimensions}")
        
        return Response({
            'status': 'success',
            'message': 'Textbox dimensions saved',
            'slide_id': slide_id,
            'field_dimensions': field_dimensions
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_textbox_dimensions_view(request, slide_id):
    """
    Get textbox dimensions for a specific slide
    """
    try:
        # If the slide_id is not a valid UUID, return empty dimensions
        try:
            uuid.UUID(str(slide_id))
        except ValueError:
            print(f"📤 Invalid UUID format for slide {slide_id}, returning empty dimensions")
            return Response({
                'slide_id': slide_id,
                'field_dimensions': {}
            })

        try:
            slide = PropertySlide.objects.get(id=slide_id)
            field_dimensions = slide.field_dimensions or {}
        except PropertySlide.DoesNotExist:
            print(f"📤 Slide {slide_id} not found, returning empty dimensions")
            return Response({
                'slide_id': slide_id,
                'field_dimensions': {}
            })
        
        print(f"📤 LOADED textbox dimensions for slide {slide_id}: {field_dimensions}")
        
        return Response({
            'slide_id': slide_id,
            'field_dimensions': field_dimensions
        })
        
    except Exception as e:
        print(f"Error getting textbox dimensions: {str(e)}")
        return Response({
            'error': str(e),
            'slide_id': slide_id,
            'field_dimensions': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
