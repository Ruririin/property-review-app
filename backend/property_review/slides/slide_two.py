"""
SlideTwo Backend Features
Handles SlideTwo specific functionality including Google Maps integration and aerial view options
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
import logging
import re

logger = logging.getLogger(__name__)

class SlideTwoService:
    """
    Service class for SlideTwo specific functionality
    """
    
    @staticmethod
    def get_view_type_options():
        """
        Get predefined view type options for Google Maps
        """
        return [
            {
                "value": "Bird's Eye View",
                "label": "www.google.com - Bird's Eye View",
                "description": "Aerial overhead view"
            },
            {
                "value": "Satellite View", 
                "label": "www.google.com - Satellite View",
                "description": "Satellite imagery view"
            }
        ]
    
    @staticmethod
    def validate_slide_two_data(form_data):
        """
        Validate SlideTwo form data
        """
        errors = {}
        
        # Validate premise location
        premise_location = form_data.get('premiseLocation', '').strip()
        if not premise_location:
            errors['premiseLocation'] = 'Premise location is required'
        elif len(premise_location) < 10:
            errors['premiseLocation'] = 'Please provide a complete address'
        
        # Validate website info
        website_info = form_data.get('websiteInfo', '').strip()
        if website_info and website_info not in ["Bird's Eye View", "Satellite View"]:
            errors['websiteInfo'] = 'Please select a valid view type'
        
        return errors
    
    @staticmethod
    def calculate_dynamic_width(text_content, placeholder=""):
        """
        Calculate dynamic width based on text content
        Based on the React component logic
        """
        content = text_content or placeholder
        estimated_width = max(300, min(900, len(content) * 16 + 120))
        return {
            'width': estimated_width,
            'minWidth': 300,
            'maxWidth': 900
        }
    
    @staticmethod
    def get_default_positions():
        """
        Get default field positions for SlideTwo
        """
        return {
            'websiteInfo': {
                'bottom': -11.4,
                'right': 0.5,
                'unit': 'px_percent'
            },
            'premiseLocation': {
                'top': 670,
                'right': 1.2,
                'unit': 'px_percent'
            }
        }
    
    @staticmethod
    def process_google_maps_integration(premise_location, view_type):
        """
        Process Google Maps integration data
        """
        try:
            # Generate Google Maps URL (for reference)
            if premise_location:
                # Clean and format address
                cleaned_address = re.sub(r'[^\w\s,.-]', '', premise_location)
                encoded_address = cleaned_address.replace(' ', '+')
                
                # Generate different map URLs based on view type
                if view_type == "Bird's Eye View":
                    map_url = f"https://www.google.com/maps/@?api=1&map_action=map&center={encoded_address}&zoom=18&basemap=satellite"
                else:  # Satellite View
                    map_url = f"https://www.google.com/maps/@?api=1&map_action=map&center={encoded_address}&zoom=16&basemap=satellite"
                
                return {
                    'map_url': map_url,
                    'encoded_address': encoded_address,
                    'view_type': view_type,
                    'valid': True
                }
        except Exception as e:
            logger.error(f"Error processing Google Maps integration: {str(e)}")
        
        return {
            'map_url': None,
            'encoded_address': None,
            'view_type': view_type,
            'valid': False,
            'error': 'Failed to process address'
        }

# API Views for SlideTwo
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_view_type_options(request):
    """
    Get view type dropdown options for Google Maps
    """
    options = SlideTwoService.get_view_type_options()
    return Response({'options': options})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_slide_two_data(request):
    """
    Validate SlideTwo form data
    """
    form_data = request.data.get('formData', {})
    errors = SlideTwoService.validate_slide_two_data(form_data)
    
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
    
    width_data = SlideTwoService.calculate_dynamic_width(text_content, placeholder)
    return Response(width_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_default_positions(request):
    """
    Get default field positions for SlideTwo
    """
    positions = SlideTwoService.get_default_positions()
    return Response({'positions': positions})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_maps_integration(request):
    """
    Process Google Maps integration
    """
    premise_location = request.data.get('premiseLocation', '')
    view_type = request.data.get('viewType', 'Satellite View')
    
    result = SlideTwoService.process_google_maps_integration(premise_location, view_type)
    return Response(result)