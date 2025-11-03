from django.db import models

# Create your models here.


class Owners(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=True, null=True)#optional
    dni = models.CharField(max_length=100, unique=True)#mandatory and unique
