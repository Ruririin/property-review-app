"""
SlideOne Backend Features
Handles all SlideOne specific functionality including form fields and ISO code matching
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from .iso_service import iso_service
import logging

logger = logging.getLogger(__name__)

class SlideOneService:
    """
    Service class for SlideOne specific functionality
    """
    
    @staticmethod
    def get_line_of_business_options():
        """
        Get predefined Line of Business options
        """
        return [
            "Commercial Property - Special Multi Peril",
            "Commercial Property - All risk", 
            "Garage Liability",
            "General Liability"
        ]
    
    @staticmethod
    def validate_form_data(form_data):
        """
        Validate SlideOne form data
        """
        required_fields = ['insuredName', 'premiseLocation', 'description']
        errors = {}
        
        for field in required_fields:
            if not form_data.get(field, '').strip():
                errors[field] = f'{field.replace("_", " ").title()} is required'
        
        # Additional validation
        if form_data.get('website'):
            website = form_data['website'].strip()
            if not (website.startswith('http://') or website.startswith('https://') or website.startswith('www.')):
                errors['website'] = 'Website must be a valid URL'
        
        return errors
    
    @staticmethod
    def process_iso_code_matching(description):
        """
        Process ISO code matching for a given description
        """
        try:
            # Ensure ISO codes are loaded
            if not iso_service.is_loaded:
                iso_service.load_iso_codes()
            
            # Find similar matches
            matches = iso_service.find_similar_matches(description)
            
            # Find best match
            best_match = iso_service.find_best_match(description)
            
            return {
                'matches': matches,
                'best_match': best_match,
                'total_matches': len(matches)
            }
        except Exception as e:
            logger.error(f"Error processing ISO code matching: {str(e)}")
            return {
                'matches': [],
                'best_match': None,
                'total_matches': 0,
                'error': str(e)
            }
    
    @staticmethod
    def calculate_dynamic_layout(form_data, font_sizes):
        """
        Calculate dynamic layout for Line of Business and ISO Class fields
        Based on the React component logic
        """
        total_available_width = 860
        min_font_size = 18
        max_font_size = 30
        base_font_size = font_sizes.get('lineBusiness', 30)
        gap = 2
        
        line_business_text = form_data.get('lineBusiness', 'Line of Business')
        iso_class_text = form_data.get('isoClass', 'ISO Class Code')
        
        # Estimate text width
        def estimate_text_width(text, font_size):
            avg_char_width = font_size * 0.5
            return len(text) * avg_char_width
        
        current_font_size = base_font_size
        
        while current_font_size > min_font_size:
            line_business_text_width = estimate_text_width(line_business_text, current_font_size)
            iso_class_text_width = estimate_text_width(iso_class_text, current_font_size)
            
            line_business_width = line_business_text_width + 40
            iso_class_width = (iso_class_text_width + 40) * 1.05
            
            total_used_width = line_business_width + iso_class_width + gap
            
            if total_used_width <= total_available_width:
                break
            
            current_font_size -= 1
        
        # Calculate positions
        iso_class_right = 124
        line_business_right = iso_class_right + iso_class_width + gap
        
        return {
            'fontSize': min(current_font_size, max_font_size),
            'lineBusinessWidth': line_business_width,
            'isoClassWidth': iso_class_width,
            'lineBusinessRight': line_business_right,
            'isoClassRight': iso_class_right,
        }

# API Views for SlideOne
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_line_of_business_options(request):
    """
    Get Line of Business dropdown options
    """
    options = SlideOneService.get_line_of_business_options()
    return Response({'options': options})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_slide_one_data(request):
    """
    Validate SlideOne form data
    """
    form_data = request.data.get('formData', {})
    errors = SlideOneService.validate_form_data(form_data)
    
    return Response({
        'valid': len(errors) == 0,
        'errors': errors
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_iso_codes(request):
    """
    Match ISO codes based on description
    """
    description = request.data.get('description', '')
    
    if not description.strip():
        return Response({
            'matches': [],
            'best_match': None,
            'total_matches': 0
        })
    
    result = SlideOneService.process_iso_code_matching(description)
    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def load_iso_codes(request):
    """
    Load all available ISO codes
    """
    try:
        codes = iso_service.load_iso_codes()
        return Response({
            'codes': codes,
            'total': len(codes),
            'loaded': True
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'loaded': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_layout(request):
    """
    Calculate dynamic layout for fields
    """
    form_data = request.data.get('formData', {})
    font_sizes = request.data.get('fontSizes', {})
    
    layout = SlideOneService.calculate_dynamic_layout(form_data, font_sizes)
    return Response(layout)