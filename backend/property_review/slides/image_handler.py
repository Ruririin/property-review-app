"""
Image Handler Backend Service
Handles image upload, processing, and management for slides
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from PIL import Image, ImageOps
import base64
import io
import os
import uuid
import logging

logger = logging.getLogger(__name__)

class ImageHandlerService:
    """
    Service class for handling image operations
    """

    # SECURITY: Whitelist of allowed image formats
    ALLOWED_FORMATS = {'JPEG', 'JPG', 'PNG'}

    # SECURITY: Maximum file size (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

    @staticmethod
    def validate_image_data(base64_data):
        """
        Validate base64 image data before processing
        Returns (is_valid, error_message)
        """
        try:
            # Check if data is provided
            if not base64_data:
                return False, "No image data provided"

            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]

            # Check base64 data length (rough file size check)
            estimated_size = len(base64_data) * 3 / 4
            if estimated_size > ImageHandlerService.MAX_FILE_SIZE:
                return False, f"Image too large. Maximum size is {ImageHandlerService.MAX_FILE_SIZE / (1024*1024)}MB"

            # Decode base64 data
            try:
                image_data = base64.b64decode(base64_data)
            except Exception:
                return False, "Invalid base64 data"

            # Verify it's actually an image and check format
            try:
                image = Image.open(io.BytesIO(image_data))
                image.verify()  # Verify image integrity

                # Check if format is allowed
                if image.format not in ImageHandlerService.ALLOWED_FORMATS:
                    return False, f"Invalid image format. Allowed formats: {', '.join(ImageHandlerService.ALLOWED_FORMATS)}"

                # Re-open image (verify() closes it)
                image = Image.open(io.BytesIO(image_data))

                # Check image dimensions (prevent extremely large images)
                width, height = image.size
                if width > 10000 or height > 10000:
                    return False, "Image dimensions too large. Maximum 10000x10000 pixels"

                return True, None

            except Exception as e:
                return False, f"Invalid image file: {str(e)}"

        except Exception as e:
            return False, f"Validation error: {str(e)}"

    @staticmethod
    def process_base64_image(base64_data, max_width=1200, max_height=800):
        """
        Process base64 image data and save to storage
        """
        try:
            # SECURITY: Validate image data before processing
            is_valid, error_msg = ImageHandlerService.validate_image_data(base64_data)
            if not is_valid:
                return {
                    'success': False,
                    'error': error_msg
                }

            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]

            # Decode base64 data
            image_data = base64.b64decode(base64_data)

            # Open image with PIL
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            # Resize if too large while maintaining aspect ratio
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Get image info
            width, height = image.size
            aspect_ratio = width / height
            
            # Save processed image
            output_buffer = io.BytesIO()
            image.save(output_buffer, format='JPEG', quality=85, optimize=True)
            output_buffer.seek(0)
            
            # Generate unique filename
            filename = f"slide_image_{uuid.uuid4()}.jpg"
            file_path = default_storage.save(f"property_images/{filename}", ContentFile(output_buffer.read()))
            
            return {
                'success': True,
                'file_path': file_path,
                'url': default_storage.url(file_path),
                'width': width,
                'height': height,
                'aspect_ratio': aspect_ratio,
                'file_size': len(image_data)
            }
            
        except Exception as e:
            logger.error(f"Error processing base64 image: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def calculate_image_dimensions(original_width, original_height, container_width=1280, container_height=720):
        """
        Calculate optimal image dimensions for container
        """
        aspect_ratio = original_width / original_height
        
        # Calculate maximum dimensions that fit in container
        if original_width > container_width or original_height > container_height:
            if aspect_ratio > (container_width / container_height):
                # Width is the limiting factor
                new_width = container_width * 0.8  # Leave some margin
                new_height = new_width / aspect_ratio
            else:
                # Height is the limiting factor
                new_height = container_height * 0.8  # Leave some margin
                new_width = new_height * aspect_ratio
        else:
            # Image fits within container
            new_width = original_width
            new_height = original_height
        
        return {
            'width': int(new_width),
            'height': int(new_height),
            'aspect_ratio': aspect_ratio,
            'original_width': original_width,
            'original_height': original_height
        }
    
    @staticmethod
    def validate_image_position(position, image_dimensions, container_width=1280, container_height=720):
        """
        Validate and adjust image position to ensure it stays within container bounds
        """
        top = max(0, min(position.get('top', 0), container_height - image_dimensions['height']))
        left = max(0, min(position.get('left', 0), container_width - image_dimensions['width']))
        
        return {
            'top': top,
            'left': left,
            'right': container_width - left - image_dimensions['width'],
            'bottom': container_height - top - image_dimensions['height']
        }
    
    @staticmethod
    def get_image_metadata(file_path):
        """
        Get metadata for an existing image
        """
        try:
            full_path = default_storage.path(file_path)
            if os.path.exists(full_path):
                with Image.open(full_path) as img:
                    width, height = img.size
                    aspect_ratio = width / height
                    file_size = os.path.getsize(full_path)
                    
                    return {
                        'width': width,
                        'height': height,
                        'aspect_ratio': aspect_ratio,
                        'file_size': file_size,
                        'format': img.format,
                        'mode': img.mode
                    }
        except Exception as e:
            logger.error(f"Error getting image metadata: {str(e)}")
        
        return None
    
    @staticmethod
    def delete_image(file_path):
        """
        Delete an image from storage
        """
        try:
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                return True
        except Exception as e:
            logger.error(f"Error deleting image: {str(e)}")
        
        return False

# API Views for Image Handler
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    """
    Upload and process an image from base64 data
    """
    base64_data = request.data.get('imageData', '')
    max_width = request.data.get('maxWidth', 1200)
    max_height = request.data.get('maxHeight', 800)
    
    if not base64_data:
        return Response({
            'error': 'No image data provided'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    result = ImageHandlerService.process_base64_image(base64_data, max_width, max_height)
    
    if result['success']:
        return Response(result)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_image_dimensions(request):
    """
    Calculate optimal image dimensions
    """
    original_width = request.data.get('originalWidth', 0)
    original_height = request.data.get('originalHeight', 0)
    container_width = request.data.get('containerWidth', 1280)
    container_height = request.data.get('containerHeight', 720)
    
    if not original_width or not original_height:
        return Response({
            'error': 'Original dimensions required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    dimensions = ImageHandlerService.calculate_image_dimensions(
        original_width, original_height, container_width, container_height
    )
    
    return Response(dimensions)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_image_position(request):
    """
    Validate and adjust image position
    """
    position = request.data.get('position', {})
    image_dimensions = request.data.get('imageDimensions', {})
    container_width = request.data.get('containerWidth', 1280)
    container_height = request.data.get('containerHeight', 720)
    
    adjusted_position = ImageHandlerService.validate_image_position(
        position, image_dimensions, container_width, container_height
    )
    
    return Response(adjusted_position)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_image_metadata(request):
    """
    Get metadata for an existing image
    """
    file_path = request.GET.get('filePath', '')

    if not file_path:
        return Response({
            'error': 'File path required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # SECURITY: Prevent path traversal attacks
    # Validate that the file path doesn't contain directory traversal patterns
    if '..' in file_path or file_path.startswith('/'):
        return Response({
            'error': 'Invalid file path'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Normalize the path and ensure it's within the media storage
    normalized_path = os.path.normpath(file_path)

    # Verify the file exists in allowed storage before accessing
    if not default_storage.exists(normalized_path):
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)

    metadata = ImageHandlerService.get_image_metadata(normalized_path)

    if metadata:
        return Response(metadata)
    else:
        return Response({
            'error': 'Unable to get image metadata'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_image(request):
    """
    Delete an image from storage
    """
    file_path = request.data.get('filePath', '')

    if not file_path:
        return Response({
            'error': 'File path required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # SECURITY: Prevent path traversal attacks
    if '..' in file_path or file_path.startswith('/'):
        return Response({
            'error': 'Invalid file path'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Normalize the path
    normalized_path = os.path.normpath(file_path)

    success = ImageHandlerService.delete_image(normalized_path)

    if success:
        return Response({'deleted': True})
    else:
        return Response({
            'error': 'Failed to delete image'
        }, status=status.HTTP_400_BAD_REQUEST)