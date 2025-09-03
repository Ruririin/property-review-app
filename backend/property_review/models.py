from django.db import models
from django.contrib.auth import get_user_model
import uuid
from .fields import ValidatedUUIDField

User = get_user_model()

class Project(models.Model):
    """
    Property Review Project Model
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Match existing UUID
    name = models.CharField(max_length=255)  # Match existing field name
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)  # Optional owner for now
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    legacy_id = models.IntegerField(null=True, blank=True, db_index=True)  # For migrating old numeric IDs
    status = models.CharField(max_length=50, default='editing')
    formData = models.JSONField(default=dict, blank=True)
    slideData = models.JSONField(default=dict, blank=True)
    multipleLocationsMode = models.BooleanField(default=False)
    selectedLocationIndex = models.IntegerField(default=0)
    showWebsite = models.BooleanField(default=False)  # Controls website visibility in the UI
    
    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class ProjectLocation(models.Model):
    """
    Individual locations within a project for multiple location support
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='locations')
    location_index = models.PositiveIntegerField()  # 0, 1, 2, etc.
    name = models.CharField(max_length=255)  # e.g., "Building A", "Main Office"
    address = models.TextField(blank=True)  # Full address for this location
    formData = models.JSONField(default=dict)  # Location-specific form data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_locations'
        unique_together = ['project', 'location_index']
        ordering = ['project', 'location_index']
    
    def __str__(self):
        return f"{self.project.name} - Location {self.location_index + 1}: {self.name}"

class PropertySlide(models.Model):
    """
    Individual slide within a property review project
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='slides')
    slide_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255, blank=True)
    content = models.JSONField(default=dict)  # Store slide content as JSON (formData, drawings, etc.)
    template_type = models.CharField(max_length=50, default='standard')
    field_dimensions = models.JSONField(default=dict)
    formData = models.JSONField(default=dict)  # Store form data separately
    fieldPositions = models.JSONField(default=dict)  # Store field positions separately
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'property_slides'
        unique_together = ['project', 'slide_number']
        ordering = ['project', 'slide_number']
    
    def __str__(self):
        return f"{self.project.name} - Slide {self.slide_number} ({self.template_type})"

# Temporarily disable PropertyImage model until we set up the proper database schema
# class PropertyImage(models.Model):
#     """
#     Images associated with property slides
#     """
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     slide = models.ForeignKey(PropertySlide, on_delete=models.CASCADE, related_name='images')
#     image = models.ImageField(upload_to='property_images/')
#     alt_text = models.CharField(max_length=255, blank=True)
#     position_x = models.FloatField(default=0)
#     position_y = models.FloatField(default=0)
#     width = models.FloatField(default=100)
#     height = models.FloatField(default=100)
#     created_at = models.DateTimeField(auto_now_add=True)
#     
#     class Meta:
#         db_table = 'property_images'
#     
#     def __str__(self):
#         return f"Image for {self.slide}"

class Template(models.Model):
    """
    PPTX Templates for property reviews
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file_path = models.CharField(max_length=500)
    extracted_content = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'templates'
    
    def __str__(self):
        return self.name
