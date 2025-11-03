from django.db import models
from django.contrib.gis.db import models as gis_models
from djangoapi.settings import EPSG_FOR_GEOMETRIES
# Create your models here.
class Buildings(models.Model):
    id = models.AutoField(primary_key=True)
    description = models.CharField(max_length=100, blank=True, null=True)
    area = models.FloatField(blank=True, null=True)
    geom = gis_models.PolygonField(srid=int(EPSG_FOR_GEOMETRIES), blank=True, null=True)
#    def __str__(self):
#        return str(self.id)

class Owners(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=True, null=True)#optional
    dni = models.CharField(max_length=100, unique=True)#mandatory and unique
