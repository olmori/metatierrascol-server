# Create your views here.
#Django imports
from django.http import JsonResponse
from django.views import View
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.forms.models import model_to_dict
from django.contrib.auth.mixins import LoginRequiredMixin

#Geoss
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.db.models.functions import SnapToGrid


#rest_framework imports
from rest_framework import viewsets
from rest_framework import permissions

#My imports
from core.myLib.geometryTools import WkbConversor, GeometryChecks
from .models import Owners
from .serializers import SmartOwnersSerializer
from djangoapi.settings import EPSG_FOR_GEOMETRIES, ST_SNAP_PRECISION, MAX_NUMBER_OF_RETRIEVED_ROWS
from core.myLib.baseDjangoView import BaseDjangoView

class HelloWord(View):
    def get(self, request):
        return JsonResponse({"ok":True,"message": "Buildings. Hello world. Get", "data":[]})

    def post(self, request):
        return JsonResponse({"ok":True,"message": "Buildings. Hello world. Post", "data":[]})


class OwnersModelViewSet(viewsets.ModelViewSet):
    """
    DJANGO REST FRAMEWORK VIEWSET.

    The ModelViewSet class is a special view that Django Rest Framework 
        provides to handle the CRUD operations of a model
    
    The actions provided by the ModelViewSet class are:
        -list()  -> GET operation over /buildings/owners/. It will return all reccords
        -retrieve() ->GET operation over /buildings/owners/<id>/. 
                    It will return the record with the id.
        -create() -> POST operation over /buildings/owners/. It will insert a new record
        -update() -> PUT operation over /buildings/owners/<id>/. 
                    It will update the record with the id.
        -partial_update() -> PATCH operation over /buildings/owners/<id>/. 
                It will update partially the record with the id.
                The difference between update and partial_update is that the first one
                will update all the fields of the record, while the second one will update
                only the fields that are present in the request.
        -destroy() -> DELETE operation over /buildings/owners/<id>/. 
                It will delete the record with the id.
    """
    queryset = Owners.objects.all()
    serializer_class = SmartOwnersSerializer#The serializer that will be used to serialize 
                            #the data. and check the data that is sent in the request.
    permission_classes = [permissions.AllowAny]#Any can use it.
                                # Use https://rsinger86.github.io/drf-access-policy/
                                # to more advanced permissions management
