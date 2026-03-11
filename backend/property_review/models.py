from django.db import models
from django.contrib.auth import get_user_model
import uuid
from .fields import ValidatedUUIDField

User = get_user_model()

class Project(models.Model):
    """
    Property Review Project Model
    """
    STATUS_CHOICES = [
        ('personal_draft', 'Personal Draft'),
        ('global_draft', 'Global Draft'),
        ('for_review', 'For Review'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('conditional', 'Conditional'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Match existing UUID
    name = models.CharField(max_length=255)  # Match existing field name
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)  # Optional owner for now
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    legacy_id = models.IntegerField(null=True, blank=True, db_index=True)  # For migrating old numeric IDs
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='personal_draft')
    status_note = models.TextField(blank=True, default='')  # Admin note when denying/setting conditional
    exported_at = models.DateTimeField(null=True, blank=True)  # Set when PDF exported; triggers 1-week auto-delete
    last_export_time = models.BigIntegerField(null=True, blank=True)  # Timestamp (milliseconds) of last PDF export for change detection
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
    location_data = models.JSONField(default=dict, db_column='formData')  # Production DB column is 'formData'
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
    slide_type = models.CharField(max_length=50, default='standard', db_column='template_type')  # Production DB column is 'template_type'
    title = models.CharField(max_length=255, blank=True)
    content = models.JSONField(default=dict)  # Store slide content as JSON (formData, drawings, etc.)
    field_positions = models.JSONField(default=dict, db_column='field_dimensions')  # Production DB column is 'field_dimensions'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_slides'
        unique_together = ['project', 'slide_number']
        ordering = ['project', 'slide_number']

    def __str__(self):
        return f"{self.project.name} - Slide {self.slide_number} ({self.slide_type})"

class PropertyImage(models.Model):
    """
    Images associated with property slides
    NOTE: This model/table is not currently used in production and the table doesn't exist.
    Keeping the model for future use, but marked as unmanaged to prevent migration issues.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slide = models.ForeignKey(PropertySlide, on_delete=models.DO_NOTHING, related_name='images', db_constraint=False)
    image = models.CharField(max_length=100)  # Match actual database field type
    filename = models.CharField(max_length=255)  # Match actual database field
    alt_text = models.CharField(max_length=255, blank=True)
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    width = models.FloatField(default=100)
    height = models.FloatField(default=100)
    z_index = models.IntegerField(default=0)  # Match actual database field
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'property_slides_images'  # Table doesn't exist in prod DB yet
        managed = False  # Don't let Django manage this table (prevents errors when table doesn't exist)

    def __str__(self):
        return f"Image for {self.slide}"

class ExportedPDF(models.Model):
    """
    Exported PDF files from property review projects
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='exported_pdfs')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exported_pdfs')
    filename = models.CharField(max_length=255)
    project_name = models.CharField(max_length=255, blank=True)
    file_path = models.CharField(max_length=500)  # Path in media storage
    file_size = models.BigIntegerField(default=0)
    export_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exported_pdfs'
        ordering = ['-export_date']

    def __str__(self):
        return f"{self.filename} ({self.export_date})"

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
