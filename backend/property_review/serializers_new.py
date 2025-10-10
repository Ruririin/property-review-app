from rest_framework import serializers
from .models_new import Project, ProjectSlide, ProjectLocation, SlideImage, ProjectSettings

class ProjectSerializer(serializers.ModelSerializer):
    """
    Main Project serializer - LIGHTWEIGHT
    """
    slide_count = serializers.SerializerMethodField()
    last_modified = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status',
            'multiple_locations_mode', 'show_website',
            'created_at', 'updated_at', 'last_modified', 'slide_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_slide_count(self, obj):
        return obj.slides.count()

class SlideImageSerializer(serializers.ModelSerializer):
    """
    Slide image serializer
    """
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SlideImage
        fields = [
            'id', 'filename', 'alt_text', 'image_url',
            'position_x', 'position_y', 'width', 'height', 'z_index'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

class ProjectSlideSerializer(serializers.ModelSerializer):
    """
    Individual slide serializer - COMPLETE SLIDE DATA
    """
    images = SlideImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProjectSlide
        fields = [
            'id', 'slide_number', 'slide_type', 'title',
            'content', 'field_positions', 'images',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ProjectLocationSerializer(serializers.ModelSerializer):
    """
    Project location serializer
    """
    class Meta:
        model = ProjectLocation
        fields = [
            'id', 'location_index', 'name', 'address', 'location_data',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ProjectSettingsSerializer(serializers.ModelSerializer):
    """
    Project settings serializer
    """
    class Meta:
        model = ProjectSettings
        fields = [
            'export_count', 'last_export_at', 'font_sizes', 
            'ui_preferences', 'lro_form_id', 'lro_data'
        ]

class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    COMPLETE project with all related data - USE SPARINGLY
    Only for full project loads, not for listings
    """
    slides = ProjectSlideSerializer(many=True, read_only=True)
    locations = ProjectLocationSerializer(many=True, read_only=True)
    settings = ProjectSettingsSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status',
            'multiple_locations_mode', 'show_website',
            'created_at', 'updated_at',
            'slides', 'locations', 'settings'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

# LIGHTWEIGHT serializers for listings
class ProjectListSerializer(serializers.ModelSerializer):
    """
    Lightweight project serializer for project listings
    NO slide data included - much faster
    """
    slide_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 
            'slide_count', 'updated_at'
        ]
    
    def get_slide_count(self, obj):
        return obj.slides.count()

class SlideListSerializer(serializers.ModelSerializer):
    """
    Lightweight slide serializer for slide listings
    NO content data - just metadata
    """
    class Meta:
        model = ProjectSlide
        fields = ['id', 'slide_number', 'slide_type', 'title', 'updated_at']
