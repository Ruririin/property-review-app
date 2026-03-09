from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    """
    Extended User model for NeitClem In-Hub
    Extends Django's built-in User model with additional fields
    """
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # SECURITY: Account lockout fields to prevent brute force attacks
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_failed_login = models.DateTimeField(null=True, blank=True)

    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return True
        return False

    def reset_failed_attempts(self):
        """Reset failed login attempts after successful login"""
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.last_failed_login = None
        self.save(update_fields=['failed_login_attempts', 'account_locked_until', 'last_failed_login'])

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """
    User profile customization settings
    Stores avatar, header, background preferences for profile page
    """
    BACKGROUND_TYPE_CHOICES = [
        ('color', 'Solid Color'),
        ('image', 'Image'),
    ]

    BACKGROUND_DISPLAY_CHOICES = [
        ('pattern', 'Pattern (Repeated)'),
        ('fit', 'Fit to Screen'),
        ('fade-down', 'Fade Down'),
        ('fade-up', 'Fade Up'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Avatar (circle display on frontend)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # Header image
    header_image = models.ImageField(upload_to='headers/', null=True, blank=True)

    # Background customization
    background_type = models.CharField(
        max_length=10,
        choices=BACKGROUND_TYPE_CHOICES,
        default='color'
    )
    background_color = models.CharField(max_length=7, default='#2a7a2a')  # Default green
    background_image = models.ImageField(upload_to='backgrounds/', null=True, blank=True)
    background_display = models.CharField(
        max_length=10,
        choices=BACKGROUND_DISPLAY_CHOICES,
        default='fit'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.user.email}'s profile"
