from rest_framework import serializers
from .models import WmsService, WmsLayerSelection

class WmsServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WmsService
        fields = ["id", "name", "base_url", "version", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        return WmsService.objects.create(owner=user, **validated_data)

class WmsLayerSelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WmsLayerSelection
        fields = ["id", "service", "layer_name", "layer_title",
                  "visible", "style", "extra", "updated_at"]
        read_only_fields = ["updated_at"]
