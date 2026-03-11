from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from django.middleware.csrf import get_token
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
import os
import json
import uuid
import subprocess
import base64
import logging
from pathlib import Path
from PIL import Image
import io

logger = logging.getLogger(__name__)

from .models import Project, PropertySlide, Template, ProjectLocation, ExportedPDF
from .serializers import ProjectSerializer, LightProjectSerializer, PropertySlideSerializer, TemplateSerializer, ProjectLocationSerializer, ExportedPDFSerializer
from .pdf_service import pdf_exporter

# PPTX Template extraction (equivalent to Express route)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def extract_template_view(request):
    """Extract content from PPTX template"""
    try:
        # Path to PPTX template (adjust as needed)
        pptx_path = os.path.join(settings.BASE_DIR.parent, 'backend', 'pptx', 'template.pptx')
        script_path = os.path.join(settings.BASE_DIR.parent, 'backend', 'pptx', 'extract_pptx_text.py')

        # SECURITY: Validate paths are within expected directory to prevent path traversal
        base_dir = os.path.abspath(settings.BASE_DIR.parent)
        abs_pptx_path = os.path.abspath(pptx_path)
        abs_script_path = os.path.abspath(script_path)

        if not abs_pptx_path.startswith(base_dir) or not abs_script_path.startswith(base_dir):
            return Response({
                'error': 'Invalid file path'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not os.path.exists(pptx_path):
            return Response({
                'error': 'Template file not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if not os.path.exists(script_path):
            return Response({
                'error': 'Extraction script not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # SECURITY: Execute Python script with timeout to prevent hanging
        try:
            result = subprocess.run(
                ['python', script_path, pptx_path],
                capture_output=True,
                text=True,
                timeout=30,  # 30 second timeout
                shell=False  # Never use shell=True for security
            )
        except subprocess.TimeoutExpired:
            return Response({
                'error': 'PPTX extraction timed out (exceeded 30 seconds)'
            }, status=status.HTTP_408_REQUEST_TIMEOUT)

        if result.returncode != 0:
            return Response({
                'error': 'Failed to extract PPTX content',
                'details': result.stderr if result.stderr else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Parse JSON output
        try:
            extracted_data = json.loads(result.stdout)
            return Response(extracted_data)
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid JSON from extraction script'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ViewSets for CRUD operations - OPTIMIZED FOR PERFORMANCE
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer  # Default serializer
    permission_classes = [IsAuthenticated]  # Require authentication
    
    def get_serializer_class(self):
        """Use lightweight serializer for list, full serializer for details"""
        if self.action == 'list':
            return LightProjectSerializer  # 46MB -> 1-2MB improvement!
        return ProjectSerializer
    
    def get_queryset(self):
        # Only return projects owned by the current user
        return Project.objects.filter(owner=self.request.user)
    
    def get_object(self):
        from rest_framework.exceptions import NotFound, PermissionDenied

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs[lookup_url_kwarg]

        # Try getting by UUID first
        try:
            project = Project.objects.get(id=lookup)
        except (ValidationError, Project.DoesNotExist):
            # If it's a numeric ID, try looking up by legacy_id
            if lookup.isdigit():
                project = Project.objects.filter(legacy_id=int(lookup)).first()
                if not project:
                    raise NotFound(f"Project with id '{lookup}' does not exist.")
            else:
                raise NotFound(f"Project with id '{lookup}' does not exist.")

        # For write operations, require ownership (admin can change status on any project)
        if self.action in ['update', 'partial_update', 'destroy']:
            if project.owner != self.request.user and not self.request.user.is_staff:
                raise PermissionDenied("You can only modify your own projects.")

        # For read operations on personal drafts, only the owner can view
        if project.status == 'personal_draft' and project.owner != self.request.user:
            raise PermissionDenied("This project is not accessible.")

        return project
    
    def perform_create(self, serializer):
        # Set the owner to the current user
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        """Validate status transitions based on user role"""
        new_status = serializer.validated_data.get('status')
        if new_status:
            admin_only_statuses = ['approved', 'denied', 'conditional']
            user_only_statuses = ['personal_draft', 'global_draft', 'for_review']

            if new_status in admin_only_statuses and not self.request.user.is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Only admins can set this status.")

            if new_status in user_only_statuses and self.request.user.is_staff:
                # Admin can also use these if they own the project
                project = serializer.instance
                if project.owner != self.request.user:
                    pass  # Allow admin to view but not change to user statuses on others' projects

            # Clear status_note when moving away from denied/conditional
            if new_status not in ['denied', 'conditional']:
                serializer.validated_data['status_note'] = ''

        serializer.save()

    # ---- Tab-based project listing endpoints ----

    @action(detail=False, methods=['get'], url_path='global-drafts')
    def global_drafts(self, request):
        """All projects in global_draft, denied, or conditional status — visible to ALL users"""
        projects = Project.objects.filter(
            status__in=['global_draft', 'denied', 'conditional']
        ).select_related('owner').order_by(
            models.Case(
                models.When(status='denied', then=0),
                models.When(status='conditional', then=1),
                models.When(status='global_draft', then=2),
                output_field=models.IntegerField(),
            ),
            '-updated_at'
        )
        serializer = LightProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='personal-drafts')
    def personal_drafts(self, request):
        """Only current user's personal draft projects"""
        projects = Project.objects.filter(
            owner=request.user,
            status__in=['personal_draft', 'editing', 'draft']  # Include legacy statuses
        ).order_by('-updated_at')
        serializer = LightProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='for-review')
    def for_review(self, request):
        """All projects submitted for review — visible to ALL users"""
        projects = Project.objects.filter(
            status='for_review'
        ).select_related('owner').order_by('-updated_at')
        serializer = LightProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='approved-list')
    def approved_list(self, request):
        """All approved projects — auto-cleans expired ones (exported_at + 7 days)"""
        from django.utils import timezone as tz
        from datetime import timedelta

        # Auto-delete expired projects (exported > 7 days ago)
        expired = Project.objects.filter(
            status='approved',
            exported_at__isnull=False,
            exported_at__lt=tz.now() - timedelta(days=7)
        )
        expired_count = expired.count()
        if expired_count > 0:
            expired.delete()
            logger.info(f"Auto-deleted {expired_count} expired approved projects")

        projects = Project.objects.filter(
            status='approved'
        ).select_related('owner').order_by('-updated_at')
        serializer = LightProjectSerializer(projects, many=True)
        return Response(serializer.data)

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
    permission_classes = [IsAuthenticated]  # Require authentication
    
    def get_queryset(self):
        # Filter by project if provided - SECURED: Only user's projects
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            try:
                # Try using it as a UUID first - SECURED: Check ownership
                return PropertySlide.objects.filter(
                    project_id=project_id,
                    project__owner=self.request.user
                )
            except ValidationError:
                # Legacy numeric ID support - SECURED: Check ownership
                if project_id.isdigit():
                    # Find project with legacy ID and get its UUID
                    project = Project.objects.filter(
                        legacy_id=int(project_id),
                        owner=self.request.user
                    ).first()
                    if project:
                        return PropertySlide.objects.filter(project=project)
                return PropertySlide.objects.none()  # Return empty queryset if no match
        # Return all slides from user's projects
        return PropertySlide.objects.filter(project__owner=self.request.user)
    
    def perform_create(self, serializer):
        # PropertySlide model only has 'content' and 'field_positions' fields
        # The serializer already handles validation, just save
        serializer.save()

    def perform_update(self, serializer):
        # PropertySlide model only has 'content' and 'field_positions' fields
        # The serializer already handles validation, just save
        serializer.save()

class TemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Template.objects.filter(is_active=True)

class ProjectLocationViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectLocationSerializer
    permission_classes = [IsAuthenticated]  # Require authentication
    
    def get_queryset(self):
        # Filter by project if provided - SECURED: Only user's projects
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            return ProjectLocation.objects.filter(
                project_id=project_id,
                project__owner=self.request.user
            )
        # Return all locations from user's projects
        return ProjectLocation.objects.filter(project__owner=self.request.user)
    
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_pdf_view(request):
    """
    Preview slides as PDF (inline viewing) - Django backend version
    Accepts slide data and returns generated PDF for inline viewing
    """
    try:
        slides_data = request.data.get('slides', [])
        filename = request.data.get('filename', 'Property Review Preview.pdf')
        export_method = request.data.get('method', 'weasyprint')  # 'weasyprint' or 'reportlab'

        if not slides_data:
            return Response({'error': 'No slides provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate PDF
        pdf_buffer = pdf_exporter.export_with_weasyprint(slides_data, filename) \
                    if export_method == 'weasyprint' \
                    else pdf_exporter.export_with_reportlab(slides_data, filename)

        # Create HTTP response with PDF for inline viewing
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'

        return response

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def preview_project_pdf_view(request, project_id):
    """
    Preview a specific project's slides as PDF (inline viewing)
    """
    try:
        export_method = request.GET.get('method', 'weasyprint')

        # Check if user has access to this project
        project = Project.objects.filter(id=project_id, owner=request.user).first()
        if not project:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        # Generate PDF
        pdf_buffer = pdf_exporter.export_from_project(project_id, export_method)

        filename = f"{project.name.replace(' ', '_')}_Preview.pdf"
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'

        return response

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Textbox Dimension Persistence Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_textbox_dimensions_view(request):
    """
    Save textbox dimensions for a specific slide
    """
    try:
        slide_id = request.data.get('slide_id')
        field_positions = request.data.get('field_positions', {})

        if not slide_id:
            return Response({'error': 'slide_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Find the slide and update its field_positions - SECURED: Check ownership
        try:
            slide = PropertySlide.objects.get(id=slide_id, project__owner=request.user)
        except PropertySlide.DoesNotExist:
            return Response({'error': 'Slide not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update the slide's field_positions
        slide.field_positions = field_positions
        slide.save()

        print(f"SAVED textbox positions for slide {slide_id}: {field_positions}")

        return Response({
            'status': 'success',
            'message': 'Textbox positions saved',
            'slide_id': slide_id,
            'field_positions': field_positions
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_textbox_dimensions_view(request, slide_id):
    """
    Get textbox dimensions for a specific slide
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(str(slide_id))
        except (ValueError, TypeError):
            return Response({
                'slide_id': str(slide_id),
                'field_dimensions': {}
            })

        # Try to get the slide - SECURED: Check ownership
        try:
            slide = PropertySlide.objects.get(id=slide_id, project__owner=request.user)
            field_dimensions = slide.field_dimensions or {}
            return Response({
                'slide_id': str(slide_id),
                'field_dimensions': field_dimensions
            })
        except PropertySlide.DoesNotExist:
            return Response({
                'slide_id': str(slide_id),
                'field_dimensions': {}
            })
    except:
        # Any error - return empty dimensions with 200 status
        return Response({
            'slide_id': str(slide_id),
            'field_dimensions': {}
        })

# Image Upload and Management Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_slide_image_view(request):
    """
    Generalized image upload for any slide
    Handles clipboard paste data (base64) and returns image metadata
    """
    try:
        project_id = request.data.get('project_id')
        slide_id = request.data.get('slide_id') 
        image_data = request.data.get('image_data')  # Base64 string
        slide_type = request.data.get('slide_type', 'default')
        
        if not all([project_id, slide_id, image_data]):
            return Response({
                'error': 'project_id, slide_id, and image_data are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate project exists - SECURED: Check ownership
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({
                'error': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Process base64 image data
        try:
            # Remove data:image/jpeg;base64, prefix if present
            if ',' in image_data:
                format_part, image_data = image_data.split(',', 1)
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Get original dimensions
            original_width, original_height = image.size
            aspect_ratio = original_width / original_height
            
            # Calculate optimal size and position based on slide type (using same logic as frontend)
            if slide_type in ['aerial', 'street']:
                # For aerial/street views - use the dedicated map area (1064x504)
                max_width = 1064
                max_height = 504
                map_area_aspect_ratio = max_width / max_height
                
                if aspect_ratio > map_area_aspect_ratio:
                    new_width = max_width
                    new_height = max_width / aspect_ratio
                else:
                    new_height = max_height
                    new_width = max_height * aspect_ratio
                
                # Position in center of map area
                position_x = 108 + (max_width - new_width) / 2
                position_y = 108 + (max_height - new_height) / 2
            else:
                # For other slides - use conservative sizing
                max_width = 600
                max_height = 400
                
                if original_width > max_width or original_height > max_height:
                    scale_x = max_width / original_width
                    scale_y = max_height / original_height
                    scale = min(scale_x, scale_y)
                    
                    new_width = original_width * scale
                    new_height = original_height * scale
                else:
                    new_width = max(150, min(original_width, max_width))
                    new_height = max(100, min(original_height, max_height))
                
                # Center in slide
                position_x = (1280 - new_width) / 2
                position_y = max(150, (720 - new_height) / 2)
            
            # Create unique filename
            file_extension = image.format.lower() if image.format else 'png'
            filename = f'slide_images/{project_id}/{slide_id}_{uuid.uuid4().hex}.{file_extension}'
            
            # Save image to storage
            image_file = io.BytesIO()
            image.save(image_file, format=image.format or 'PNG')
            image_file.seek(0)
            
            file_path = default_storage.save(filename, ContentFile(image_file.read()))
            image_url = default_storage.url(file_path)
            
            # Return image metadata
            return Response({
                'success': True,
                'image_data': {
                    'src': image_url,
                    'width': new_width,
                    'height': new_height,
                    'aspectRatio': aspect_ratio,
                    'originalWidth': original_width,
                    'originalHeight': original_height,
                    'filename': filename
                },
                'image_position': {
                    'top': position_y,
                    'left': position_x
                },
                'file_path': file_path
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Error processing image: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_slide_image_view(request, project_id, slide_id):
    """
    Delete image for a specific slide
    """
    try:
        # SECURED: Verify project ownership before deleting
        try:
            Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({
                'error': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get the file path from request data
        file_path = request.data.get('file_path')

        if not file_path:
            return Response({
                'error': 'File path required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY: Prevent path traversal attacks
        if '..' in file_path or file_path.startswith('/'):
            return Response({
                'error': 'Invalid file path'
            }, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY: Verify file path belongs to this project
        # Expected path format: slide_images/{project_id}/{slide_id}_*
        import os
        normalized_path = os.path.normpath(file_path)
        expected_prefix = f"slide_images/{project_id}/"

        if not normalized_path.startswith(expected_prefix):
            return Response({
                'error': 'Unauthorized: File does not belong to this project'
            }, status=status.HTTP_403_FORBIDDEN)

        if file_path and default_storage.exists(file_path):
            default_storage.delete(file_path)

        return Response({
            'success': True,
            'message': 'Image deleted successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error deleting slide image: {str(e)}")
        return Response({
            'error': 'Failed to delete image'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# CSRF Token View
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token_view(request):
    """
    Get CSRF token for session-based authentication
    """
    return JsonResponse({
        'csrf_token': get_token(request)
    })

# REMOVED: Insecure Session Authentication
# The following insecure endpoints have been removed for security:
# - session_login_view (allowed login without password)
# - session_logout_view
# - session_status_view
#
# SECURITY FIX: These endpoints allowed authentication without password verification,
# which is a critical security vulnerability.
#
# USE INSTEAD: Secure authentication endpoints in authentication app:
# - POST /api/auth/session-login/ (with proper authentication)
# - POST /api/auth/session-logout/
# - GET /api/auth/session-status/
#
# See: backend/authentication/views.py for secure implementation

# Sidebar Button API Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_location_url_view(request):
    """
    Generate URLs for location-based services (Google Maps, Bing Maps, Fire Hazard)
    Handles multiple locations mode and selected location index
    """
    try:
        project_id = request.data.get('project_id')
        service_type = request.data.get('service_type')  # 'google_maps', 'bing_maps', 'fire_hazard'

        if not all([project_id, service_type]):
            return Response({
                'error': 'project_id and service_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get project - SECURED: Check ownership
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({
                'error': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Determine the location to use
        location = ''
        
        if project.multipleLocationsMode:
            # Get the selected location from project locations
            selected_location = project.locations.filter(
                location_index=project.selectedLocationIndex
            ).first()
            
            if selected_location:
                location = selected_location.address
            else:
                # Fallback to first location if selected index doesn't exist
                first_location = project.locations.first()
                location = first_location.address if first_location else ''
        else:
            # Use premise location from formData
            location = project.formData.get('premiseLocation', '')
        
        # Parse multiple locations if needed (handle line-separated locations)
        if '\n' in location:
            locations = [line.strip() for line in location.split('\n') if line.strip()]
            if locations:
                if project.multipleLocationsMode and project.selectedLocationIndex < len(locations):
                    location = locations[project.selectedLocationIndex]
                else:
                    location = locations[0]
        
        if not location.strip():
            return Response({
                'error': 'No location available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate URL based on service type
        from urllib.parse import quote
        import re
        encoded_location = quote(location.strip())
        
        # Standard service URLs for all services
        service_urls = {
            'google_maps': f'https://www.google.com/maps/search/?api=1&query={encoded_location}',
            'bing_maps': f'https://www.bing.com/maps?q={encoded_location}',
            'fire_hazard': f'https://www.google.com/search?q=fire+hazard+near+{encoded_location}',
            'fire_station': f'https://www.google.com/search?q=fire+station+near+{encoded_location}',
        }
        
        service_url = service_urls.get(service_type)
        if not service_url:
            return Response({
                'error': f'Unknown service type: {service_type}'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'service_type': service_type,
            'location': location,
            'url': service_url
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_business_view(request):
    """
    Generate business search URL for the selected location
    """
    try:
        project_id = request.data.get('project_id')
        
        if not project_id:
            return Response({
                'error': 'project_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get project - SECURED: Check ownership
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({
                'error': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Determine the location to use
        location = ''
        
        if project.multipleLocationsMode:
            # Get the selected location from project locations
            selected_location = project.locations.filter(
                location_index=project.selectedLocationIndex
            ).first()
            
            if selected_location:
                location = selected_location.address
            else:
                # Fallback to first location if selected index doesn't exist
                first_location = project.locations.first()
                location = first_location.address if first_location else ''
        else:
            # Use premise location from formData
            location = project.formData.get('premiseLocation', '')
        
        # Parse multiple locations if needed (handle line-separated locations)
        if '\n' in location:
            locations = [line.strip() for line in location.split('\n') if line.strip()]
            if locations:
                if project.multipleLocationsMode and project.selectedLocationIndex < len(locations):
                    location = locations[project.selectedLocationIndex]
                else:
                    location = locations[0]
        
        if not location.strip():
            return Response({
                'error': 'No location available for business search'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate business search URL
        from urllib.parse import quote
        encoded_location = quote(location.strip())
        business_search_url = f'https://www.google.com/search?q=businesses+near+{encoded_location}'
        
        return Response({
            'success': True,
            'location': location,
            'url': business_search_url
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Comments and Fire Hazard Slide Management APIs
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_slide_content_view(request):
    """
    Update slide content and field positions for Comments, Fire Hazard, and other slides
    Handles both content updates and textbox positioning
    """
    try:
        from .utils.validators import validate_json_data
        from rest_framework.exceptions import ValidationError as DRFValidationError

        project_id = request.data.get('project_id')
        slide_id = request.data.get('slide_id')
        slide_type = request.data.get('slide_type')  # 'comments', 'fire_hazard', etc.
        content_updates = request.data.get('content', {})
        field_positions = request.data.get('field_positions', {})

        if not all([project_id, slide_id, slide_type]):
            return Response({
                'error': 'project_id, slide_id, and slide_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY: Validate JSON payload size and depth to prevent DoS attacks
        try:
            if content_updates:
                validate_json_data(content_updates, max_size_bytes=524288, max_depth=10)  # 512KB max
            if field_positions:
                validate_json_data(field_positions, max_size_bytes=262144, max_depth=5)  # 256KB max
        except DRFValidationError as e:
            return Response({
                'error': f'Invalid request data: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get project - SECURED: Check ownership
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({
                'error': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Update project slideData with the new content and positions
        slide_data = project.slideData or {}

        # Initialize slide-specific data if it doesn't exist
        if slide_id not in slide_data:
            slide_data[slide_id] = {}

        # Update content (comments, fire hazard data, etc.)
        if content_updates:
            slide_data[slide_id]['content'] = {
                **slide_data[slide_id].get('content', {}),
                **content_updates
            }

        # Update field positions (textbox dimensions and positions)
        if field_positions:
            slide_data[slide_id]['fieldPositions'] = {
                **slide_data[slide_id].get('fieldPositions', {}),
                **field_positions
            }

        # Save back to project
        project.slideData = slide_data
        project.save()

        return Response({
            'success': True,
            'message': f'{slide_type} slide updated successfully',
            'slide_data': slide_data[slide_id]
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_slide_content_view(request, project_id, slide_id):
    """
    Get slide content and field positions for Comments, Fire Hazard, and other slides
    """
    try:
        # Get project - SECURED: Check ownership
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({
                'error': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get slide data
        slide_data = project.slideData or {}
        slide_content = slide_data.get(slide_id, {})
        
        return Response({
            'slide_id': slide_id,
            'content': slide_content.get('content', {}),
            'field_positions': slide_content.get('fieldPositions', {}),
            'slide_data': slide_content
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================
# Exported PDF endpoints
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_exported_pdfs_view(request):
    """List all exported PDFs for the current user (or all exports if admin)"""
    # Admin can see all exports, regular users see only their own
    if request.user.is_staff:
        exports = ExportedPDF.objects.all()
    else:
        exports = ExportedPDF.objects.filter(owner=request.user)

    serializer = ExportedPDFSerializer(exports, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_exported_pdf_view(request):
    """Upload an exported PDF file and save metadata"""
    try:
        pdf_file = request.FILES.get('pdf_file')
        filename = request.data.get('filename', 'Property_Review.pdf')
        project_name = request.data.get('project_name', 'Untitled Project')
        project_id = request.data.get('project_id')

        if not pdf_file:
            return Response({'error': 'pdf_file is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate it's a PDF
        if not pdf_file.content_type == 'application/pdf':
            return Response({'error': 'File must be a PDF'}, status=status.HTTP_400_BAD_REQUEST)

        # Max 20MB for exported PDFs
        if pdf_file.size > 20 * 1024 * 1024:
            return Response({'error': 'PDF file too large (max 20MB)'}, status=status.HTTP_400_BAD_REQUEST)

        # Save file to media storage
        safe_filename = f"exported_pdfs/{request.user.id}/{uuid.uuid4().hex}.pdf"
        file_path = default_storage.save(safe_filename, ContentFile(pdf_file.read()))

        # Look up project if ID provided
        project = None
        if project_id:
            try:
                project = Project.objects.get(id=project_id, owner=request.user)
            except Project.DoesNotExist:
                pass

        exported_pdf = ExportedPDF.objects.create(
            owner=request.user,
            project=project,
            filename=filename,
            project_name=project_name,
            file_path=file_path,
            file_size=pdf_file.size
        )

        # Set exported_at on the project for the 1-week auto-delete countdown
        if project:
            from django.utils import timezone as tz
            project.exported_at = tz.now()
            project.save(update_fields=['exported_at'])

        serializer = ExportedPDFSerializer(exported_pdf, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error uploading exported PDF: {str(e)}")
        return Response({'error': 'Failed to upload PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_exported_pdf_view(request, export_id):
    """Delete an exported PDF (owner or admin)"""
    try:
        # Admin can delete any export, regular users can only delete their own
        if request.user.is_staff:
            exported_pdf = ExportedPDF.objects.get(id=export_id)
        else:
            exported_pdf = ExportedPDF.objects.get(id=export_id, owner=request.user)

        # Delete the file from storage
        if exported_pdf.file_path and default_storage.exists(exported_pdf.file_path):
            default_storage.delete(exported_pdf.file_path)

        exported_pdf.delete()
        return Response({'success': True}, status=status.HTTP_200_OK)

    except ExportedPDF.DoesNotExist:
        return Response({'error': 'Export not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting exported PDF: {str(e)}")
        return Response({'error': 'Failed to delete export'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.views.decorators.clickjacking import xframe_options_sameorigin

@xframe_options_sameorigin
def serve_exported_pdf_view(request, export_id):
    """Serve an exported PDF file — plain Django view (not DRF) to avoid auth redirects in iframes"""
    if not request.user.is_authenticated:
        return HttpResponse('Unauthorized', status=401, content_type='text/plain')

    try:
        exported_pdf = ExportedPDF.objects.get(id=export_id, owner=request.user)

        if not exported_pdf.file_path or not default_storage.exists(exported_pdf.file_path):
            return HttpResponse('File not found', status=404, content_type='text/plain')

        file_content = default_storage.open(exported_pdf.file_path).read()
        response = HttpResponse(file_content, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{exported_pdf.filename}"'
        return response

    except ExportedPDF.DoesNotExist:
        return HttpResponse('Not found', status=404, content_type='text/plain')
    except Exception as e:
        logger.error(f"Error serving exported PDF: {str(e)}")
        return HttpResponse('Server error', status=500, content_type='text/plain')