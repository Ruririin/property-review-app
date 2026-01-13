"""
Security validators for input validation
"""
import json
from rest_framework.exceptions import ValidationError


def validate_json_size(data, max_size_bytes=1048576):
    """
    Validate that JSON data doesn't exceed maximum size

    Args:
        data: Dictionary or JSON-serializable object
        max_size_bytes: Maximum allowed size in bytes (default: 1MB)

    Raises:
        ValidationError: If data exceeds max size

    Returns:
        True if validation passes
    """
    try:
        size = len(json.dumps(data))
        if size > max_size_bytes:
            raise ValidationError(
                f"JSON data too large: {size} bytes (maximum: {max_size_bytes} bytes)"
            )
        return True
    except (TypeError, ValueError) as e:
        raise ValidationError(f"Invalid JSON data: {str(e)}")


def validate_json_depth(data, max_depth=10, current_depth=0):
    """
    Validate that JSON data doesn't have excessive nesting depth

    Args:
        data: Dictionary, list, or JSON-serializable object
        max_depth: Maximum allowed nesting depth (default: 10)
        current_depth: Current recursion depth (internal use)

    Raises:
        ValidationError: If data exceeds max depth

    Returns:
        True if validation passes
    """
    if current_depth > max_depth:
        raise ValidationError(
            f"JSON nesting too deep: exceeded maximum depth of {max_depth}"
        )

    if isinstance(data, dict):
        for value in data.values():
            validate_json_depth(value, max_depth, current_depth + 1)
    elif isinstance(data, list):
        for item in data:
            validate_json_depth(item, max_depth, current_depth + 1)

    return True


def validate_json_data(data, max_size_bytes=1048576, max_depth=10):
    """
    Validate JSON data for both size and depth

    Args:
        data: Dictionary or JSON-serializable object
        max_size_bytes: Maximum allowed size in bytes (default: 1MB)
        max_depth: Maximum allowed nesting depth (default: 10)

    Raises:
        ValidationError: If data fails validation

    Returns:
        True if all validations pass
    """
    validate_json_size(data, max_size_bytes)
    validate_json_depth(data, max_depth)
    return True
