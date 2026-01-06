from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import FormData
from .serializers import FormDataSerializer

class FormDataListView(generics.ListAPIView):
    """List all form data from the forms database"""
    queryset = FormData.objects.using('forms_db').all()
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated]  # Require authentication

class FormDataDetailView(generics.RetrieveAPIView):
    """Retrieve specific form data by ID"""
    queryset = FormData.objects.using('forms_db').all()
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated]  # Require authentication

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_form_data(request):
    """Search form data by various criteria"""
    app_name = request.GET.get('app_name', '')
    location = request.GET.get('location', '')
    operations = request.GET.get('operations', '')
    web_address = request.GET.get('web_address', '')
    
    queryset = FormData.objects.using('forms_db').all()
    
    if app_name:
        queryset = queryset.filter(appName__icontains=app_name)
    if location:
        # Search in all location fields
        queryset = queryset.filter(
            models.Q(locationA__icontains=location) |
            models.Q(locationB__icontains=location) |
            models.Q(locationC__icontains=location)
        )
    if operations:
        queryset = queryset.filter(descOper__icontains=operations)
    if web_address:
        queryset = queryset.filter(webAdd__icontains=web_address)
    
    serializer = FormDataSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form_data_for_property_review(request):
    """Get form data specifically formatted for property review text fields"""
    form_id = request.GET.get('id')
    
    if not form_id:
        return Response({'error': 'Form ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        form_data = FormData.objects.using('forms_db').get(id=form_id)
        
        # Format data specifically for your property review fields mapping:
        # appName -> insuredName
        # locationA, locationB, locationC -> premiseLocation  
        # descOper -> description (and can be used for ISO search)
        # webAdd -> website
        
        # Helper function to clean field values - remove "0" and empty strings
        def clean_field(value):
            if not value or value == "0" or value.strip() == "0":
                return ""
            return value.strip()
        
        # Combine locations into a single field, excluding "0" values
        locations = []
        if form_data.locationA and clean_field(form_data.locationA):
            locations.append(clean_field(form_data.locationA))
        if form_data.locationB and clean_field(form_data.locationB):
            locations.append(clean_field(form_data.locationB))
        if form_data.locationC and clean_field(form_data.locationC):
            locations.append(clean_field(form_data.locationC))
        
        # Check if we have multiple locations
        has_multiple_locations = len(locations) > 1
        
        # Format locations based on whether there are multiple
        if has_multiple_locations:
            # Format as "Location 1: Address1\nLocation 2: Address2\n etc."
            formatted_locations = []
            for i, location in enumerate(locations, 1):
                formatted_locations.append(f"Location {i}: {location}")
            combined_location = '\n'.join(formatted_locations)
        else:
            # Single location, just use the address as-is
            combined_location = ', '.join(locations)
        
        # Check if website has actual content (not "0")
        website_value = clean_field(form_data.webAdd)
        has_website = bool(website_value)
        
        formatted_data = {
            'insuredName': clean_field(form_data.appName),
            'premiseLocation': combined_location,
            'description': clean_field(form_data.ISO),  # Only use ISO column
            'isoClass': clean_field(form_data.ISO),
            'website': website_value,
            'showWebsite': has_website,  # Flag to control website visibility
            'hasMultipleLocations': has_multiple_locations,  # Flag to control multiple locations switch
        }
        
        return Response(formatted_data)
        
    except FormData.DoesNotExist:
        return Response({'error': 'Form data not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_iso_codes(request):
    """Search ISO codes from tbl_lro table by description text"""
    search_term = request.GET.get('search', '').strip()
    
    if not search_term:
        return Response([])
    
    # Get all form data and filter by ISO field OR description containing the search term
    queryset = FormData.objects.using('forms_db').filter(
        models.Q(ISO__icontains=search_term) | models.Q(descOper__icontains=search_term)
    ).exclude(ISO__isnull=True).exclude(ISO__exact='')
    
    # Extract and format the ISO data
    results = []
    for form_item in queryset[:10]:  # Limit to 10 results
        if form_item.ISO:
            # Parse the ISO field to extract code and description
            iso_text = form_item.ISO.strip()
            
            # Try to parse if it's in "code - description" format
            if ' - ' in iso_text:
                parts = iso_text.split(' - ', 1)
                code = parts[0].strip()
                description = parts[1].strip()
            else:
                # If not in expected format, use the whole text as description
                code = ""
                description = iso_text
            
            results.append({
                'code': code,
                'description': description,
                'full_text': iso_text
            })
    
    return Response(results)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_iso_codes(request):
    """Get all unique ISO codes from tbl_lro table"""
    queryset = FormData.objects.using('forms_db').exclude(
        ISO__isnull=True
    ).exclude(ISO__exact='').values_list('ISO', flat=True).distinct()
    
    results = []
    for iso_text in queryset:
        if iso_text and iso_text.strip():
            iso_text = iso_text.strip()
            
            # Try to parse if it's in "code - description" format
            if ' - ' in iso_text:
                parts = iso_text.split(' - ', 1)
                code = parts[0].strip()
                description = parts[1].strip()
            else:
                # If not in expected format, use the whole text as description
                code = ""
                description = iso_text
            
            results.append({
                'code': code,
                'description': description,
                'full_text': iso_text,
                'keywords': description.lower()
            })
    
    return Response(results)
