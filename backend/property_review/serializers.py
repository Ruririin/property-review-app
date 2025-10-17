from rest_framework import serializers
from .models import Project, PropertySlide, Template, ProjectLocation

class PropertySlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertySlide
        fields = ['id', 'project', 'slide_number', 'slide_type', 'title', 'content',
                 'field_positions', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Ensure field_positions is properly initialized
        validated_data['field_positions'] = validated_data.get('field_positions', {})
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Ensure field_positions is properly updated
        instance.field_positions = validated_data.get('field_positions', instance.field_positions)
        instance.content = validated_data.get('content', instance.content)
        instance.title = validated_data.get('title', instance.title)
        instance.slide_type = validated_data.get('slide_type', instance.slide_type)
        instance.save()
        return instance

class ProjectLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectLocation
        fields = ['id', 'project', 'location_index', 'name', 'address', 'location_data',
                 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at')

# Lightweight serializer for project lists (excludes heavy slideData)
class LightProjectSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name')  # Map 'name' to 'title' for frontend compatibility
    status = serializers.CharField(required=False, default='editing')
    # Only include lightweight formData fields for listing
    insuredName = serializers.SerializerMethodField()
    premiseLocation = serializers.SerializerMethodField()
    slideCount = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'legacy_id',
                 'status', 'insuredName', 'premiseLocation', 'owner', 'slideCount']
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'owner': {'required': False}
        }
    
    def get_insuredName(self, obj):
        return obj.formData.get('insuredName', '') if obj.formData else ''
    
    def get_premiseLocation(self, obj):
        return obj.formData.get('premiseLocation', '') if obj.formData else ''
    
    def get_slideCount(self, obj):
        """Calculate the number of slides in this project"""
        if obj.slideData and '_slides' in obj.slideData:
            slides = obj.slideData['_slides']
            if isinstance(slides, list):
                return len(slides)
        return 1  # Default to 1 slide if no slide data found

# Full serializer for individual project details (includes all data)
class ProjectSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name')  # Map 'name' to 'title' for frontend compatibility
    status = serializers.CharField(required=False, default='editing')
    formData = serializers.JSONField(required=False, default=dict)
    slideData = serializers.JSONField(required=False, default=dict)
    multipleLocationsMode = serializers.BooleanField(required=False, default=False)
    selectedLocationIndex = serializers.IntegerField(required=False, default=0)
    locations = ProjectLocationSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'legacy_id',
                 'status', 'formData', 'slideData', 'multipleLocationsMode',
                 'selectedLocationIndex', 'locations', 'owner']
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'owner': {'required': False}
        }

    def create(self, validated_data):
        validated_data['multipleLocationsMode'] = validated_data.get('multipleLocationsMode', False)
        return super().create(validated_data)

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')