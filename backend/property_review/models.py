from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Project(models.Model):
    """
    Main Project Entity - SIMPLIFIED
    Only contains project-level metadata, NOT content data
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    
    # Project Status
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('conditional', 'Conditional')
    ], default='draft')
    
    # Project Settings (NOT content data)
    multiple_locations_mode = models.BooleanField(default=False)
    show_website = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['owner', '-updated_at']),
        ]
    
    def __str__(self):
        return self.title

class ProjectSlide(models.Model):
    """
    Individual Slide - THIS IS THE MAIN CONTENT STORAGE
    Each slide is completely independent and self-contained
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='slides')
    
    # Slide Identity
    slide_number = models.PositiveIntegerField()  # 1, 2, 3, etc.
    slide_type = models.CharField(max_length=50, choices=[
        ('cover', 'Cover Page'),
        ('overview', 'Overview'),
        ('street_view', 'Street View'),
        ('aerial_view_google', 'Aerial View - Google'),
        ('aerial_view_bing', 'Aerial View - Bing'),
        ('best_places', 'Best Places'),
        ('demographics', 'Demographics'),
        ('comments', 'Comments'),
        ('custom', 'Custom')
    ])
    title = models.CharField(max_length=255, blank=True)
    
    # ALL slide content in ONE clean JSON field
    content = models.JSONField(default=dict, help_text="All slide content: form data, images, drawings, etc.")
    
    # UI-specific data
    field_positions = models.JSONField(default=dict, help_text="Field positioning data for UI")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_slides'
        unique_together = ['project', 'slide_number']
        ordering = ['project', 'slide_number']
        indexes = [
            models.Index(fields=['project', 'slide_number']),
            models.Index(fields=['slide_type']),
        ]
    
    def __str__(self):
        return f"{self.project.title} - Slide {self.slide_number} ({self.slide_type})"

class ProjectLocation(models.Model):
    """
    Multiple Locations Support - ONLY when needed
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='locations')
    
    location_index = models.PositiveIntegerField()  # 0, 1, 2, etc.
    name = models.CharField(max_length=255)  # "Building A", "Main Office"
    address = models.TextField()
    
    # Location-specific data
    location_data = models.JSONField(default=dict, help_text="Location-specific form data")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_locations'
        unique_together = ['project', 'location_index']
        ordering = ['project', 'location_index']
    
    def __str__(self):
        return f"{self.project.title} - {self.name}"

class SlideImage(models.Model):
    """
    Images attached to slides - SEPARATE from content JSON
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slide = models.ForeignKey(ProjectSlide, on_delete=models.CASCADE, related_name='images')
    
    # Image file (proper file storage, not base64)
    image = models.ImageField(upload_to='slide_images/%Y/%m/')
    filename = models.CharField(max_length=255)
    alt_text = models.CharField(max_length=255, blank=True)
    
    # Image positioning
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    width = models.FloatField(default=200)
    height = models.FloatField(default=150)
    z_index = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'slide_images'
        ordering = ['slide', 'z_index']
    
    def __str__(self):
        return f"Image for {self.slide}"

class ProjectSettings(models.Model):
    """
    Project-specific settings and preferences
    """
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='settings')
    
    # Export settings
    export_count = models.PositiveIntegerField(default=0)
    last_export_at = models.DateTimeField(null=True, blank=True)
    
    # UI settings  
    font_sizes = models.JSONField(default=dict)
    ui_preferences = models.JSONField(default=dict)
    
    # LRO Integration
    lro_form_id = models.CharField(max_length=100, blank=True)
    lro_data = models.JSONField(default=dict)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_settings'

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
