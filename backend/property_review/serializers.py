from rest_framework import serializers
from .models import Project, PropertySlide, Template, ProjectLocation, ExportedPDF

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
    status = serializers.CharField(required=False, default='personal_draft')
    insuredName = serializers.SerializerMethodField()
    premiseLocation = serializers.SerializerMethodField()
    slideCount = serializers.SerializerMethodField()
    ownerName = serializers.SerializerMethodField()
    exported_at = serializers.DateTimeField(read_only=True)
    slidePreview = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'legacy_id',
                 'status', 'insuredName', 'premiseLocation', 'owner', 'slideCount',
                 'ownerName', 'exported_at', 'slidePreview']
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'owner': {'required': False}
        }

    def get_ownerName(self, obj):
        if obj.owner:
            return obj.owner.username
        return 'Unknown'

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

    def get_slidePreview(self, obj):
        """Return first 3 slides for thumbnail preview with their actual data"""
        if not obj.slideData:
            return []

        slides = obj.slideData.get('_slides', [])
        if not isinstance(slides, list):
            return []

        # Return first 3 slides with their actual data for preview rendering
        preview_slides = []
        for slide in slides[:3]:
            slide_id = slide.get('id')
            slide_type = slide.get('type', '')

            # Get slide-specific data (formData, fieldPositions, drawings, etc.)
            # Try both string and integer keys since JSONField can store either
            slide_data = obj.slideData.get(str(slide_id), {}) or obj.slideData.get(slide_id, {})

            # Check if slide has images - drawings can be a list or dict with frames
            drawings = slide_data.get('drawings', [])
            has_images = False
            if isinstance(drawings, dict):
                has_images = bool(drawings.get('frames', {}))
            elif isinstance(drawings, list):
                has_images = len(drawings) > 0

            preview_slides.append({
                'id': slide_id,
                'type': slide_type,
                'title': slide.get('title', ''),
                'hasImages': has_images,
                'formData': slide_data.get('formData', {}),  # Include actual form data
                'fieldPositions': slide_data.get('fieldPositions', {}),
                'drawings': drawings,
            })

        return preview_slides

# Full serializer for individual project details (includes all data)
class ProjectSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name')  # Map 'name' to 'title' for frontend compatibility
    status = serializers.CharField(required=False, default='personal_draft')
    exported_at = serializers.DateTimeField(read_only=True)
    formData = serializers.JSONField(required=False, default=dict)
    slideData = serializers.JSONField(required=False, default=dict)
    multipleLocationsMode = serializers.BooleanField(required=False, default=False)
    selectedLocationIndex = serializers.IntegerField(required=False, default=0)
    locations = ProjectLocationSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'legacy_id',
                 'status', 'exported_at', 'formData', 'slideData', 'multipleLocationsMode',
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

class ExportedPDFSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = ExportedPDF
        fields = ['id', 'project', 'owner', 'owner_name', 'filename', 'project_name', 'file_path',
                  'file_size', 'export_date', 'url']
        read_only_fields = ('export_date', 'owner')

    def get_url(self, obj):
        if obj.file_path:
            return f'/api/exported-pdfs/{obj.id}/serve/'
        return None

    def get_owner_name(self, obj):
        """Return owner's username or email for display"""
        if obj.owner:
            return obj.owner.username or obj.owner.email
        return 'Unknown'