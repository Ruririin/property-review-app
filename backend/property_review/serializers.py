from rest_framework import serializers
from .models import Project, PropertySlide, Template, ProjectLocation

class PropertySlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertySlide
        fields = ['id', 'project', 'slide_number', 'title', 'content', 
                 'template_type', 'field_dimensions', 'formData', 'fieldPositions',
                 'created_at', 'updated_at']
        
    def create(self, validated_data):
        # Ensure formData and fieldPositions are properly initialized
        validated_data['formData'] = validated_data.get('formData', {})
        validated_data['fieldPositions'] = validated_data.get('fieldPositions', {})
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Ensure formData and fieldPositions are properly updated
        instance.formData = validated_data.get('formData', instance.formData)
        instance.fieldPositions = validated_data.get('fieldPositions', instance.fieldPositions)
        instance.content = validated_data.get('content', instance.content)
        instance.field_dimensions = validated_data.get('field_dimensions', instance.field_dimensions)
        instance.title = validated_data.get('title', instance.title)
        instance.template_type = validated_data.get('template_type', instance.template_type)
        instance.save()
        return instance

class ProjectLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectLocation
        fields = ['id', 'project', 'location_index', 'name', 'address', 'formData', 
                 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at')

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
        fields = ['id', 'title', 'name', 'description', 'created_at', 'updated_at', 'legacy_id',
                 'status', 'formData', 'slideData', 'multipleLocationsMode', 
                 'selectedLocationIndex', 'locations', 'owner']
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'name': {'write_only': True},
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