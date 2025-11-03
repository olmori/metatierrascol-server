import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileWMS from 'ol/source/TileWMS';
import { XYZ } from 'ol/source';
import { Feature } from 'ol';
import { GeoJSON } from 'ol/format';
import { Geometry, Polygon } from 'ol/geom';
import { fromLonLat, transformExtent, toLonLat } from 'ol/proj';
import { defaults as defaultControls, ScaleLine, FullScreen } from 'ol/control';
import { Draw, Modify, Snap, Select } from 'ol/interaction';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { getLength, getArea } from 'ol/sphere';
import { Coordinate } from 'ol/coordinate';
import { ActiveLayer } from '../components/wms-layer/wms-layer.component';
import { AreaDataModel } from '../models/areaDataModel';
export type BaseMapId = 'google_streets' | 'google_satellite' | 'osm';


export interface MapLayerInfo {
  id: string;
  name: string;
  type: 'wms' | 'vector' | 'base';
  layer: any; // OpenLayers layer object
  visible: boolean;
  opacity: number;
  zIndex: number;
}

export interface GeoJSONUpload {
  id: string;
  name: string;
  features: Feature<Geometry>[];
  fileName: string;
  uploadDate: Date;
}

export interface AreaPolygon {
  id: string;
  areaData: AreaDataModel;
  feature: Feature<Polygon>;
  coordinates: Coordinate[];
  area: number;
  perimeter: number;
}

export type DrawingMode = 'none' | 'polygon' | 'modify';

export interface PolygonDrawnEvent {
  coordinates: Coordinate[];
  area: number;
  perimeter: number;
  feature: Feature<Polygon>;
}

@Injectable({
  providedIn: 'root'
})
export class MapViewerService {
  private map: Map | null = null;
  private mapLayers = new BehaviorSubject<MapLayerInfo[]>([]);
  private geoJSONUploads = new BehaviorSubject<GeoJSONUpload[]>([]);
  private areaPolygons = new BehaviorSubject<AreaPolygon[]>([]);
  
  // Drawing interactions and layers
  private drawingSource: VectorSource = new VectorSource();
  private drawingLayer = new VectorLayer({ 
    source: this.drawingSource 
  });
  private drawInteraction: Draw | null = null;
  private modifyInteraction: Modify | null = null;
  private snapInteraction: Snap | null = null;
  private selectInteraction: Select | null = null;
  private currentDrawingMode = new BehaviorSubject<DrawingMode>('none');
  
  // Polygon drawn event
  private polygonDrawn = new BehaviorSubject<PolygonDrawnEvent | null>(null);
  
  // Default map configuration for Colombia (Bogotá with street-level detail)
  private readonly defaultCenter = fromLonLat([-74.0721, 4.7110]); // Bogotá
  private readonly defaultZoom = 12; // Higher zoom to see streets clearly

  private baseLayer: TileLayer<XYZ> | null = null;


  constructor() {
    this.loadGeoJSONFromStorage();
    this.loadAreasFromStorage();
    this.setupDrawingStyles();
  }

  /**
   * Convert external WMS URLs to use proxy to avoid CORS issues
   */
  private getProxyUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Map of external hosts to proxy paths
      const proxyMap: { [key: string]: string } = {
        'www.ign.es': '/wms-proxy',
        'image.discomap.eea.europa.eu': '/arcgis-proxy'
      };

      // Check if this URL needs a proxy
      for (const [host, proxyPath] of Object.entries(proxyMap)) {
        if (hostname === host) {
          // Replace the host with the proxy path
          return url.replace(`https://${host}`, proxyPath);
        }
      }

      // Return original URL if no proxy needed
      return url;
    } catch (error) {
      console.error('Error processing URL for proxy:', error);
      return url;
    }
  }

  // Map initialization
 initializeMap(targetElement: string | HTMLElement): Map {
  // Base layer por defecto (el que ya usabas)
  this.baseLayer = new TileLayer({
    source: new XYZ({
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es',
    }),
    zIndex: 0
  });

  this.drawingLayer.setZIndex(2000);

  this.map = new Map({
    target: targetElement,
    layers: [this.baseLayer, this.drawingLayer],
    view: new View({
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      projection: 'EPSG:3857'
    }),
    controls: defaultControls({
      zoom: false,
      rotate: false,
      attribution: false,
    }).extend([
      new ScaleLine(),
      // quitaste FullScreen porque usas tu propio botón
    ])
  });

  this.setupDrawingInteractions();

  const baseLayerInfo: MapLayerInfo = {
    id: 'base-osm',
    name: 'Google Streets',
    type: 'base',
    layer: this.baseLayer,
    visible: true,
    opacity: 1,
    zIndex: 0
  };

  const currentLayers = this.mapLayers.value;
  this.mapLayers.next([baseLayerInfo, ...currentLayers]);

  this.loadExistingAreas();

  return this.map;
}


  // Get map instance
  getMap(): Map | null {
    return this.map;
  }

  // === CONTROLES DE ZOOM PERSONALIZADOS ===
zoomIn(step: number = 1): void {
  if (!this.map) return;
  const view = this.map.getView();
  const currentZoom = view.getZoom() ?? this.defaultZoom;
  view.animate({
    zoom: currentZoom + step,
    duration: 250
  });
}

zoomOut(step: number = 1): void {
  if (!this.map) return;
  const view = this.map.getView();
  const currentZoom = view.getZoom() ?? this.defaultZoom;
  view.animate({
    zoom: currentZoom - step,
    duration: 250
  });
}

zoomTo(level: number): void {
  if (!this.map) return;
  this.map.getView().animate({
    zoom: level,
    duration: 250
  });
}

setBaseMap(id: BaseMapId): void {
  if (!this.baseLayer) return;

  let source: XYZ | null = null;

  switch (id) {
    case 'google_streets':
      source = new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es',
      });
      break;

    case 'google_satellite':
      source = new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&hl=es',
      });
      break;

    case 'osm':
      source = new XYZ({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors',
      });
      break;
  }

  if (source) {
    this.baseLayer.setSource(source);
    // opcional: actualizar nombre en mapLayers si quieres
    const layers = this.mapLayers.value;
    const base = layers.find(l => l.type === 'base');
    if (base) {
      base.name =
        id === 'google_streets' ? 'Google Calles' :
        id === 'google_satellite' ? 'Google Satélite' :
        'OpenStreetMap';
      this.mapLayers.next([...layers]);
    }
  }
}



  // Observable for map layers
  getMapLayers(): Observable<MapLayerInfo[]> {
    return this.mapLayers.asObservable();
  }

  // Add WMS layer to map
  addWMSLayer(activeLayer: ActiveLayer): void {
    if (!this.map) {
      console.error('❌ No hay mapa inicializado');
      return;
    }

    console.log('🗺️ Agregando capa WMS al mapa:', {
      layerId: activeLayer.id,
      layerName: activeLayer.layer.name,
      serviceUrl: activeLayer.serviceId,
      opacity: activeLayer.style.opacity,
      visible: activeLayer.style.visible,
      zIndex: activeLayer.style.zIndex
    });

    // Limpiar la URL del proxy CORS si está presente
    let cleanUrl = activeLayer.serviceId;
    if (cleanUrl && cleanUrl.includes('corsproxy.io')) {
      // Extraer la URL original del proxy
      try {
        const proxyPrefix = 'https://corsproxy.io/?';
        if (cleanUrl.startsWith(proxyPrefix)) {
          cleanUrl = decodeURIComponent(cleanUrl.substring(proxyPrefix.length));
          console.log('🧹 URL limpiada del proxy:', cleanUrl);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo limpiar la URL del proxy:', error);
      }
    }

    // Verificar que la URL sea válida
    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      console.error('❌ URL inválida para el servicio WMS:', cleanUrl);
      return;
    }

    // Limpiar parámetros de GetCapabilities de la URL base
    try {
      const urlObj = new URL(cleanUrl);

      // Eliminar parámetros relacionados con GetCapabilities
      const paramsToDelete = ['SERVICE', 'service', 'REQUEST', 'request', 'VERSION', 'version'];
      paramsToDelete.forEach(param => urlObj.searchParams.delete(param));

      // Reconstruir URL limpia
      const cleanedUrl = urlObj.searchParams.toString()
        ? urlObj.origin + urlObj.pathname + '?' + urlObj.searchParams.toString()
        : urlObj.origin + urlObj.pathname;

      console.log('🧹 URL después de limpiar GetCapabilities:', cleanedUrl);
      cleanUrl = cleanedUrl;
    } catch (error) {
      console.warn('⚠️ No se pudieron limpiar los parámetros de la URL:', error);
    }

    // Convert URL to use proxy if needed to avoid CORS issues
    // NOTA: Si tienes problemas de CORS, cambia useProxy a true
    const useProxy = false; // Cambiar a true si hay problemas de CORS
    const proxyUrl = useProxy ? this.getProxyUrl(cleanUrl) : cleanUrl;

    console.log('🔄 URL original:', activeLayer.serviceId);
    console.log('🧹 URL limpia:', cleanUrl);
    console.log('🔄 Usando proxy:', useProxy);
    console.log('🔄 URL final para OpenLayers:', proxyUrl);

    const wmsParams = {
      'LAYERS': activeLayer.layer.name,
      'TILED': false, // Deshabilitar TILED para mejor compatibilidad
      'VERSION': '1.3.0',
      'FORMAT': 'image/png',
      'TRANSPARENT': true
      // No enviar CRS en params, lo maneja OpenLayers automáticamente
    };

    console.log('🎨 Parámetros WMS:', wmsParams);

    const wmsSource = new TileWMS({
      url: proxyUrl,
      params: wmsParams,
      serverType: 'mapserver', // ArcGIS uses MapServer
      transition: 0,
      crossOrigin: 'anonymous' // Important for CORS
    });

    // Log tile load events for debugging
    let tileCount = 0;
    wmsSource.on('tileloadstart', (event: any) => {
      tileCount++;
      if (tileCount === 1) {
        // Solo loggear la primera tile para ver la URL generada
        const tile = event.tile;
        const tileCoord = tile.getTileCoord();
        const urls = wmsSource.getUrls();
        console.log('🔵 Iniciando carga de tile WMS...');
        console.log('🌐 URL base del source:', urls);
        console.log('📍 Coordenadas de tile:', tileCoord);
        console.log('🔗 URL completa que se generará:', wmsSource.tileUrlFunction(tileCoord, 1, this.map!.getView().getProjection()));
      }
    });

    wmsSource.on('tileloadend', (event: any) => {
      const tile = event.tile;
      const img = tile.getImage() as HTMLImageElement;

      // Verificar si la imagen tiene contenido visible
      if (img.width > 0 && img.height > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Check if all pixels are transparent
          let hasVisiblePixels = false;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) { // Check alpha channel
              hasVisiblePixels = true;
              break;
            }
          }

          if (hasVisiblePixels) {
            console.log('✅ Tile WMS cargado con CONTENIDO VISIBLE. Dimensiones:', img.width, 'x', img.height);
          } else {
            console.log('⚪ Tile WMS cargado pero TRANSPARENTE (sin datos). Dimensiones:', img.width, 'x', img.height);
          }
        }
      } else {
        console.log('✅ Tile WMS cargado. Dimensiones:', img.width, 'x', img.height);
      }
    });

    wmsSource.on('tileloaderror', (event: any) => {
      console.error('❌ Error cargando tile WMS:', event);
      const tile = event.tile;
      if (tile) {
        const img = tile.getImage() as HTMLImageElement;
        console.error('❌ URL que falló:', img.src);
        console.error('📋 Parámetros WMS usados:', wmsParams);
        console.error('🌐 URL base del servicio:', proxyUrl);
        console.error('🔍 Verificar que el servicio WMS sea accesible desde el navegador');
      }
    });

    const wmsLayer = new TileLayer({
      source: wmsSource,
      opacity: activeLayer.style.opacity,
      visible: activeLayer.style.visible,
      zIndex: activeLayer.style.zIndex + 10 // Ensure WMS layers are above base layer
    });

    console.log('✅ Capa WMS creada, agregándola al mapa...');
    this.map.addLayer(wmsLayer);
    console.log('✅ Capa agregada al mapa de OpenLayers');

    // Add to internal tracking
    const layerInfo: MapLayerInfo = {
      id: activeLayer.id,
      name: activeLayer.layer.title || activeLayer.layer.name,
      type: 'wms',
      layer: wmsLayer,
      visible: activeLayer.style.visible,
      opacity: activeLayer.style.opacity,
      zIndex: activeLayer.style.zIndex + 10
    };

    const currentLayers = this.mapLayers.value;
    this.mapLayers.next([...currentLayers, layerInfo]);
    console.log('📊 Total de capas en el mapa:', this.mapLayers.value.length);
  }

  // Update WMS layer style
  updateWMSLayer(activeLayer: ActiveLayer): void {
    const layerInfo = this.mapLayers.value.find(l => l.id === activeLayer.id);
    if (layerInfo && layerInfo.type === 'wms') {
      layerInfo.layer.setOpacity(activeLayer.style.opacity);
      layerInfo.layer.setVisible(activeLayer.style.visible);
      layerInfo.layer.setZIndex(activeLayer.style.zIndex + 10);
      
      // Update internal state
      layerInfo.opacity = activeLayer.style.opacity;
      layerInfo.visible = activeLayer.style.visible;
      layerInfo.zIndex = activeLayer.style.zIndex + 10;
    }
  }

  // Remove WMS layer
  removeWMSLayer(layerId: string): void {
    if (!this.map) return;

    const layerInfo = this.mapLayers.value.find(l => l.id === layerId);
    if (layerInfo) {
      this.map.removeLayer(layerInfo.layer);
      
      // Remove from internal tracking
      const updatedLayers = this.mapLayers.value.filter(l => l.id !== layerId);
      this.mapLayers.next(updatedLayers);
    }
  }

  // Update layer order
  updateLayersOrder(activeLayers: ActiveLayer[]): void {
    activeLayers.forEach((activeLayer, index) => {
      const layerInfo = this.mapLayers.value.find(l => l.id === activeLayer.id);
      if (layerInfo && layerInfo.type === 'wms') {
        const newZIndex = index + 10;
        layerInfo.layer.setZIndex(newZIndex);
        layerInfo.zIndex = newZIndex;
      }
    });
  }

  // Clear all WMS layers
  clearAllWMSLayers(): void {
    if (!this.map) return;

    const wmsLayers = this.mapLayers.value.filter(l => l.type === 'wms');
    wmsLayers.forEach(layerInfo => {
      this.map!.removeLayer(layerInfo.layer);
    });

    // Keep only base layers
    const baseLayers = this.mapLayers.value.filter(l => l.type === 'base');
    this.mapLayers.next(baseLayers);
  }

  // Check if layer is already in map
  isLayerInMap(layerId: string): boolean {
    return this.mapLayers.value.some(l => l.id === layerId);
  }

  // Zoom to WMS layer extent
  zoomToWMSLayer(activeLayer: ActiveLayer): void {
    if (!this.map) return;

    // Get bounding box from layer metadata
    const bbox = activeLayer.layer.boundingBox;

    console.log('📦 BoundingBox original:', bbox);

    if (bbox) {
      try {
        // Determinar el CRS correcto
        let sourceCRS = bbox.crs || 'EPSG:4326';

        // Normalizar el CRS
        if (sourceCRS.includes('CRS:84')) {
          sourceCRS = 'EPSG:4326';
        }

        console.log('🗺️ CRS de origen:', sourceCRS);
        console.log('📐 Extent original:', [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy]);

        let extent: number[];

        // Si el CRS es EPSG:4326, verificar el orden de las coordenadas
        if (sourceCRS === 'EPSG:4326') {
          // En EPSG:4326, las coordenadas deberían ser (lon, lat)
          // Pero algunos servicios las envían como (lat, lon)

          // Detectar si están en orden (lat, lon) - latitud está entre -90 y 90
          // Si minx y maxx están en el rango de latitud (-90 a 90) pero miny y maxy
          // están fuera del rango de latitud, probablemente están invertidas

          const minxIsLat = Math.abs(bbox.minx) <= 90;
          const maxxIsLat = Math.abs(bbox.maxx) <= 90;
          const minyIsLon = Math.abs(bbox.miny) > 90 || Math.abs(bbox.miny) <= 180;
          const maxyIsLon = Math.abs(bbox.maxy) > 90 || Math.abs(bbox.maxy) <= 180;

          // Si parece que x son latitudes (< 90) y y son longitudes, están invertidas
          if (minxIsLat && maxxIsLat && (Math.abs(bbox.minx) > 0 || Math.abs(bbox.maxx) > 0)) {
            console.log('⚠️ Detectadas coordenadas en orden (lat, lon), invirtiendo a (lon, lat)...');
            extent = transformExtent(
              [bbox.miny, bbox.minx, bbox.maxy, bbox.maxx], // Invertir: de (lat,lon) a (lon,lat)
              'EPSG:4326',
              'EPSG:3857'
            );
          } else {
            // Orden correcto (lon, lat)
            console.log('✅ Coordenadas en orden correcto (lon, lat)');
            extent = transformExtent(
              [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy],
              'EPSG:4326',
              'EPSG:3857'
            );
          }
        } else if (sourceCRS === 'EPSG:3857') {
          // Ya está en la proyección del mapa, usar directamente
          extent = [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy];
        } else {
          // Intentar transformación directa
          extent = transformExtent(
            [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy],
            sourceCRS,
            'EPSG:3857'
          );
        }

        console.log('📐 Extent transformado (EPSG:3857):', extent);

        // Validar que el extent sea válido
        if (extent && extent.every(coord => isFinite(coord))) {
          // Zoom to extent with padding
          this.map.getView().fit(extent, {
            padding: [100, 100, 100, 100],
            duration: 1000,
            maxZoom: 18 // Limitar el zoom máximo
          });
          console.log('✅ Zoom a extent completado');
        } else {
          console.error('❌ Extent inválido:', extent);
        }

      } catch (error) {
        console.error('❌ Error zooming to layer extent:', error);
        console.error('Intentando con EPSG:4326 por defecto...');

        // Fallback: try with direct EPSG:4326 transformation
        try {
          const extent = transformExtent(
            [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy],
            'EPSG:4326',
            'EPSG:3857'
          );
          this.map.getView().fit(extent, {
            padding: [100, 100, 100, 100],
            duration: 1000,
            maxZoom: 18
          });
          console.log('✅ Zoom con fallback EPSG:4326 completado');
        } catch (fallbackError) {
          console.error('❌ Fallback extent transformation also failed:', fallbackError);
        }
      }
    } else {
      console.warn('⚠️ Layer does not have bounding box information');
    }
  }

  // GeoJSON functionality
  uploadGeoJSON(file: File): Promise<GeoJSONUpload> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const geoJSONText = event.target?.result as string;
          const geoJSONFormat = new GeoJSON();
          
          // Parse and transform features to map projection
          const features = geoJSONFormat.readFeatures(geoJSONText, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          });

          const upload: GeoJSONUpload = {
            id: this.generateId(),
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            features: features,
            fileName: file.name,
            uploadDate: new Date()
          };

          // Save to internal state and storage
          const currentUploads = this.geoJSONUploads.value;
          const updatedUploads = [...currentUploads, upload];
          this.geoJSONUploads.next(updatedUploads);
          this.saveGeoJSONToStorage();

          resolve(upload);
        } catch (error) {
          reject(new Error(`Error parsing GeoJSON: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  }

  // Add GeoJSON to map
  addGeoJSONLayer(upload: GeoJSONUpload): void {
    if (!this.map) return;

    const vectorSource = new VectorSource({
      features: upload.features
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1000 // Ensure vector layers are on top
    });

    this.map.addLayer(vectorLayer);

    // Add to internal tracking
    const layerInfo: MapLayerInfo = {
      id: upload.id,
      name: upload.name,
      type: 'vector',
      layer: vectorLayer,
      visible: true,
      opacity: 1,
      zIndex: 1000
    };

    const currentLayers = this.mapLayers.value;
    this.mapLayers.next([...currentLayers, layerInfo]);

    // Zoom to vector layer extent if it has features
    if (upload.features.length > 0) {
      const extent = vectorSource.getExtent();
      this.map.getView().fit(extent, { padding: [50, 50, 50, 50] });
    }
  }

  // Zoom to GeoJSON extent
  zoomToGeoJSON(upload: GeoJSONUpload): void {
    if (!this.map || !upload.features || upload.features.length === 0) return;

    // Calculate the extent of all features
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    upload.features.forEach(feature => {
      const geometry = feature.getGeometry();
      if (geometry) {
        const extent = geometry.getExtent();
        minX = Math.min(minX, extent[0]);
        minY = Math.min(minY, extent[1]);
        maxX = Math.max(maxX, extent[2]);
        maxY = Math.max(maxY, extent[3]);
      }
    });

    if (minX !== Infinity) {
      const fullExtent = [minX, minY, maxX, maxY];
      this.map.getView().fit(fullExtent, { 
        padding: [50, 50, 50, 50],
        duration: 1000
      });
    }
  }

  // Remove GeoJSON layer
  removeGeoJSONLayer(uploadId: string): void {
    if (!this.map) return;

    // Remove from map
    const layerInfo = this.mapLayers.value.find(l => l.id === uploadId);
    if (layerInfo) {
      this.map.removeLayer(layerInfo.layer);
      
      // Remove from internal tracking
      const updatedLayers = this.mapLayers.value.filter(l => l.id !== uploadId);
      this.mapLayers.next(updatedLayers);
    }

    // Remove from uploads
    const updatedUploads = this.geoJSONUploads.value.filter(u => u.id !== uploadId);
    this.geoJSONUploads.next(updatedUploads);
    this.saveGeoJSONToStorage();
  }

  // Get GeoJSON uploads observable
  getGeoJSONUploads(): Observable<GeoJSONUpload[]> {
    return this.geoJSONUploads.asObservable();
  }

  // Zoom to extent
  zoomToExtent(extent: number[]): void {
    if (!this.map) return;
    
    const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
    this.map.getView().fit(transformedExtent, { padding: [50, 50, 50, 50] });
  }

  // Reset map view to default
  resetView(): void {
    if (!this.map) return;
    
    this.map.getView().animate({
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      duration: 1000
    });
  }

  // Private methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private saveGeoJSONToStorage(): void {
    // Convert features to serializable format
    const serializable = this.geoJSONUploads.value.map(upload => ({
      id: upload.id,
      name: upload.name,
      fileName: upload.fileName,
      uploadDate: upload.uploadDate,
      geoJSON: new GeoJSON().writeFeatures(upload.features, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      })
    }));
    
    localStorage.setItem('geojson-uploads', JSON.stringify(serializable));
  }

  private loadGeoJSONFromStorage(): void {
    const stored = localStorage.getItem('geojson-uploads');
    if (stored) {
      try {
        const serializable = JSON.parse(stored);
        const uploads: GeoJSONUpload[] = serializable.map((item: any) => ({
          id: item.id,
          name: item.name,
          fileName: item.fileName,
          uploadDate: new Date(item.uploadDate),
          features: new GeoJSON().readFeatures(item.geoJSON, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          })
        }));
        
        this.geoJSONUploads.next(uploads);
      } catch (error) {
        console.error('Error loading GeoJSON from storage:', error);
      }
    }
  }

  // ==== AREA POLYGON MANAGEMENT ====

  // Setup drawing styles
  private setupDrawingStyles(): void {
    const fillColor = 'rgba(255, 165, 0, 0.3)'; // Orange with transparency
    const strokeColor = '#ff6600';
    
    this.drawingLayer.setStyle(new Style({
      fill: new Fill({
        color: fillColor
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: 2
      }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: strokeColor
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2
        })
      })
    }));
  }

  // Setup drawing interactions
  private setupDrawingInteractions(): void {
    if (!this.map) return;

    // Modify interaction for editing existing polygons
    this.modifyInteraction = new Modify({
      source: this.drawingSource
    });

    // Snap interaction for precise drawing
    this.snapInteraction = new Snap({
      source: this.drawingSource
    });

    // Selection interaction for selecting polygons
    this.selectInteraction = new Select({
      layers: [this.drawingLayer]
    });

    // Add all interactions to map (initially inactive)
    this.map.addInteraction(this.modifyInteraction);
    this.map.addInteraction(this.snapInteraction);
    this.map.addInteraction(this.selectInteraction);

    // Setup event listeners
    this.setupDrawingEventListeners();
  }

  // Setup drawing event listeners
  private setupDrawingEventListeners(): void {
    if (!this.modifyInteraction || !this.selectInteraction) return;

    // Listen for modify events
    this.modifyInteraction.on('modifyend', (event) => {
      const features = event.features.getArray();
      features.forEach(feature => {
        this.updateAreaFromFeature(feature as Feature<Polygon>);
      });
    });

    // Listen for selection events
    this.selectInteraction.on('select', (event) => {
      // Handle polygon selection if needed
    });
  }

  // Enable drawing mode
  enableDrawing(): void {
    if (!this.map) return;

    // Remove existing draw interaction
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }

    // Create new draw interaction
    this.drawInteraction = new Draw({
      source: this.drawingSource,
      type: 'Polygon'
    });

    // Add draw interaction to map
    this.map.addInteraction(this.drawInteraction);

    // Listen for draw events
    this.drawInteraction.on('drawend', (event) => {
      const feature = event.feature as Feature<Polygon>;
      this.onPolygonDrawn(feature);
    });

    this.currentDrawingMode.next('polygon');
  }

  // Disable drawing mode
  disableDrawing(): void {
    if (!this.map || !this.drawInteraction) return;

    this.map.removeInteraction(this.drawInteraction);
    this.drawInteraction = null;
    this.currentDrawingMode.next('none');
  }

  // Enable modify mode
  enableModifyMode(): void {
    this.disableDrawing();
    this.currentDrawingMode.next('modify');
  }

  // Get current drawing mode
  getDrawingMode(): Observable<DrawingMode> {
    return this.currentDrawingMode.asObservable();
  }

  // Get polygon drawn events
  getPolygonDrawnEvent(): Observable<PolygonDrawnEvent | null> {
    return this.polygonDrawn.asObservable();
  }

  // Handle polygon drawn
  private onPolygonDrawn(feature: Feature<Polygon>): void {
    console.log('Polígono dibujado, procesando...', feature);
    
    const coordinates = this.getPolygonCoordinates(feature);
    const area = this.calculatePolygonArea(feature);
    const perimeter = this.calculatePolygonPerimeter(feature);

    // Set temporary ID
    const tempId = this.generateId();
    feature.setId(tempId);

    console.log('Polígono con ID temporal:', tempId, 'Coordenadas:', coordinates.length);

    // Verify the feature is in the drawing source
    const featuresCount = this.drawingSource.getFeatures().length;
    const featureInSource = this.drawingSource.getFeatures().includes(feature);
    console.log('Features en drawingSource:', featuresCount, 'Feature incluido:', featureInSource);
    
    // If for some reason the feature is not in the source, add it
    if (!featureInSource) {
      console.log('Feature no estaba en source, añadiéndolo...');
      this.drawingSource.addFeature(feature);
    }

    // Emit polygon drawn event
    const event: PolygonDrawnEvent = {
      coordinates,
      area,
      perimeter,
      feature
    };
    
    this.polygonDrawn.next(event);
    
    // Disable drawing after polygon is completed but keep the polygon visible
    this.disableDrawing();
    
    console.log('Polígono completado y visible en mapa. Features después:', this.drawingSource.getFeatures().length);
  }

  // Clear polygon drawn event
  clearPolygonDrawnEvent(): void {
    this.polygonDrawn.next(null);
  }

  // Set polygon drawn event
  setPolygonDrawnEvent(event: PolygonDrawnEvent): void {
    this.polygonDrawn.next(event);
  }

  // Draw polygon from coordinates (for editing)
  drawPolygonFromCoordinates(coordinates: Coordinate[], recordId: string): Feature<Polygon> | null {
    console.log('drawPolygonFromCoordinates llamado para registro:', recordId);
    console.log('Coordenadas recibidas:', coordinates);
    
    if (!coordinates || coordinates.length < 3) {
      console.log('Coordenadas inválidas - menos de 3 puntos o null');
      return null;
    }

    // Log first coordinate to check format
    console.log('Primera coordenada:', coordinates[0], 'Tipo:', typeof coordinates[0]);

    // Transform coordinates from EPSG:4326 (lon/lat) to EPSG:3857 (map projection)
    const transformedCoords = coordinates.map(coord => {
      const lonLat = [coord[0], coord[1]];
      const transformed = fromLonLat(lonLat);
      console.log('Transformando:', lonLat, '→', transformed);
      return transformed;
    });
    
    // Create the polygon geometry with transformed coordinates
    const closedCoords = [...transformedCoords, transformedCoords[0]]; // Close the polygon
    const polygon = new Polygon([closedCoords]);
    
    // Create the feature
    const feature = new Feature(polygon);
    feature.setId(recordId);

    // Add to drawing source
    this.drawingSource.addFeature(feature);

    console.log('Polígono recreado en el mapa para edición con ID:', recordId);
    console.log('Extensión del polígono:', polygon.getExtent());
    
    return feature;
  }

  // Zoom to a specific feature
  zoomToFeature(feature: Feature<Polygon>): void {
    if (!this.map || !feature) return;

    const geometry = feature.getGeometry();
    if (!geometry) return;

    const extent = geometry.getExtent();
    this.map.getView().fit(extent, { 
      padding: [50, 50, 50, 50],
      duration: 1000 // Smooth zoom animation
    });
  }

  // Remove feature by ID
  removeFeatureById(featureId: string): void {
    const features = this.drawingSource.getFeatures();
    const featureToRemove = features.find(f => f.getId() === featureId);
    
    if (featureToRemove) {
      this.drawingSource.removeFeature(featureToRemove);
      console.log('Feature removida:', featureId);
    }
  }

  // Add temporary feature to drawing source (for viewing purposes)
  addTemporaryFeature(feature: Feature): void {
    this.drawingSource.addFeature(feature);
    console.log('Feature temporal añadida:', feature.getId());
  }

  // Remove temporary polygons (features without permanent IDs)
  removeTemporaryPolygons(): void {
    console.log('removeTemporaryPolygons called');
    const features = this.drawingSource.getFeatures();
    const currentEvent = this.polygonDrawn.value;
    
    console.log('Features antes de limpiar:', features.length, 'Evento actual:', currentEvent ? 'SÍ' : 'NO');
    
    features.forEach(feature => {
      const id = feature.getId();
      console.log('Evaluando feature con ID:', id);
      
      // Don't remove the currently active polygon that was just drawn
      if (currentEvent && currentEvent.feature === feature) {
        console.log('Preservando polígono recién dibujado con ID:', id);
        return; // Skip this feature, keep it visible
      }
      
      if (id && typeof id === 'string' && id.length > 10) {
        // This is likely a temporary ID (generated IDs are longer)
        const existingArea = this.areaPolygons.value.find(area => area.id === id);
        if (!existingArea) {
          console.log('Removiendo polígono temporal con ID:', id);
          this.drawingSource.removeFeature(feature);
        } else {
          console.log('Preservando polígono permanente con ID:', id);
        }
      }
    });
    
    console.log('Features después de limpiar:', this.drawingSource.getFeatures().length);
  }

  // Add area polygon
  addAreaPolygon(areaData: AreaDataModel, coordinates: Coordinate[]): AreaPolygon {
    // Convert coordinates to polygon feature
    const polygonCoords = [...coordinates, coordinates[0]]; // Close polygon
    const transformedCoords = polygonCoords.map(coord => fromLonLat([coord[0], coord[1]]));
    
    const polygon = new Polygon([transformedCoords]);
    const feature = new Feature(polygon);
    feature.setId(areaData.id.toString());

    // Add to drawing source
    this.drawingSource.addFeature(feature);

    // Calculate metrics
    const area = this.calculatePolygonArea(feature);
    const perimeter = this.calculatePolygonPerimeter(feature);

    // Create area polygon object
    const areaPolygon: AreaPolygon = {
      id: areaData.id.toString(),
      areaData,
      feature,
      coordinates,
      area,
      perimeter
    };

    // Add to list
    const currentAreas = this.areaPolygons.value;
    this.areaPolygons.next([...currentAreas, areaPolygon]);

    // Save to storage
    this.saveAreasToStorage();

    return areaPolygon;
  }

  // Update area polygon
  updateAreaPolygon(areaData: AreaDataModel): void {
    const areas = this.areaPolygons.value;
    const areaIndex = areas.findIndex(a => a.id === areaData.id.toString());
    
    if (areaIndex >= 0) {
      areas[areaIndex].areaData = areaData;
      this.areaPolygons.next([...areas]);
      this.saveAreasToStorage();
    }
  }

  // Remove area polygon
  removeAreaPolygon(areaId: string): void {
    // Remove from drawing source
    const feature = this.drawingSource.getFeatureById(areaId);
    if (feature) {
      this.drawingSource.removeFeature(feature);
    }

    // Remove from areas list
    const updatedAreas = this.areaPolygons.value.filter(a => a.id !== areaId);
    this.areaPolygons.next(updatedAreas);

    // Save to storage
    this.saveAreasToStorage();
  }

  // Get area polygons
  getAreaPolygons(): Observable<AreaPolygon[]> {
    return this.areaPolygons.asObservable();
  }

  // Zoom to area polygon
  zoomToArea(areaId: string): void {
    if (!this.map) return;

    const area = this.areaPolygons.value.find(a => a.id === areaId);
    if (area) {
      const extent = area.feature.getGeometry()?.getExtent();
      if (extent) {
        this.map.getView().fit(extent, { padding: [50, 50, 50, 50] });
      }
    }
  }

  // Calculate polygon area in square meters
  private calculatePolygonArea(feature: Feature<Polygon>): number {
    const polygon = feature.getGeometry();
    if (!polygon) return 0;
    return getArea(polygon);
  }

  // Calculate polygon perimeter in meters
  private calculatePolygonPerimeter(feature: Feature<Polygon>): number {
    const polygon = feature.getGeometry();
    if (!polygon) return 0;
    
    // Use the polygon's linear ring to get the perimeter
    const linearRing = polygon.getLinearRing(0);
    if (!linearRing) return 0;
    
    // Use getLength directly on the linear ring
    return getLength(linearRing);
  }

  // Get polygon coordinates in lon/lat
  private getPolygonCoordinates(feature: Feature<Polygon>): Coordinate[] {
    const polygon = feature.getGeometry();
    if (!polygon) return [];
    
    const coordinates = polygon.getLinearRing(0)?.getCoordinates() || [];
    return coordinates.slice(0, -1).map(coord => toLonLat(coord)); // Remove duplicate closing point
  }

  // Update area from feature (when modified)
  private updateAreaFromFeature(feature: Feature<Polygon>): void {
    const areaId = feature.getId()?.toString();
    if (!areaId) return;

    const areas = this.areaPolygons.value;
    const areaIndex = areas.findIndex(a => a.id === areaId);
    
    if (areaIndex >= 0) {
      const coordinates = this.getPolygonCoordinates(feature);
      const area = this.calculatePolygonArea(feature);
      const perimeter = this.calculatePolygonPerimeter(feature);

      areas[areaIndex] = {
        ...areas[areaIndex],
        coordinates,
        area,
        perimeter
      };

      this.areaPolygons.next([...areas]);
      this.saveAreasToStorage();
    }
  }

  // Load existing areas
  private loadExistingAreas(): void {
    const areas = this.areaPolygons.value;
    areas.forEach(area => {
      if (!this.drawingSource.getFeatureById(area.id)) {
        this.drawingSource.addFeature(area.feature);
      }
    });
  }

  // Save areas to storage
  private saveAreasToStorage(): void {
    const serializable = this.areaPolygons.value.map(area => ({
      id: area.id,
      areaData: area.areaData,
      coordinates: area.coordinates,
      area: area.area,
      perimeter: area.perimeter
    }));
    
    localStorage.setItem('area-polygons', JSON.stringify(serializable));
  }

  // Load areas from storage
  private loadAreasFromStorage(): void {
    const stored = localStorage.getItem('area-polygons');
    if (stored) {
      try {
        const serializable = JSON.parse(stored);
        const areas: AreaPolygon[] = serializable.map((item: any) => {
          // Reconstruct polygon feature
          const polygonCoords = [...item.coordinates, item.coordinates[0]]; // Close polygon
          const transformedCoords = polygonCoords.map((coord: number[]) => fromLonLat([coord[0], coord[1]]));
          
          const polygon = new Polygon([transformedCoords]);
          const feature = new Feature(polygon);
          feature.setId(item.id);

          return {
            id: item.id,
            areaData: item.areaData,
            feature,
            coordinates: item.coordinates,
            area: item.area,
            perimeter: item.perimeter
          };
        });
        
        this.areaPolygons.next(areas);
      } catch (error) {
        console.error('Error loading areas from storage:', error);
      }
    }
  }
}