from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class WmsService(models.Model):
    owner      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wms_services", db_column="user_id")
    name       = models.CharField(max_length=120)
    base_url   = models.URLField(help_text="URL base del WMS (sin parámetros)")
    version    = models.CharField(max_length=16, default="1.3.0", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wms_service"
        unique_together = (("owner", "name"), )
        ordering = ["-name"]

    def __str__(self):
        return f"{self.name} ({self.owner})"

class WmsLayerSelection(models.Model):
    service    = models.ForeignKey(WmsService, on_delete=models.CASCADE, related_name="layer_selections", db_column="service_id")
    layer_name = models.CharField(max_length=256)    
    layer_title= models.CharField(max_length=256, blank=True) 
    visible    = models.BooleanField(default=False) 
    style      = models.CharField(max_length=128, blank=True)
    extra      = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wms_layer_selection"
        unique_together = (("service", "layer_name"), )
        ordering = ["layer_name"]

    def __str__(self):
        return f"{self.layer_name} @ {self.service.name}"
