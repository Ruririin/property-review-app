"""
SlideThree Backend Features
Handles SlideThree specific functionality - similar to SlideTwo with different positioning
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .slide_two import SlideTwoService  # Reuse most functionality
import logging

logger = logging.getLogger(__name__)

class SlideThreeService(SlideTwoService):
    """
    Service class for SlideThree specific functionality
    Inherits most functionality from SlideTwoService with custom positioning
    """
    
    @staticmethod
    def get_default_positions():
        """
        Get default field positions for SlideThree
        Different positioning from SlideTwo
        """
        return {
            'websiteInfo': {
                'bottom': 5.6,
                'right': 0.5,
                'unit': 'px_percent'
            },
            'premiseLocation': {
                'top': 670,
                'right': 1.2,
                'unit': 'px_percent'
            }
        }

# API Views for SlideThree
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_view_type_options(request):
    """
    Get view type dropdown options for Google Maps (same as SlideTwo)
    """
    options = SlideThreeService.get_view_type_options()
    return Response({'options': options})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_slide_three_data(request):
    """
    Validate SlideThree form data
    """
    form_data = request.data.get('formData', {})
    errors = SlideThreeService.validate_slide_two_data(form_data)  # Same validation
    
    return Response({
        'valid': len(errors) == 0,
        'errors': errors
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_field_width(request):
    """
    Calculate dynamic width for form fields
    """
    text_content = request.data.get('textContent', '')
    placeholder = request.data.get('placeholder', '')
    
    width_data = SlideThreeService.calculate_dynamic_width(text_content, placeholder)
    return Response(width_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_default_positions(request):
    """
    Get default field positions for SlideThree
    """
    positions = SlideThreeService.get_default_positions()
    return Response({'positions': positions})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_maps_integration(request):
    """
    Process Google Maps integration (same as SlideTwo)
    """
    premise_location = request.data.get('premiseLocation', '')
    view_type = request.data.get('viewType', 'Satellite View')
    
    result = SlideThreeService.process_google_maps_integration(premise_location, view_type)
    return Response(result)