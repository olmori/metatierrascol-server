
from rest_framework import serializers
from .models import Owners

class SmartOwnersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Owners
        fields = ['id', 'name', 'dni']
