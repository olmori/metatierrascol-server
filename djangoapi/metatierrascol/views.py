from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WmsService, WmsLayerSelection
from .serializers import WmsServiceSerializer, WmsLayerSelectionSerializer
from .permissions import IsOwner

class WmsServiceViewSet(viewsets.ModelViewSet):
    serializer_class   = WmsServiceSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return WmsService.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["get", "post", "delete"], url_path="layers")
    def layers(self, request, pk=None):
        service = self.get_object()
        if request.method == "GET":
            qs = service.layer_selections.all()
            return Response(WmsLayerSelectionSerializer(qs, many=True).data)

        if request.method == "DELETE":
            service.layer_selections.all().delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        payload = request.data
        if not isinstance(payload, list):
            return Response({"detail": "Se esperaba una lista de selecciones."},
                            status=status.HTTP_400_BAD_REQUEST)

        results = []
        for item in payload:
            layer_name = item.get("layer_name")
            if not layer_name:
                continue
            obj, _created = WmsLayerSelection.objects.update_or_create(
                service=service, layer_name=layer_name,
                defaults={
                    "layer_title": item.get("layer_title", ""),
                    "visible":     item.get("visible", True),
                    "style":       item.get("style", ""),
                    "extra":       item.get("extra", {}) or {},
                }
            )
            results.append(obj)

        return Response(WmsLayerSelectionSerializer(results, many=True).data, status=200)

class WmsLayerSelectionViewSet(viewsets.ModelViewSet):
    serializer_class   = WmsLayerSelectionSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return WmsLayerSelection.objects.filter(service__owner=self.request.user)
