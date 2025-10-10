from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')
    
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
        
        if identifier and password:
            # Try to authenticate with email or username
            if '@' in identifier:
                # If identifier is email, use it directly as username since USERNAME_FIELD = 'email'
                user = authenticate(username=identifier, password=password)
            else:
                # If identifier is username, find the user and get their email
                try:
                    user_obj = User.objects.get(username=identifier)
                    user = authenticate(username=user_obj.email, password=password)
                except User.DoesNotExist:
                    user = None
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include identifier and password')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')