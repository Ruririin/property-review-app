"""
URL configuration for slide-specific API endpoints
"""

from django.urls import path
from . import slide_one, slide_two, slide_three, street_view, image_handler, frame_image_handler

# SlideOne URLs
slide_one_patterns = [
    path('slide-one/line-of-business-options/', slide_one.get_line_of_business_options, name='slide_one_line_business_options'),
    path('slide-one/validate/', slide_one.validate_slide_one_data, name='slide_one_validate'),
    path('slide-one/match-iso-codes/', slide_one.match_iso_codes, name='slide_one_match_iso'),
    path('slide-one/load-iso-codes/', slide_one.load_iso_codes, name='slide_one_load_iso'),
    path('slide-one/calculate-layout/', slide_one.calculate_layout, name='slide_one_calculate_layout'),
]

# SlideTwo URLs
slide_two_patterns = [
    path('slide-two/view-type-options/', slide_two.get_view_type_options, name='slide_two_view_options'),
    path('slide-two/validate/', slide_two.validate_slide_two_data, name='slide_two_validate'),
    path('slide-two/calculate-field-width/', slide_two.calculate_field_width, name='slide_two_field_width'),
    path('slide-two/default-positions/', slide_two.get_default_positions, name='slide_two_positions'),
    path('slide-two/maps-integration/', slide_two.process_maps_integration, name='slide_two_maps'),
]

# SlideThree URLs
slide_three_patterns = [
    path('slide-three/view-type-options/', slide_three.get_view_type_options, name='slide_three_view_options'),
    path('slide-three/validate/', slide_three.validate_slide_three_data, name='slide_three_validate'),
    path('slide-three/calculate-field-width/', slide_three.calculate_field_width, name='slide_three_field_width'),
    path('slide-three/default-positions/', slide_three.get_default_positions, name='slide_three_positions'),
    path('slide-three/maps-integration/', slide_three.process_maps_integration, name='slide_three_maps'),
]

# StreetView URLs
street_view_patterns = [
    path('street-view/view-type-options/', street_view.get_view_type_options, name='street_view_options'),
    path('street-view/validate/', street_view.validate_street_view_data, name='street_view_validate'),
    path('street-view/calculate-field-width/', street_view.calculate_field_width, name='street_view_field_width'),
    path('street-view/default-positions/', street_view.get_default_positions, name='street_view_positions'),
    path('street-view/street-view-integration/', street_view.process_street_view_integration, name='street_view_integration'),
]

# Image Handler URLs
image_handler_patterns = [
    path('images/upload/', image_handler.upload_image, name='upload_image'),
    path('images/calculate-dimensions/', image_handler.calculate_image_dimensions, name='calculate_image_dimensions'),
    path('images/validate-position/', image_handler.validate_image_position, name='validate_image_position'),
    path('images/metadata/', image_handler.get_image_metadata, name='get_image_metadata'),
    path('images/delete/', image_handler.delete_image, name='delete_image'),
]

# Frame Image Handler URLs
frame_image_handler_patterns = [
    path('upload-frame-image/', frame_image_handler.upload_frame_image, name='upload_frame_image'),
    path('<str:project_id>/<str:slide_id>/delete-frame-image/', frame_image_handler.delete_frame_image, name='delete_frame_image'),
]

# Combine all patterns
urlpatterns = (
    slide_one_patterns +
    slide_two_patterns +
    slide_three_patterns +
    street_view_patterns +
    image_handler_patterns +
    frame_image_handler_patterns
)