"""
StreetView Backend Features
Handles StreetView specific functionality - optimized for street-level views
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .slide_two import SlideTwoService  # Reuse most functionality
import logging
import re

logger = logging.getLogger(__name__)

class StreetViewService(SlideTwoService):
    """
    Service class for StreetView specific functionality
    Inherits most functionality from SlideTwoService with street view optimizations
    """
    
    @staticmethod
    def get_view_type_options():
        """
        Get predefined view type options for Street View (more street-focused)
        """
        return [
            {
                "value": "Street View",
                "label": "www.google.com - Street View",
                "description": "Street-level view"
            },
            {
                "value": "Street Satellite",
                "label": "www.google.com - Street Satellite View", 
                "description": "Street-level with satellite overlay"
            }
        ]
    
    @staticmethod
    def get_default_positions():
        """
        Get default field positions for StreetView
        """
        return {
            'websiteInfo': {
                'bottom': -15,
                'right': 1.2,
                'unit': 'px_percent'
            },
            'premiseLocation': {
                'top': 670,
                'right': 1.2,
                'unit': 'px_percent'
            }
        }
    
    @staticmethod
    def process_street_view_integration(premise_location, view_type):
        """
        Process Google Street View integration
        """
        try:
            if premise_location:
                # Clean and format address for street view
                cleaned_address = re.sub(r'[^\w\s,.-]', '', premise_location)
                encoded_address = cleaned_address.replace(' ', '+')
                
                # Generate Street View specific URLs
                if view_type == "Street View":
                    map_url = f"https://www.google.com/maps/@?api=1&map_action=pano&center={encoded_address}&zoom=1"
                else:  # Street Satellite
                    map_url = f"https://www.google.com/maps/@?api=1&map_action=map&center={encoded_address}&zoom=19&basemap=hybrid"
                
                return {
                    'map_url': map_url,
                    'encoded_address': encoded_address,
                    'view_type': view_type,
                    'street_view_optimized': True,
                    'valid': True
                }
        except Exception as e:
            logger.error(f"Error processing Street View integration: {str(e)}")
        
        return {
            'map_url': None,
            'encoded_address': None,
            'view_type': view_type,
            'street_view_optimized': False,
            'valid': False,
            'error': 'Failed to process address for street view'
        }
    
    @staticmethod
    def validate_street_view_data(form_data):
        """
        Validate StreetView form data with street-specific checks
        """
        errors = {}
        
        # Validate premise location with street view requirements
        premise_location = form_data.get('premiseLocation', '').strip()
        if not premise_location:
            errors['premiseLocation'] = 'Street address is required for street view'
        elif len(premise_location) < 15:
            errors['premiseLocation'] = 'Please provide a complete street address with number and street name'
        
        # Check for basic street address components
        if premise_location:
            has_number = any(char.isdigit() for char in premise_location)
            has_street_indicator = any(word in premise_location.lower() for word in ['st', 'street', 'ave', 'avenue', 'blvd', 'boulevard', 'rd', 'road', 'dr', 'drive'])
            
            if not has_number:
                errors['premiseLocation'] = 'Street address should include a street number'
            elif not has_street_indicator:
                errors['premiseLocation'] = 'Please include street type (St, Ave, Rd, etc.)'
        
        # Validate website info for street view
        website_info = form_data.get('websiteInfo', '').strip()
        if website_info and website_info not in ["Street View", "Street Satellite"]:
            errors['websiteInfo'] = 'Please select a valid street view type'
        
        return errors

# API Views for StreetView
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_view_type_options(request):
    """
    Get view type dropdown options for Street View
    """
    options = StreetViewService.get_view_type_options()
    return Response({'options': options})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_street_view_data(request):
    """
    Validate StreetView form data
    """
    form_data = request.data.get('formData', {})
    errors = StreetViewService.validate_street_view_data(form_data)
    
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
    
    width_data = StreetViewService.calculate_dynamic_width(text_content, placeholder)
    return Response(width_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_default_positions(request):
    """
    Get default field positions for StreetView
    """
    positions = StreetViewService.get_default_positions()
    return Response({'positions': positions})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_street_view_integration(request):
    """
    Process Google Street View integration
    """
    premise_location = request.data.get('premiseLocation', '')
    view_type = request.data.get('viewType', 'Street View')
    
    result = StreetViewService.process_street_view_integration(premise_location, view_type)
    return Response(result)