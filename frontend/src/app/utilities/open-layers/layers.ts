// openlayers
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import Tile from 'ol/layer/Tile.js';
import TileWMS from 'ol/source/TileWMS.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';
import { Style } from 'ol/style';
// import {Fill, Stroke, Style, Circle, Text} from 'ol/style.js';
// import {GeometryLayout} from 'ol/geom/GeometryLayout.js';
// import {Point} from 'ol/geom/Point.js';
// import {createPointTextStyle} from './labels.js';



// services
import {DataService} from '../../main/services/data.service';
import {MessageService} from '../../main/services/message.service';
import {MatSnackBar} from '@angular/material/snack-bar';

//models
import {MapLayerDefinition} from '../models/map-layer-definition';
import {MapLayer} from '../models/map-layer';
import {Message} from '../../main/models/message';

export function createOsmLayer(): MapLayer {
    const l: MapLayerDefinition = new MapLayerDefinition();
    l.description='Open Street Map';
    l.layer_type="OSM";
    l.gid="0";
    l.layer_order=0;
    l.layernamestoload="Open Street Map";
    l.name="Open Street Map";
    l.url="https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    l.wmsversion="1.1.1";
    const olLayerObject = new TileLayer({
      source: new XYZ({
        url: l.url
      })
    });
    olLayerObject.setZIndex(Number(l.layer_order));
    //console.log(l.name, l.layer_order);
    const wmsMapLayer = new MapLayer();
    wmsMapLayer.olLayerObject = olLayerObject;
    wmsMapLayer.visible = true;
    wmsMapLayer.mapLayerDefinition = l;
    return wmsMapLayer;
  }

/**
 * 
 * @param jsonAnswer : array of rows. Each row is an object {key: value, ..., st_asgeojson: geojson}. The geojson must be in the field of the row st_asgeojson
 * @param id_field_name : name of the primary key field of each row, used as id from each openlayers feature
 * @returns a list of features ready to read in a VectorSource class from OpenLayers
 */
export function jsonAnswerDataToListElements(jsonAnswer, primaryKeyFieldName) {
    const n = jsonAnswer.length;
    const r = [];
    for (let i = 0; i < n; ++i ) {
      const row = jsonAnswer[i];
      const geomJson = {"type":"Feature",
                      "id": String(row[primaryKeyFieldName]),
                      "properties": row,
                      "geometry": JSON.parse(row.st_asgeojson)
                    };
      r.push(geomJson);
    }
    return r;
  }

export function  createWmsMapLayer(l: MapLayerDefinition): MapLayer {
    let olLayerObject;
    olLayerObject = new Tile({
          source: new TileWMS({
            url: l.url,
            params: {
              'LAYERS': l.layernamestoload, 'VERSION': l.wmsversion, 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
            },
          }), //tilewms
          title: l.name
        }  as BaseLayerOptions);//wmslayer
    olLayerObject.setZIndex(Number(l.layer_order));
    //console.log(l.name, l.layer_order);
    const wmsMapLayer = new MapLayer();
    wmsMapLayer.olLayerObject = olLayerObject;
    wmsMapLayer.visible = true;
    wmsMapLayer.mapLayerDefinition = l;
    return wmsMapLayer;
  }

/**
 * Create a MapLayer object, with a openlayers vector layer. The content of the layer is retrieved from the mapLayerDefinition.url
 * @param mapLayerDefinition : layer definition
 * @param dataService : service to load the data from a url
 * @param messageService : to send messages
 * @param snackBar : to show messages
 * @returns MapLayer
 */
export function createVectorLayerFromView (
    mapLayerDefinition: MapLayerDefinition, primaryKeyFieldName: string,
    dataService: DataService, messageService: MessageService, snackBar: MatSnackBar): MapLayer {
    const l: MapLayer = new MapLayer();
    const vectorSource = new VectorSource();
    const geomsLayer = new VectorLayer({
      source: vectorSource,
      style: mapLayerDefinition.style,
      title: mapLayerDefinition.name
    }  as BaseLayerOptions);
    geomsLayer.setZIndex(Number(mapLayerDefinition.layer_order));
    l.mapLayerDefinition=mapLayerDefinition;
    l.olLayerObject=geomsLayer;
    l.visible=true;
    loadElementsToVectorLayerFromView(mapLayerDefinition.url, geomsLayer, primaryKeyFieldName, dataService, messageService, snackBar);
    return l;
  }


/**
 * Create a MapLayer object, with a openlayers vector layer. The content of the layer is retrieved from the mapLayerDefinition.url
 * @param mapLayerDefinition : layer definition
 * @param dataService : service to load the data from a url
 * @param messageService : to send messages
 * @param snackBar : to show messages
 * @returns MapLayer
 */
export function createVectorLayerFromArrayOfElements (
  mapLayerDefinition: MapLayerDefinition, primaryKeyFieldName: string,
  arrayOfElements): MapLayer {
  const l: MapLayer = new MapLayer();
  const vectorSource = new VectorSource();
  const geomsLayer = new VectorLayer({
    source: vectorSource,
     style: mapLayerDefinition.style,
     //title: mapLayerDefinition.name
  });
  geomsLayer.setZIndex(Number(mapLayerDefinition.layer_order));
  l.mapLayerDefinition = mapLayerDefinition;
  l.olLayerObject = geomsLayer;
  l.visible = true;
  loadElementsToVectorLayerFromArrayOfElements(arrayOfElements, geomsLayer, primaryKeyFieldName);
  return l;
}


/**
 * 
 * @param url : url to load the geometries
 * @param olLayerObject openlayers vector layer object to load the geometries
 * Create a MapLayer object, with a openlayers vector layer. The content of the layer is retrieved from the mapLayerDefinition.url
 * @param dataService : service to load the data from a url
 * @param messageService : to send messages
 * @param snackBar : to show messages
 * @returns Nothing. Simply load the geometries to the vector layer
 */
export function loadElementsToVectorLayerFromView(url: string, olLayerObject, primaryKeyFieldName: string,
     dataService: DataService, messageService: MessageService, snackBar: MatSnackBar) {
    dataService.get(url).subscribe(
      data  => {
          const message = new Message(data.ok, data.message);
          messageService.add(message);
          snackBar.open(message.message, '', {duration: 3000});
          //console.log(url, data);
          const listaFeat = jsonAnswerDataToListElements(data.data, primaryKeyFieldName);
          const geojsonObject = {
                  "type": "FeatureCollection",
                  "features": listaFeat
          };
          const vectorSource = new VectorSource({
            features: (new GeoJSON()).readFeatures(geojsonObject)
          });
          olLayerObject.setSource(vectorSource);
      },
      error  => {
          console.log("Error", error, error.message);
          const message = new Message("false",error.message);
          messageService.add(message);
          snackBar.open(message.message, '', {duration: 3000});
          messageService.add(message);
      }
    ); // subcribe
}


/**
 * Loads an array of elements, with a field 'st_asgeojson' in a open layers VectorLayer
 * @param olLayerObject openlayers vector layer object to load the geometries
 * Create a MapLayer object, with a openlayers vector layer. The content of the layer is retrieved from the mapLayerDefinition.url
 * @returns Nothing. Simply load the geometries to the vector layer
 */
export function loadElementsToVectorLayerFromArrayOfElements(arrayOfElements, olLayerObject, primaryKeyFieldName: string) {
  const listaFeat = jsonAnswerDataToListElements(arrayOfElements, primaryKeyFieldName);
  const geojsonObject = {
          "type": "FeatureCollection",
          "features": listaFeat
  };
  const vectorSource = new VectorSource({
    features: (new GeoJSON()).readFeatures(geojsonObject)
  });
  olLayerObject.setSource(vectorSource);
}
