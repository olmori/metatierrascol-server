# Bienvenido a la web del proyecto Metatierras Colombia 

Metatierras Colombia es un proyecto ADSIDEO financiado por el área de cooperación al desarrollo de la <a href='https://www.upv.es/'>Universitat Politècnica de València</a>, 
y realizado en colaboración con la <a href='https://www.forjandofuturos.org/'> Fundación Forjado Futuros</a>, y con la <a href="https://www.acpp.com/">Asamblea de Cooperación por la Paz</a>.

El objetivo del proyecto es diseñar software libre para la agilización de la regularización 
de tierras rústicas en Colombia.

Este repositorio contiene el desarrollo en Angular 18.0.3 del front-end que permite a los usuarios 
darse de alta en el sistema y visualizar los datos tomados con la app, y la descarga de los datos,
si se es dueño de los datos, o se tienen permisos suficientes.

# Proyectos relacionados con este

- Este proyecto es el front-end web de la api https://github.com/joamona/metatierrascol-api.
- Los datos se captura con la app localizada en el proyecto https://github.com/joamona/metatierrascol-app.

# Requerimientos para el desarrollo 

Se necesita la versión 22.2.0 de node y 18.0.3 de angular.

Arrancar Chrome con CORS desactivado:
google-chrome --disable-web-security --user-data-dir="[/home/joamona/chrome]"

- URL Servicio WMS: https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?REQUEST=GetCapabilities&SERVICE=WMS&VERSION=1.3.0
- El archivo geojson de prueba se encontrará en la ruta resources-project/ejemplo-colombia.geojson