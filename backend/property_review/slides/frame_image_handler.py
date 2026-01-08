"""
Frame Image Handler Backend Service
Handles multiple frame image uploads, processing, and management for slides
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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

class FrameImageHandlerService:
    """
    Service class for handling frame image operations
    """

    @staticmethod
    def process_frame_image(base64_data, max_width=1200, max_height=800):
        """
        Process base64 frame image data and save to storage
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]

            # Decode base64 data
            image_data = base64.b64decode(base64_data)

            # Open image with PIL
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'P'):
                # For transparent images, use white background
                if image.mode == 'RGBA':
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[3])  # Use alpha channel as mask
                    image = background
                else:
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
            filename = f"frame_image_{uuid.uuid4()}.jpg"
            file_path = default_storage.save(f"frame_images/{filename}", ContentFile(output_buffer.read()))

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
            logger.error(f"Error processing frame image: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def delete_frame_image(file_path):
        """
        Delete a frame image from storage
        """
        try:
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                logger.info(f"Deleted frame image: {file_path}")
                return True
        except Exception as e:
            logger.error(f"Error deleting frame image: {str(e)}")

        return False

# API Views for Frame Image Handler
@api_view(['POST'])
@permission_classes([AllowAny])  # Using AllowAny for now, change to IsAuthenticated in production
def upload_frame_image(request):
    """
    Upload and process a frame image from base64 data
    """
    project_id = request.data.get('project_id')
    slide_id = request.data.get('slide_id')
    frame_id = request.data.get('frame_id')
    base64_data = request.data.get('image_data', '')

    if not all([project_id, slide_id, frame_id, base64_data]):
        return Response({
            'error': 'project_id, slide_id, frame_id, and image_data are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    logger.info(f"Uploading frame image: project={project_id}, slide={slide_id}, frame={frame_id}")

    result = FrameImageHandlerService.process_frame_image(base64_data)

    if result['success']:
        logger.info(f"Frame image uploaded successfully: {result['file_path']}")
        return Response({
            'success': True,
            'file_path': result['file_path'],
            'url': result['url'],
            'width': result['width'],
            'height': result['height'],
            'aspect_ratio': result['aspect_ratio'],
            'frame_id': frame_id
        })
    else:
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])  # Using AllowAny for now, change to IsAuthenticated in production
def delete_frame_image(request, project_id, slide_id):
    """
    Delete a frame image from storage
    """
    frame_id = request.data.get('frame_id')
    file_path = request.data.get('file_path', '')

    if not file_path:
        return Response({
            'error': 'file_path is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    logger.info(f"Deleting frame image: project={project_id}, slide={slide_id}, frame={frame_id}, path={file_path}")

    success = FrameImageHandlerService.delete_frame_image(file_path)

    if success:
        return Response({
            'deleted': True,
            'frame_id': frame_id
        })
    else:
        return Response({
            'error': 'Failed to delete frame image'
        }, status=status.HTTP_400_BAD_REQUEST)
