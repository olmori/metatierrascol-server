
from django.db import connection

from rest_framework import serializers

from core.myLib.geoModelSerializer import GeoModelSerializer
from .models import Buildings, Owners

class BuildingsSerializer(GeoModelSerializer):
    check_geometry_is_valid = True #if true ºit will check if the geometry is valid: not self-intersecting and closed
    check_st_relation = True #if true it will chck the relation of the geometry with the other geometries
    matrix9IM = 'T********' #matrix 9IM for the relation of the geometries: 'T********' = interiors intersects
    geoms_as_wkt = True #if true the serializer expects the geometries in WKT format. If false, in geojson format
    check_st_relation = True #if the new geometry must be checked against 
            #the other geometries in the table according to the matrix9IM. If any geometry
            #has the relation with the new geometry, the new geometry is not saved
            #an a validation error is raised, with the ids of the geometries that have the relation

    class Meta:
        model = Buildings
        fields = GeoModelSerializer.Meta.fields + ['description', 'area'] # The serializer 
                    #assumes that the model has the geometry field \textit{geom}. 
                    # add here the rest of the fields of the model that you want to serialize
                    # and that are not in the GeoModelSerializer

    def validate_geom(self, value):
        """Validates if a geometry is valid.
            Do not do anythin special. Simple is an example of how to override the father method
        """
        print('validate_geom, child')
        return super().validate_geom(value)
        
class OwnersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Owners
        fields = ['id', 'name', 'dni']
    
    #you can validate the fields of the model using the validate_<field_name> method
    #def validate_<field_name>(self, value):
    def validate_name(self, value):
        if 'bad' in value:
            raise serializers.ValidationError("The name can't contain 'bad'.")
        return value   