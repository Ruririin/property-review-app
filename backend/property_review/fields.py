from django.db import models
import uuid
from django.core.exceptions import ValidationError

class ValidatedUUIDField(models.UUIDField):
    """A UUIDField that ensures only valid UUID strings are saved"""
    
    def to_python(self, value):
        if value is None:
            return None
        try:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            return value
        except (ValueError, TypeError, AttributeError):
            raise ValidationError(f'"{value}" is not a valid UUID.')
