# metatierrascol/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import WmsServiceViewSet, WmsLayerSelectionViewSet

router = DefaultRouter()
router.register(r"services", WmsServiceViewSet, basename="wms-service")
router.register(r"layers",   WmsLayerSelectionViewSet, basename="wms-layer")

urlpatterns = [
    path("", include(router.urls)),
]
