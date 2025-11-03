/**
 * Created on 25 feb. 2017
 * @author: Gaspar Mora-Navarro
 * Department of Cartographic Engineering Geodesy and Photogrammetry
 * Higher Technical School of Geodetic, Cartographic and Topographical Engineering
 * joamona@cgf.upv.es
 */

//import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Circle as CircleStyle, Fill, Stroke, Style, Text, Icon} from 'ol/style.js';
import { Feature } from 'ol';


/**
* Return the text to use to label
* @method get_etiqueta
* @param {feature} Feature - object wich represents a geometry from a OL3 vector layer
* @param {campo}  string - Name of the field of the feature to get the text. If the name is gid or id
* 						  The field does not exists. Then uses the method feature.getId(), which returns
* 						  'table.gid'. Spits the string and returns the gid
* @return none
*/
/*function get_etiqueta(feature: Feature,campo: string){
	var etiqueta;
	if ((campo=='gid') || (campo=='id')){
		etiqueta = feature.getId();
	}else{
		etiqueta = feature.get(campo);
	}
	return etiqueta.toString();
}*/

function get_etiqueta(feature: Feature, campo: string){
	let etiqueta;
	if ((campo === 'gid') || (campo === 'id')) {
		etiqueta = feature.getId();
	} else {
		etiqueta = feature.get(campo);
	}
	// Asegúrate de que etiqueta sea un string antes de retornar
	return etiqueta ? etiqueta.toString() : 'N/A';
}
/**
* Return a OL3 text style to label a vector layer
* @method createTextStyle
* @param {feature} Feature - object wich represents a geometry from a OL3 vector layer
* @param {campo}  string - Name of the field of the feature to use to label.
* @param {col} string - color to use for the label
* @return OL3 text style
*/
function createTextStyle (feature: Feature, campo: string, col:string): Text {
  return new Text({
	textAlign: 'left',
	offsetX: 5,
    textBaseline: 'middle',
    font: '14px Verdana',
    text: get_etiqueta(feature,campo),
    fill: new Fill({color: col}),
    stroke: new Stroke({color: col, width: 0.5})
  });
}

/**
* This is a example from how to use an image to draw points.
* This variable can be used in the image: property when a new ol.style.Style is created
*/
const pointImageSymbol = new Icon(({
	anchor: [0.5, 1],
	anchorXUnits: 'fraction',
	anchorYUnits: 'fraction',
	opacity: 1,
	scale:0.1,
		src: 'img/pozo.jpg'
}));
	
/**
* Return a OL3 style to label a vector layer. The style also give a symbology to the layer: point, polygon or lynestring
* @method createTextStyleFunction
* @param {campo}  string - Name of the field of the feature to use to label.
* @param {col} string - color to use for the label
* @return OL3 style with text style
*/
export function createPointTextStyle (campo: string, col: string) {
	  return function(feature:any, color:any) {
		  const estilo=new Style({
				image: new CircleStyle({
			        radius: 4,
			        fill: new Fill({
			          color: col
			        })
			      }), 
			    stroke: new Stroke({
			          color: '#80ff00',
			          width: 2
			        }),
			    fill: new Fill({
			            color: '#58FAAC'
			          }),
	      		text: createTextStyle(feature, campo, col)
		  });
	    return [estilo];
	  }
}