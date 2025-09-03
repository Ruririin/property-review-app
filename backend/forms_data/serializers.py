from rest_framework import serializers
from .models import FormData

class FormDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormData
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')