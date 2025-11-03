import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WmsService as WmsServiceModel } from '../models/wmsService';
import { WmsLayer, WmsLayerCreate } from '../models/wmsLayer';

export interface WMSCapabilities {
  version: string;
  serviceTitle: string;
  serviceAbstract: string;
  serviceKeywords: string[];
  layers: WMSLayerInfo[]; // Solo capas hijas (para TAB "Servicios WMS")
  layersWithHierarchy?: WMSLayerInfo[]; // Padre + capas hijas (para TAB "Capas")
  getMapUrl: string;
  supportedFormats: string[];
  supportedCrs: string[];
}

export interface WMSLayerInfo {
  name: string;
  title: string;
  abstract?: string;
  keywords: string[];
  boundingBox?: {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
    crs: string;
  };
  supportedCrs: string[];
  styles: WMSStyle[];
  queryable: boolean;
  dimensions?: WMSDimension[];
}

export interface WMSStyle {
  name: string;
  title: string;
  abstract?: string;
  legendUrl?: string;
}

export interface WMSDimension {
  name: string;
  units: string;
  values: string;
  default?: string;
}

export interface WMSServiceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  capabilities?: WMSCapabilities;
}

@Injectable({
  providedIn: 'root'
})
export class WmsService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private apiUrl = environment.authApiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de servicios WMS disponibles para el usuario autenticado
   * Requiere autenticación (token inyectado automáticamente por interceptor)
   */
  getWmsServices(): Observable<WmsServiceModel[]> {
    return this.http.get<WmsServiceModel[]>(`${this.apiUrl}wms/services/`);
  }

  /**
   * Obtiene un servicio WMS específico por ID
   */
  getWmsServiceById(id: number): Observable<WmsServiceModel> {
    return this.http.get<WmsServiceModel>(`${this.apiUrl}wms/services/${id}/`);
  }

  /**
   * Crea un nuevo servicio WMS en el backend
   * @param serviceData Datos del servicio WMS a crear
   * @returns Observable con el servicio WMS creado
   */
  createWmsService(serviceData: { name: string; base_url: string; version: string }): Observable<WmsServiceModel> {
    console.log('📤 Enviando servicio WMS al backend:', serviceData);
    return this.http.post<WmsServiceModel>(`${this.apiUrl}wms/services/`, serviceData);
  }

  /**
   * Crea las capas de un servicio WMS en el backend
   * @param serviceId ID del servicio WMS
   * @param layers Array de capas a crear
   * @returns Observable con el array de capas creadas
   */
  createWmsLayers(serviceId: number, layers: WmsLayerCreate[]): Observable<WmsLayer[]> {
    console.log(`📤 Enviando ${layers.length} capas para el servicio ${serviceId}:`, layers);
    return this.http.post<WmsLayer[]>(`${this.apiUrl}wms/services/${serviceId}/layers/`, layers);
  }

  /**
   * Obtiene las capas de un servicio WMS desde el backend
   * @param serviceId ID del servicio WMS
   * @returns Observable con el array de capas del servicio
   */
  getWmsServiceLayers(serviceId: number): Observable<WmsLayer[]> {
    console.log(`📥 Obteniendo capas del servicio ${serviceId}...`);
    return this.http.get<WmsLayer[]>(`${this.apiUrl}wms/services/${serviceId}/layers/`);
  }

  /**
   * Actualiza la visibilidad de una capa WMS en el backend
   * @param layerId ID de la capa WMS
   * @param visible Estado de visibilidad (true/false)
   * @returns Observable con la capa WMS actualizada
   */
  updateLayerVisibility(layerId: number, visible: boolean): Observable<WmsLayer> {
    console.log(`🔄 Actualizando visibilidad de capa ${layerId} a: ${visible}`);
    return this.http.patch<WmsLayer>(`${this.apiUrl}wms/layers/${layerId}/`, {
      visible: visible
    });
  }

  /**
   * Elimina un servicio WMS del backend
   * @param serviceId ID del servicio WMS
   * @returns Observable vacío
   */
  deleteWmsService(serviceId: number): Observable<void> {
    console.log(`🗑️ Eliminando servicio WMS ${serviceId}...`);
    return this.http.delete<void>(`${this.apiUrl}wms/services/${serviceId}/`);
  }

  /**
   * Valida y obtiene las capabilities de un servicio WMS
   */
  validateAndGetCapabilities(baseUrl: string): Observable<WMSServiceValidation> {
    this.loadingSubject.next(true);

    const capabilitiesUrl = this.buildCapabilitiesUrl(baseUrl);
    console.log('🔍 Validando WMS desde URL:', capabilitiesUrl);

    return this.http.get(capabilitiesUrl, {
      responseType: 'text',
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      }
    }).pipe(
      timeout(15000), // 15 segundos de timeout
      retry(2), // Reintentar 2 veces en caso de error
      map(xmlText => {
        console.log('✅ Respuesta XML recibida, longitud:', xmlText.length);
        console.log('📄 Primeros 500 caracteres:', xmlText.substring(0, 500));
        return this.parseCapabilitiesXML(xmlText, baseUrl);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error HTTP al obtener capabilities:', error);
        this.loadingSubject.next(false);
        return this.handleGetCapabilitiesError(error, baseUrl);
      }),
      map(result => {
        console.log('📊 Resultado de validación:', result);
        this.loadingSubject.next(false);
        return result;
      })
    );
  }

  /**
   * Construye la URL para GetCapabilities con proxy CORS
   */
  private buildCapabilitiesUrl(baseUrl: string): string {
    try {
      const url = new URL(baseUrl);

      // Verificar si ya tiene los parámetros necesarios
      const hasService = url.searchParams.has('service') || url.searchParams.has('SERVICE');
      const hasRequest = url.searchParams.has('request') || url.searchParams.has('REQUEST');
      const hasVersion = url.searchParams.has('version') || url.searchParams.has('VERSION');

      let targetUrl: string;

      if (hasService && hasRequest && hasVersion) {
        console.log('✅ URL ya tiene los parámetros necesarios');
        targetUrl = url.toString();
      } else {
        // Eliminar todos los parámetros para reconstruir
        url.search = '';

        // Usar minúsculas que es el estándar WMS más compatible
        url.searchParams.set('service', 'WMS');
        url.searchParams.set('request', 'GetCapabilities');
        url.searchParams.set('version', '1.3.0');
        targetUrl = url.toString();
      }

      // Usar proxy CORS para evitar errores de CORS
      // Solo para URLs externas (no localhost o IPs locales)
      if (!targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1') && !targetUrl.includes('192.168.')) {
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        console.log('🔄 Usando proxy CORS:', proxiedUrl);
        return proxiedUrl;
      }

      console.log('🔧 URL construida:', targetUrl);
      return targetUrl;

    } catch (error) {
      // Si la URL no es válida, intenta con concatenación simple
      console.warn('⚠️ Error al parsear URL, usando concatenación simple:', error);
      const separator = baseUrl.includes('?') ? '&' : '?';
      let fallbackUrl = `${baseUrl}${separator}service=WMS&request=GetCapabilities&version=1.3.0`;

      // Aplicar proxy si es URL externa
      if (!fallbackUrl.includes('localhost') && !fallbackUrl.includes('127.0.0.1') && !fallbackUrl.includes('192.168.')) {
        fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(fallbackUrl)}`;
        console.log('🔄 Usando proxy CORS (fallback):', fallbackUrl);
      }

      return fallbackUrl;
    }
  }

  /**
   * Parsea el XML de GetCapabilities
   */
  private parseCapabilitiesXML(xmlText: string, baseUrl: string): WMSServiceValidation {
    const validation: WMSServiceValidation = {
      isValid: false,
      errors: [],
      warnings: []
    };

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Verificar si hay errores de parsing
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        validation.errors.push('El XML recibido no es válido');
        console.error('Error de parsing XML:', parseError.textContent);
        return validation;
      }

      // Verificar si es un documento WMS válido
      // Buscar el elemento raíz que podría ser WMS_Capabilities o WMT_MS_Capabilities
      const rootElement = xmlDoc.documentElement;
      const rootTagName = rootElement.tagName;

      if (rootTagName !== 'WMS_Capabilities' && rootTagName !== 'WMT_MS_Capabilities') {
        validation.errors.push(`El documento no parece ser un GetCapabilities válido de WMS. Elemento raíz: ${rootTagName}`);
        console.error('XML root element:', rootTagName);
        console.error('XML content preview:', xmlText.substring(0, 500));
        return validation;
      }

      // Extraer información del servicio
      const capabilities = this.extractServiceInfo(xmlDoc, baseUrl);
      
      if (capabilities.layers.length === 0) {
        validation.warnings.push('No se encontraron capas disponibles en este servicio');
      }

      validation.isValid = true;
      validation.capabilities = capabilities;

      return validation;

    } catch (error) {
      console.error('Error parsing WMS capabilities:', error);
      validation.errors.push(`Error al procesar la respuesta del servidor: ${error}`);
      return validation;
    }
  }

  /**
   * Extrae la información del servicio del XML
   */
  private extractServiceInfo(xmlDoc: Document, baseUrl: string): WMSCapabilities {
    const capabilities: WMSCapabilities = {
      version: '1.3.0',
      serviceTitle: 'Servicio WMS',
      serviceAbstract: '',
      serviceKeywords: [],
      layers: [],
      getMapUrl: baseUrl,
      supportedFormats: [],
      supportedCrs: []
    };

    try {
      // Información del servicio
      const service = xmlDoc.querySelector('Service');
      if (service) {
        capabilities.serviceTitle = this.getTextContent(service, 'Title') || capabilities.serviceTitle;
        capabilities.serviceAbstract = this.getTextContent(service, 'Abstract') || '';
        
        // Keywords
        const keywords = service.querySelectorAll('KeywordList Keyword');
        capabilities.serviceKeywords = Array.from(keywords).map(k => k.textContent || '').filter(k => k);
      }

      // Version
      const versionAttr = xmlDoc.querySelector('WMS_Capabilities, WMT_MS_Capabilities')?.getAttribute('version');
      if (versionAttr) {
        capabilities.version = versionAttr;
      }

      // GetMap URL
      const getMapUrl = xmlDoc.querySelector('Request GetMap DCPType HTTP Get OnlineResource')?.getAttribute('xlink:href') ||
                       xmlDoc.querySelector('Request GetMap DCPType HTTP Get OnlineResource')?.getAttribute('href');
      if (getMapUrl) {
        capabilities.getMapUrl = getMapUrl;
      }

      // Formatos soportados
      const formats = xmlDoc.querySelectorAll('Request GetMap Format');
      capabilities.supportedFormats = Array.from(formats).map(f => f.textContent || '').filter(f => f);

      // Layers (solo capas hijas para TAB "Servicios WMS")
      capabilities.layers = this.extractLayers(xmlDoc);
      
      // Layers con jerarquía (padre + hijas para TAB "Capas")
      capabilities.layersWithHierarchy = this.extractLayersWithHierarchy(xmlDoc);

      // CRS globales soportados
      const globalCrs = xmlDoc.querySelectorAll('Layer > CRS, Layer > SRS');
      capabilities.supportedCrs = Array.from(globalCrs).map(crs => crs.textContent || '').filter(crs => crs);

      return capabilities;

    } catch (error) {
      console.error('Error extracting service info:', error);
      return capabilities;
    }
  }

  /**
   * Extrae información de las capas (solo capas hijas para TAB "Servicios WMS")
   */
  private extractLayers(xmlDoc: Document): WMSLayerInfo[] {
    const layers: WMSLayerInfo[] = [];

    // Obtener el layer raíz (normalmente Capability > Layer)
    const rootLayer = xmlDoc.querySelector('Capability > Layer');
    if (!rootLayer) {
      console.warn('No se encontró el layer raíz en Capability');
      return layers;
    }

    // Extraer capas hijas recursivamente, solo las que tienen <Name>
    this.extractChildLayers(rootLayer, layers);

    console.log(`Total de capas procesadas (solo capas hijas): ${layers.length}`);
    return layers;
  }

  /**
   * Extrae recursivamente las capas hijas que tienen <Name> (capas renderizables)
   */
  private extractChildLayers(parentElement: Element, layers: WMSLayerInfo[]): void {
    // Buscar solo los <Layer> hijos directos (no anidados más profundos)
    const childLayers = Array.from(parentElement.children).filter(child => child.tagName === 'Layer');

    childLayers.forEach(layerNode => {
      // Buscar <Name> como hijo directo de este <Layer>
      const nameElement = Array.from(layerNode.children).find(child => child.tagName === 'Name');
      const name = nameElement?.textContent?.trim() || '';

      if (name) {
        // Es una capa renderizable (tiene <Name>)
        console.log('Procesando capa hija:', name, '- Título:', this.getDirectTextContent(layerNode, 'Title'));

        const layer: WMSLayerInfo = {
          name: name,
          title: this.getDirectTextContent(layerNode, 'Title') || name,
          abstract: this.getDirectTextContent(layerNode, 'Abstract'),
          keywords: this.extractKeywords(layerNode),
          supportedCrs: this.extractCrsRecursive(layerNode),
          styles: this.extractStyles(layerNode),
          queryable: layerNode.getAttribute('queryable') === '1',
          boundingBox: this.extractBoundingBox(layerNode)
        };

        // Dimensiones (tiempo, elevación, etc.)
        layer.dimensions = this.extractDimensions(layerNode);

        layers.push(layer);
      } else {
        // Es un contenedor (no tiene <Name>), buscar recursivamente en sus hijos
        console.log('Saltando layer padre (contenedor):', this.getDirectTextContent(layerNode, 'Title'));
        this.extractChildLayers(layerNode, layers);
      }
    });
  }

  /**
   * Extrae capas con jerarquía (layer padre + capas hijas para TAB "Capas")
   */
  extractLayersWithHierarchy(xmlDoc: Document): WMSLayerInfo[] {
    const layers: WMSLayerInfo[] = [];

    // Obtener el layer raíz (normalmente Capability > Layer)
    const rootLayer = xmlDoc.querySelector('Capability > Layer');
    if (!rootLayer) {
      console.warn('No se encontró el layer raíz en Capability');
      return layers;
    }

    // Extraer todas las capas recursivamente (padres e hijas)
    this.extractAllLayersRecursive(rootLayer, layers);

    console.log(`Total de capas con jerarquía (padre + hijas): ${layers.length}`);
    return layers;
  }

  /**
   * Extrae todas las capas recursivamente (tanto contenedores como capas renderizables)
   */
  private extractAllLayersRecursive(parentElement: Element, layers: WMSLayerInfo[]): void {
    // Buscar solo los <Layer> hijos directos
    const childLayers = Array.from(parentElement.children).filter(child => child.tagName === 'Layer');

    childLayers.forEach(layerNode => {
      // Buscar <Name> como hijo directo de este <Layer>
      const nameElement = Array.from(layerNode.children).find(child => child.tagName === 'Name');
      const name = nameElement?.textContent?.trim() || '';
      const title = this.getDirectTextContent(layerNode, 'Title');

      if (name) {
        // Es una capa renderizable (tiene <Name>)
        console.log('Procesando capa hija con jerarquía:', name, '- Título:', title);

        const layer: WMSLayerInfo = {
          name: name,
          title: title || name,
          abstract: this.getDirectTextContent(layerNode, 'Abstract'),
          keywords: this.extractKeywords(layerNode),
          supportedCrs: this.extractCrsRecursive(layerNode),
          styles: this.extractStyles(layerNode),
          queryable: layerNode.getAttribute('queryable') === '1',
          boundingBox: this.extractBoundingBox(layerNode)
        };

        // Dimensiones (tiempo, elevación, etc.)
        layer.dimensions = this.extractDimensions(layerNode);

        layers.push(layer);
      } else {
        // Es un contenedor (no tiene <Name>)
        console.log('Procesando layer padre (contenedor):', title);

        const parentLayer: WMSLayerInfo = {
          name: `parent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // ID único para layer padre
          title: title || 'Layer Padre',
          abstract: this.getDirectTextContent(layerNode, 'Abstract'),
          keywords: this.extractKeywords(layerNode),
          supportedCrs: this.extractCrsRecursive(layerNode),
          styles: [],
          queryable: false,
          boundingBox: this.extractBoundingBox(layerNode)
        };

        layers.push(parentLayer);

        // Continuar procesando los hijos
        this.extractAllLayersRecursive(layerNode, layers);
      }
    });
  }

  /**
   * Métodos auxiliares para extraer información específica
   */
  private getTextContent(parent: Element, tagName: string): string | undefined {
    const element = parent.querySelector(tagName);
    return element?.textContent || undefined;
  }

  /**
   * Obtiene el contenido de texto de un elemento hijo directo (no anidado)
   */
  private getDirectTextContent(parent: Element, tagName: string): string | undefined {
    const element = Array.from(parent.children).find(child => child.tagName === tagName);
    return element?.textContent?.trim() || undefined;
  }

  /**
   * Extrae los CRS de forma recursiva (herencia de padres)
   */
  private extractCrsRecursive(layerNode: Element): string[] {
    const crsSet = new Set<string>();

    // Buscar CRS/SRS en el nodo actual y todos sus ancestros
    let currentNode: Element | null = layerNode;
    while (currentNode && currentNode.tagName === 'Layer') {
      const crsElements = Array.from(currentNode.children).filter(
        child => child.tagName === 'CRS' || child.tagName === 'SRS'
      );

      crsElements.forEach(crs => {
        const crsValue = crs.textContent?.trim();
        if (crsValue) {
          crsSet.add(crsValue);
        }
      });

      currentNode = currentNode.parentElement;
    }

    return Array.from(crsSet);
  }

  private extractKeywords(layerNode: Element): string[] {
    const keywords = layerNode.querySelectorAll('KeywordList Keyword');
    return Array.from(keywords).map(k => k.textContent || '').filter(k => k);
  }

  private extractStyles(layerNode: Element): WMSStyle[] {
    const styles: WMSStyle[] = [];
    const styleNodes = layerNode.querySelectorAll('Style');
    
    styleNodes.forEach(styleNode => {
      const style: WMSStyle = {
        name: this.getTextContent(styleNode, 'Name') || 'default',
        title: this.getTextContent(styleNode, 'Title') || 'Default Style',
        abstract: this.getTextContent(styleNode, 'Abstract')
      };

      // URL de la leyenda
      const legendUrl = styleNode.querySelector('LegendURL OnlineResource')?.getAttribute('xlink:href') ||
                       styleNode.querySelector('LegendURL OnlineResource')?.getAttribute('href');
      if (legendUrl) {
        style.legendUrl = legendUrl;
      }

      styles.push(style);
    });

    return styles;
  }

  private extractBoundingBox(layerNode: Element): WMSLayerInfo['boundingBox'] {
    // Buscar BoundingBox o LatLonBoundingBox como hijos directos
    const bboxElements = Array.from(layerNode.children).filter(
      child => child.tagName === 'BoundingBox' || child.tagName === 'LatLonBoundingBox'
    );

    // Priorizar BoundingBox con CRS EPSG:4326 o el primero disponible
    let bbox = bboxElements.find(el =>
      el.getAttribute('CRS') === 'EPSG:4326' || el.getAttribute('SRS') === 'EPSG:4326'
    );

    if (!bbox && bboxElements.length > 0) {
      bbox = bboxElements[0];
    }

    // Si no hay BoundingBox, buscar EX_GeographicBoundingBox (WMS 1.3.0)
    if (!bbox) {
      const exGeoBBox = Array.from(layerNode.children).find(
        child => child.tagName === 'EX_GeographicBoundingBox'
      );

      if (exGeoBBox) {
        try {
          const westBoundLongitude = parseFloat(
            Array.from(exGeoBBox.children).find(c => c.tagName === 'westBoundLongitude')?.textContent || '0'
          );
          const eastBoundLongitude = parseFloat(
            Array.from(exGeoBBox.children).find(c => c.tagName === 'eastBoundLongitude')?.textContent || '0'
          );
          const southBoundLatitude = parseFloat(
            Array.from(exGeoBBox.children).find(c => c.tagName === 'southBoundLatitude')?.textContent || '0'
          );
          const northBoundLatitude = parseFloat(
            Array.from(exGeoBBox.children).find(c => c.tagName === 'northBoundLatitude')?.textContent || '0'
          );

          return {
            minx: westBoundLongitude,
            miny: southBoundLatitude,
            maxx: eastBoundLongitude,
            maxy: northBoundLatitude,
            crs: 'EPSG:4326'
          };
        } catch {
          return undefined;
        }
      }

      return undefined;
    }

    try {
      const minx = parseFloat(bbox.getAttribute('minx') || '0');
      const miny = parseFloat(bbox.getAttribute('miny') || '0');
      const maxx = parseFloat(bbox.getAttribute('maxx') || '0');
      const maxy = parseFloat(bbox.getAttribute('maxy') || '0');
      const crs = bbox.getAttribute('CRS') || bbox.getAttribute('SRS') || 'EPSG:4326';

      return { minx, miny, maxx, maxy, crs };
    } catch {
      return undefined;
    }
  }

  private extractDimensions(layerNode: Element): WMSDimension[] {
    const dimensions: WMSDimension[] = [];
    const dimensionNodes = layerNode.querySelectorAll('Dimension');

    dimensionNodes.forEach(dimNode => {
      const name = dimNode.getAttribute('name');
      if (name) {
        dimensions.push({
          name: name,
          units: dimNode.getAttribute('units') || '',
          values: dimNode.textContent || '',
          default: dimNode.getAttribute('default') || undefined
        });
      }
    });

    return dimensions;
  }

  /**
   * Maneja errores de GetCapabilities
   */
  private handleGetCapabilitiesError(error: HttpErrorResponse, baseUrl: string): Observable<WMSServiceValidation> {
    const validation: WMSServiceValidation = {
      isValid: false,
      errors: [],
      warnings: []
    };

    if (error.status === 0) {
      validation.errors.push('Error de CORS: No se puede acceder al servicio desde el navegador. Necesita configurar un proxy o que el servidor permita CORS.');
      validation.warnings.push('Para desarrollo, puede usar un proxy local o extensión de navegador para deshabilitar CORS.');
    } else if (error.status === 404) {
      validation.errors.push('Servicio no encontrado (404). Verifique la URL.');
    } else if (error.status >= 500) {
      validation.errors.push(`Error del servidor (${error.status}): ${error.message}`);
    } else {
      validation.errors.push(`Error HTTP ${error.status}: ${error.message}`);
    }

    // Generar datos simulados para desarrollo si hay error de CORS
    if (error.status === 0) {
      validation.warnings.push('Generando datos simulados para desarrollo...');
      validation.capabilities = this.generateMockCapabilities(baseUrl);
      validation.isValid = true;
    }

    return new Observable(observer => {
      observer.next(validation);
      observer.complete();
    });
  }

  /**
   * Genera capabilities simuladas para desarrollo
   */
  private generateMockCapabilities(baseUrl: string): WMSCapabilities {
    return {
      version: '1.3.0',
      serviceTitle: `Servicio WMS Simulado - ${new URL(baseUrl).hostname}`,
      serviceAbstract: 'Servicio WMS simulado para desarrollo local',
      serviceKeywords: ['desarrollo', 'simulado', 'WMS'],
      getMapUrl: baseUrl,
      supportedFormats: ['image/png', 'image/jpeg', 'image/gif'],
      supportedCrs: ['EPSG:4326', 'EPSG:3857', 'EPSG:4269'],
      layers: [
        {
          name: 'simulada_base',
          title: 'Capa Base Simulada',
          abstract: 'Capa base para desarrollo y pruebas',
          keywords: ['base', 'desarrollo'],
          supportedCrs: ['EPSG:4326', 'EPSG:3857'],
          styles: [
            {
              name: 'default',
              title: 'Estilo por defecto'
            }
          ],
          queryable: true,
          boundingBox: {
            minx: -180,
            miny: -90,
            maxx: 180,
            maxy: 90,
            crs: 'EPSG:4326'
          }
        },
        {
          name: 'simulada_overlay',
          title: 'Capa de Superposición Simulada',
          abstract: 'Capa de superposición para desarrollo',
          keywords: ['overlay', 'desarrollo'],
          supportedCrs: ['EPSG:4326', 'EPSG:3857'],
          styles: [
            {
              name: 'default',
              title: 'Estilo por defecto'
            }
          ],
          queryable: true
        }
      ]
    };
  }
}
