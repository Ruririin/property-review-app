from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # Can be username or email
    password = serializers.CharField()

    def validate(self, attrs):
        identifier = attrs.get('identifier')
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError('Must include identifier and password')

        # Find the user object first (before authentication)
        user_obj = None
        try:
            if '@' in identifier:
                user_obj = User.objects.get(email=identifier)
            else:
                user_obj = User.objects.get(username=identifier)
        except User.DoesNotExist:
            # SECURITY: Don't reveal whether user exists or not
            raise serializers.ValidationError('Invalid credentials')

        # SECURITY: Check if account is locked
        if user_obj.is_account_locked():
            locked_until = user_obj.account_locked_until
            time_remaining = (locked_until - timezone.now()).total_seconds() / 60
            raise serializers.ValidationError(
                f'Account is locked due to too many failed login attempts. '
                f'Try again in {int(time_remaining)} minutes.'
            )

        # Try to authenticate with email or username
        if '@' in identifier:
            user = authenticate(username=identifier, password=password)
        else:
            user = authenticate(username=user_obj.email, password=password)

        # SECURITY: Handle failed login - increment counter and lock account if needed
        if not user:
            user_obj.failed_login_attempts += 1
            user_obj.last_failed_login = timezone.now()

            # Lock account after 5 failed attempts
            if user_obj.failed_login_attempts >= 5:
                # Exponential lockout: 15 min, 30 min, 1 hour, 2 hours, etc.
                lockout_minutes = 15 * (2 ** (user_obj.failed_login_attempts - 5))
                lockout_minutes = min(lockout_minutes, 1440)  # Max 24 hours
                user_obj.account_locked_until = timezone.now() + timedelta(minutes=lockout_minutes)

            user_obj.save(update_fields=['failed_login_attempts', 'account_locked_until', 'last_failed_login'])
            raise serializers.ValidationError('Invalid credentials')

        # SECURITY: Check if user is active
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')

        # SECURITY: Reset failed attempts on successful login
        if user.failed_login_attempts > 0:
            user.reset_failed_attempts()

        attrs['user'] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')