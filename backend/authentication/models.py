from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Extended User model for NeitClem In-Hub
    Extends Django's built-in User model with additional fields
    """
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return self.email
