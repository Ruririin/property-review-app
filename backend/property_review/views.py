from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
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
from pathlib import Path
from PIL import Image
import io

from .models import Project, PropertySlide, Template, ProjectLocation
from .serializers import ProjectSerializer, LightProjectSerializer, PropertySlideSerializer, TemplateSerializer, ProjectLocationSerializer
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

# ViewSets for CRUD operations - OPTIMIZED FOR PERFORMANCE
@method_decorator(csrf_exempt, name='dispatch')
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer  # Default serializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get_serializer_class(self):
        """Use lightweight serializer for list, full serializer for details"""
        if self.action == 'list':
            return LightProjectSerializer  # 46MB -> 1-2MB improvement!
        return ProjectSerializer
    
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

@method_decorator(csrf_exempt, name='dispatch')
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

@method_decorator(csrf_exempt, name='dispatch')
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

@api_view(['POST'])
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
        
        print(f"SAVED textbox dimensions for slide {slide_id}: {field_dimensions}")
        
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
        # Validate UUID format
        try:
            uuid.UUID(str(slide_id))
        except (ValueError, TypeError):
            return Response({
                'slide_id': str(slide_id),
                'field_dimensions': {}
            })

        # Try to get the slide
        try:
            slide = PropertySlide.objects.get(id=slide_id)
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
@permission_classes([AllowAny])
@csrf_exempt
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
        
        # Validate project exists
        try:
            project = Project.objects.get(id=project_id)
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
@permission_classes([AllowAny])
@csrf_exempt
def delete_slide_image_view(request, project_id, slide_id):
    """
    Delete image for a specific slide
    """
    try:
        # Get the file path from request data
        file_path = request.data.get('file_path')
        
        if file_path and default_storage.exists(file_path):
            default_storage.delete(file_path)
        
        return Response({
            'success': True,
            'message': 'Image deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
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

# Session Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def session_login_view(request):
    """
    Session-based authentication for session user picker
    """
    try:
        username = request.data.get('username')
        
        if not username:
            return Response({
                'error': 'Username is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # For now, we'll create a simple session without password verification
        # In production, you'd want proper authentication
        request.session['session_user'] = username
        request.session['is_authenticated'] = True
        
        return Response({
            'success': True,
            'username': username,
            'session_id': request.session.session_key
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def session_logout_view(request):
    """
    Logout and clear session
    """
    try:
        request.session.flush()
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def session_status_view(request):
    """
    Check session status
    """
    try:
        is_authenticated = request.session.get('is_authenticated', False)
        username = request.session.get('session_user', None)
        
        return Response({
            'is_authenticated': is_authenticated,
            'username': username,
            'session_id': request.session.session_key
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Sidebar Button API Views
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def get_location_url_view(request):
    """
    Generate URLs for location-based services (Google Maps, Bing Maps, Fire Hazard)
    Handles multiple locations mode and selected location index
    """
    try:
        project_id = request.data.get('project_id')
        service_type = request.data.get('service_type')  # 'google_maps', 'bing_maps', 'fire_hazard'
        
        print(f"🔍 Location URL request - Project: {project_id}, Service: {service_type}")
        
        if not all([project_id, service_type]):
            return Response({
                'error': 'project_id and service_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get project
        try:
            project = Project.objects.get(id=project_id)
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
        
        print(f"🌐 Generated URL for {service_type}: {service_url}")
        
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
@permission_classes([AllowAny])
@csrf_exempt
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
        
        # Get project
        try:
            project = Project.objects.get(id=project_id)
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
@permission_classes([AllowAny])
@csrf_exempt
def update_slide_content_view(request):
    """
    Update slide content and field positions for Comments, Fire Hazard, and other slides
    Handles both content updates and textbox positioning
    """
    try:
        project_id = request.data.get('project_id')
        slide_id = request.data.get('slide_id')
        slide_type = request.data.get('slide_type')  # 'comments', 'fire_hazard', etc.
        content_updates = request.data.get('content', {})
        field_positions = request.data.get('field_positions', {})
        
        if not all([project_id, slide_id, slide_type]):
            return Response({
                'error': 'project_id, slide_id, and slide_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get project
        try:
            project = Project.objects.get(id=project_id)
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
@permission_classes([AllowAny])
def get_slide_content_view(request, project_id, slide_id):
    """
    Get slide content and field positions for Comments, Fire Hazard, and other slides
    """
    try:
        # Get project
        try:
            project = Project.objects.get(id=project_id)
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