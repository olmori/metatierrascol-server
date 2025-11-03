import { Component, OnInit, OnDestroy, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { WMSServiceConfig } from '../sdi-server/sdi-server.component';
import { WMSLayerInfo, WmsService as WmsHttpService } from '../../services/wms.service';
import { WmsService as WmsServiceModel } from '../../models/wmsService';
import { WmsLayer, WmsLayerCreate } from '../../models/wmsLayer';
import { AuthService } from '../../services/auth.service';
import { SimpleAuthService } from '../../services/simple-auth.service';
import { Subscription } from 'rxjs';

export interface LayerStyle {
  opacity: number;
  visible: boolean;
  zIndex: number;
}

export interface ActiveLayer {
  id: string;
  serviceId: string;
  serviceName: string;
  layer: WMSLayerInfo;
  style: LayerStyle;
  active: boolean;
}

// Interfaz para capas enriquecidas con estado del backend
export interface EnrichedWMSLayer extends WMSLayerInfo {
  backendLayerId?: number; // ID de la capa en el backend
  backendVisible: boolean; // Estado visible del backend
  backendOpacity?: number; // Opacidad del backend
  backendZIndex?: number; // Z-index del backend
  serviceUrl?: string; // URL del servicio WMS (para construir GetMap)
  serviceId?: number; // ID del servicio en el backend
}

// Interfaz para servicios WMS del backend con capas enriquecidas
export interface BackendWMSService extends WmsServiceModel {
  enabled: boolean; // Switch del servicio
  layers?: EnrichedWMSLayer[]; // Capas enriquecidas con estado del backend
  isLoadingLayers?: boolean; // Estado de carga de capas
}

@Component({
  selector: 'app-wms-layer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatExpansionModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './wms-layer.component.html',
  styleUrl: './wms-layer.component.scss'
})
export class WmsLayerComponent implements OnInit, OnDestroy {
  @Output() layerToggled = new EventEmitter<ActiveLayer>();
  @Output() layerStyleChanged = new EventEmitter<ActiveLayer>();
  @Output() layersOrderChanged = new EventEmitter<ActiveLayer[]>();
  @Output() zoomToLayerRequested = new EventEmitter<ActiveLayer>();

  backendWmsServices: BackendWMSService[] = []; // Servicios del backend
  activeLayers: ActiveLayer[] = [];
  expandedPanels = new Set<string>();
  isLoadingBackendServices = false;

  private authUserSubscription?: Subscription;
  private simpleAuthUserSubscription?: Subscription;

  constructor(
    private dialog: MatDialog,
    private wmsHttpService: WmsHttpService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private simpleAuthService: SimpleAuthService
  ) {}

  ngOnInit() {
    this.loadActiveLayersFromStorage();

    // Escuchar cambios en el estado de autenticación (AuthService - Knox)
    this.authUserSubscription = this.authService.authUserSubject.subscribe({
      next: (authUser) => {
        // Si el usuario ya no está autenticado (cerró sesión), limpiar todas las capas
        if (!authUser.isLoggedIn) {
          console.log('🔒 Usuario cerró sesión (Knox), limpiando capas activas...');
          this.clearAllLayers();
        }
      }
    });

    // Escuchar cambios en el estado de autenticación simple (SimpleAuthService)
    this.simpleAuthUserSubscription = this.simpleAuthService.currentUser$.subscribe({
      next: (user) => {
        // Si el usuario es null (cerró sesión), limpiar todas las capas
        if (user === null) {
          console.log('🔒 Usuario cerró sesión (Simple), limpiando capas activas...');
          this.clearAllLayers();
        }
      }
    });
  }

  ngOnDestroy() {
    // Limpiar suscripciones al destruir el componente
    this.authUserSubscription?.unsubscribe();
    this.simpleAuthUserSubscription?.unsubscribe();
  }

  loadActiveLayersFromStorage() {
    const stored = localStorage.getItem('active-layers');
    if (stored) {
      this.activeLayers = JSON.parse(stored);
    }
  }

  saveActiveLayersToStorage() {
    localStorage.setItem('active-layers', JSON.stringify(this.activeLayers));
  }


  removeLayer(layerId: string) {
    const index = this.activeLayers.findIndex(l => l.id === layerId);
    if (index >= 0) {
      const removedLayer = this.activeLayers.splice(index, 1)[0];
      this.saveActiveLayersToStorage();
      this.layerToggled.emit(removedLayer);
    }
  }

  toggleLayerActive(layer: ActiveLayer) {
    layer.active = !layer.active;
    layer.style.visible = layer.active;
    this.saveActiveLayersToStorage();
    this.layerStyleChanged.emit(layer);
  }

  onOpacityChange(layer: ActiveLayer, opacity: number) {
    layer.style.opacity = opacity / 100;
    this.saveActiveLayersToStorage();
    this.layerStyleChanged.emit(layer);
  }

  moveLayerUp(index: number) {
    if (index > 0) {
      [this.activeLayers[index], this.activeLayers[index - 1]] = 
      [this.activeLayers[index - 1], this.activeLayers[index]];
      
      this.updateLayerOrder();
    }
  }

  moveLayerDown(index: number) {
    if (index < this.activeLayers.length - 1) {
      [this.activeLayers[index], this.activeLayers[index + 1]] = 
      [this.activeLayers[index + 1], this.activeLayers[index]];
      
      this.updateLayerOrder();
    }
  }

  private updateLayerOrder() {
    this.activeLayers.forEach((layer, index) => {
      layer.style.zIndex = index;
    });
    this.saveActiveLayersToStorage();
    this.layersOrderChanged.emit([...this.activeLayers]);
  }

  toggleExpansionPanel(serviceId: string) {
    if (this.expandedPanels.has(serviceId)) {
      this.expandedPanels.delete(serviceId);
    } else {
      this.expandedPanels.add(serviceId);
    }
  }

  isExpanded(serviceId: string): boolean {
    return this.expandedPanels.has(serviceId);
  }

  clearAllLayers() {
    this.activeLayers = [];
    this.saveActiveLayersToStorage();
    this.layersOrderChanged.emit([]);
  }

  /**
   * Actualiza los servicios WMS desde el backend
   */
  refreshServices() {
    console.log('🔄 Actualizando servicios WMS desde backend...');
    this.isLoadingBackendServices = true;

    this.wmsHttpService.getWmsServices().subscribe({
      next: (services) => {
        console.log(`✅ ${services.length} servicio(s) WMS obtenido(s) del backend:`, services);

        // Convertir servicios del backend a BackendWMSService
        this.backendWmsServices = services.map(service => ({
          ...service,
          enabled: false, // Por defecto deshabilitado
          layers: [],
          isLoadingLayers: false
        }));

        this.isLoadingBackendServices = false;

        this.snackBar.open(
          `${services.length} servicio(s) WMS cargado(s) del backend`,
          'Cerrar',
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('❌ Error al cargar servicios WMS:', error);
        this.isLoadingBackendServices = false;

        this.snackBar.open(
          'Error al cargar servicios WMS del servidor. Verifique su conexión.',
          'Cerrar',
          { duration: 4000 }
        );
      }
    });
  }

  getOpacityPercentage(opacity: number): number {
    return Math.round(opacity * 100);
  }

  /**
   * Habilita o deshabilita un servicio WMS del backend
   */
  toggleBackendWmsService(service: BackendWMSService) {
    service.enabled = !service.enabled;

    if (service.enabled) {
      console.log(`✅ Servicio habilitado: ${service.name}`);
      this.loadBackendServiceLayers(service);
    } else {
      console.log(`❌ Servicio deshabilitado: ${service.name}`);
      // Remover todas las capas activas de este servicio
      this.removeAllLayersFromService(service);
      service.layers = [];
    }
  }

  /**
   * Carga las capas de un servicio WMS combinando datos del backend y XML
   */
  private loadBackendServiceLayers(service: BackendWMSService) {
    service.isLoadingLayers = true;

    // 1. Obtener las capas guardadas en el backend para este servicio
    this.wmsHttpService.getWmsServiceLayers(service.id).subscribe({
      next: (backendLayers: WmsLayer[]) => {
        console.log(`📋 Capas del backend obtenidas (${backendLayers.length}):`, backendLayers);

        // 2. Obtener el XML de capabilities del servicio WMS
        this.wmsHttpService.validateAndGetCapabilities(service.base_url).subscribe({
          next: (validation) => {
            if (validation.isValid && validation.capabilities) {
              console.log(`📄 Capabilities XML obtenidos, capas disponibles: ${validation.capabilities.layers.length}`);

              // 3. Hacer match entre las capas del XML y las del backend
              // IMPORTANTE: Priorizar el objeto del XML que contiene toda la info para GetMap
              console.log('🔍 Iniciando match de capas...');
              console.log(`📊 Capas del backend (${backendLayers.length}):`, backendLayers.map(bl => bl.layer_name));
              console.log(`📊 Capas del XML (${validation.capabilities.layers.length}):`, validation.capabilities.layers.map(xl => xl.name));

              // Identificar capas del XML que NO están en el backend
              const missingLayers = validation.capabilities.layers.filter(xmlLayer => {
                const exists = backendLayers.some((bl: WmsLayer) => bl.layer_name === xmlLayer.name);
                if (!exists) {
                  console.warn(`⚠️ Capa "${xmlLayer.name}" no encontrada en backend, será creada`);
                }
                return !exists;
              });

              // Si hay capas faltantes, crearlas en el backend primero
              if (missingLayers.length > 0) {
                console.log(`🆕 Creando ${missingLayers.length} capa(s) faltante(s) en el backend...`);
                this.createMissingLayers(service, missingLayers, backendLayers);
              } else {
                // No hay capas faltantes, proceder con el enriquecimiento
                this.enrichAndDisplayLayers(service, validation.capabilities.layers, backendLayers);
              }
            } else {
              service.isLoadingLayers = false;
              console.error('❌ Error al validar capabilities:', validation.errors);
              this.snackBar.open(
                `Error al obtener capabilities: ${validation.errors.join(', ')}`,
                'Cerrar',
                { duration: 3000 }
              );
            }
          },
          error: (error) => {
            service.isLoadingLayers = false;
            console.error('❌ Error al obtener capabilities del XML:', error);
            this.snackBar.open(
              'Error al conectar con el servicio WMS',
              'Cerrar',
              { duration: 3000 }
            );
          }
        });
      },
      error: (error: any) => {
        service.isLoadingLayers = false;
        console.error('❌ Error al obtener capas del backend:', error);
        this.snackBar.open(
          'Error al cargar capas del backend',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Crea capas faltantes en el backend
   */
  private createMissingLayers(
    service: BackendWMSService,
    missingLayers: WMSLayerInfo[],
    existingBackendLayers: WmsLayer[]
  ) {
    // Construir array de capas para crear
    const layersToCreate = missingLayers.map(xmlLayer => ({
      layer_name: xmlLayer.name,
      layer_title: xmlLayer.title || xmlLayer.name,
      visible: false, // Por defecto invisible
      opacity: 1.0,
      z_index: 0,
      style: xmlLayer.styles[0]?.name || 'default',
      extra: {
        abstract: xmlLayer.abstract,
        keywords: xmlLayer.keywords,
        supportedCrs: xmlLayer.supportedCrs,
        queryable: xmlLayer.queryable,
        boundingBox: xmlLayer.boundingBox
      }
    }));

    // Llamar al API para crear las capas
    this.wmsHttpService.createWmsLayers(service.id, layersToCreate).subscribe({
      next: (createdLayers) => {
        console.log(`✅ ${createdLayers.length} capa(s) creada(s) en el backend:`, createdLayers);

        // Combinar capas existentes con las recién creadas
        const allBackendLayers = [...existingBackendLayers, ...createdLayers];

        // Ahora sí, obtener el XML completo nuevamente para enriquecer
        this.wmsHttpService.validateAndGetCapabilities(service.base_url).subscribe({
          next: (validation) => {
            if (validation.isValid && validation.capabilities) {
              this.enrichAndDisplayLayers(service, validation.capabilities.layers, allBackendLayers);
            }
          }
        });
      },
      error: (error) => {
        service.isLoadingLayers = false;
        console.error('❌ Error al crear capas en el backend:', error);
        this.snackBar.open(
          'Error al registrar las capas en el servidor',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Enriquece las capas del XML con datos del backend y las muestra
   */
  private enrichAndDisplayLayers(
    service: BackendWMSService,
    xmlLayers: WMSLayerInfo[],
    backendLayers: WmsLayer[]
  ) {
    const enrichedLayers: EnrichedWMSLayer[] = xmlLayers.map(xmlLayer => {
      // Buscar la capa correspondiente en el backend
      const backendLayer = backendLayers.find((bl: WmsLayer) => bl.layer_name === xmlLayer.name);

      if (backendLayer) {
        console.log(`✅ Match encontrado: "${xmlLayer.name}" → ID ${backendLayer.id}`);
      } else {
        console.warn(`⚠️ No match para capa XML: "${xmlLayer.name}"`);
      }

      // Crear objeto enriquecido: XML + propiedades del backend
      const enrichedLayer: EnrichedWMSLayer = {
        ...xmlLayer, // PRIORIDAD: Todas las propiedades del XML (name, title, boundingBox, CRS, styles, etc.)
        // Agregar propiedades del backend
        backendLayerId: backendLayer?.id,
        backendVisible: backendLayer?.visible ?? false,
        backendOpacity: backendLayer?.opacity ?? 1.0,
        backendZIndex: backendLayer?.z_index ?? 0,
        // Agregar info del servicio para construir URLs
        serviceUrl: service.base_url,
        serviceId: service.id
      };

      return enrichedLayer;
    });

    service.layers = enrichedLayers;
    service.isLoadingLayers = false;

    console.log(`✅ ${enrichedLayers.length} capa(s) enriquecidas para "${service.name}"`);
    console.log('📋 Ejemplo de capa enriquecida (primera):', enrichedLayers[0]);

    // Agregar al mapa las capas que tienen visible: true
    enrichedLayers.forEach(layer => {
      if (layer.backendVisible) {
        this.addBackendLayerToMap(service, layer);
      }
    });

    this.snackBar.open(
      `${enrichedLayers.length} capa(s) cargadas para "${service.name}"`,
      'Cerrar',
      { duration: 2000 }
    );
  }

  /**
   * Toggle de visibilidad de una capa del backend
   * Actualiza el estado en el backend y en el mapa
   */
  toggleBackendLayerVisibility(service: BackendWMSService, layer: EnrichedWMSLayer) {
    // Verificar que la capa tenga ID del backend
    if (!layer.backendLayerId) {
      console.warn('⚠️ La capa no tiene ID del backend, no se puede actualizar');
      this.snackBar.open(
        'Error: La capa no está registrada en el backend',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const newVisibleState = !layer.backendVisible;
    console.log(`🔄 Toggle capa "${layer.name}": ${layer.backendVisible} → ${newVisibleState}`);

    // Actualizar el estado en el backend
    this.wmsHttpService.updateLayerVisibility(layer.backendLayerId, newVisibleState).subscribe({
      next: (updatedLayer) => {
        console.log('✅ Visibilidad actualizada en el backend:', updatedLayer);

        // Actualizar el estado local con la respuesta del backend
        layer.backendVisible = updatedLayer.visible;
        layer.backendOpacity = updatedLayer.opacity ?? 1.0;
        layer.backendZIndex = updatedLayer.z_index ?? 0;

        // Actualizar el mapa según el nuevo estado
        if (layer.backendVisible) {
          this.addBackendLayerToMap(service, layer);
          this.snackBar.open(
            `Capa "${layer.title || layer.name}" visible en el mapa`,
            'Cerrar',
            { duration: 2000 }
          );
        } else {
          this.removeBackendLayerFromMap(service, layer);
          this.snackBar.open(
            `Capa "${layer.title || layer.name}" oculta del mapa`,
            'Cerrar',
            { duration: 2000 }
          );
        }
      },
      error: (error) => {
        console.error('❌ Error al actualizar visibilidad en el backend:', error);

        // Revertir el cambio en la UI si falla
        this.snackBar.open(
          'Error al actualizar la visibilidad en el servidor',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Agrega una capa del backend al mapa
   */
  private addBackendLayerToMap(service: BackendWMSService, layer: EnrichedWMSLayer) {
    const layerId = `backend-${service.id}-${layer.name}`;

    // Verificar si ya existe
    if (this.activeLayers.some(l => l.id === layerId)) {
      console.log('⚠️ La capa ya está activa en el mapa');
      return;
    }

    // IMPORTANTE: serviceId debe ser la URL del servicio WMS, no un ID numérico
    // El componente de mapa usa serviceId para construir las peticiones GetMap
    const activeLayer: ActiveLayer = {
      id: layerId,
      serviceId: service.base_url, // ✅ URL del servicio WMS
      serviceName: service.name,
      layer: layer,
      style: {
        opacity: layer.backendOpacity ?? 1.0,
        visible: true,
        zIndex: layer.backendZIndex ?? this.activeLayers.length
      },
      active: true
    };

    console.log(`✅ Capa agregada al mapa: "${layer.title || layer.name}"`);
    console.log('🌐 Service URL:', service.base_url);
    console.log('📦 ActiveLayer completo:', activeLayer);

    this.activeLayers.push(activeLayer);
    this.saveActiveLayersToStorage();
    this.layerToggled.emit(activeLayer);
  }

  /**
   * Remueve una capa del backend del mapa
   */
  private removeBackendLayerFromMap(service: BackendWMSService, layer: EnrichedWMSLayer) {
    const layerId = `backend-${service.id}-${layer.name}`;
    const index = this.activeLayers.findIndex(l => l.id === layerId);

    if (index >= 0) {
      const removedLayer = this.activeLayers.splice(index, 1)[0];
      this.saveActiveLayersToStorage();
      this.layerToggled.emit(removedLayer);

      console.log(`❌ Capa removida del mapa: "${layer.title || layer.name}"`);
    }
  }

  /**
   * Remueve todas las capas activas de un servicio WMS
   */
  private removeAllLayersFromService(service: BackendWMSService) {
    // Filtrar por URL del servicio (serviceId ahora contiene la URL)
    const layersToRemove = this.activeLayers.filter(l => l.serviceId === service.base_url);

    console.log(`🗑️ Removiendo ${layersToRemove.length} capa(s) del servicio "${service.name}"`);

    layersToRemove.forEach(layer => {
      const index = this.activeLayers.findIndex(l => l.id === layer.id);
      if (index >= 0) {
        const removedLayer = this.activeLayers.splice(index, 1)[0];
        this.layerToggled.emit(removedLayer);
      }
    });

    this.saveActiveLayersToStorage();
    console.log(`✅ Todas las capas del servicio "${service.name}" fueron removidas del mapa`);
  }

  getChildLayersCount(service: any): number {
    if (!service.layersWithHierarchy) return 0;
    
    // Filtrar capas hijas (que NO empiezan con 'parent_' y que tienen name válido)
    const childLayers = service.layersWithHierarchy.filter((layer: any) => {
      // Excluir capas padre (que empiezan con 'parent_' o no tienen name válido)
      return layer.name && 
             !layer.name.startsWith('parent_') && 
             layer.name.trim() !== '' &&
             !layer.title?.toLowerCase().includes('padre') &&
             !layer.title?.toLowerCase().includes('parent') &&
             !layer.title?.toLowerCase().includes('root');
    });
    
    return childLayers.length;
  }

  private generateLayerId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Zoom to layer extent
  zoomToLayer(activeLayer: ActiveLayer) {
    this.zoomToLayerRequested.emit(activeLayer);
  }

  // Show layer information dialog
  showLayerInfo(activeLayer: ActiveLayer) {
    this.dialog.open(LayerInfoDialog, {
      data: {
        layer: activeLayer.layer,
        serviceName: activeLayer.serviceName
      },
      width: '600px',
      maxHeight: '80vh'
    });
  }

  // Show layer legend (open in new window)
  showLayerLegend(activeLayer: ActiveLayer) {
    // La información de leyenda está directamente en la capa
    if (activeLayer.layer.styles && activeLayer.layer.styles.length > 0) {
      const legendUrl = activeLayer.layer.styles[0].legendUrl;
      if (legendUrl) {
        window.open(legendUrl, '_blank', 'width=600,height=800');
      } else {
        this.snackBar.open('Esta capa no tiene una leyenda disponible', 'Cerrar', { duration: 3000 });
      }
    } else {
      this.snackBar.open('No se encontró información de leyenda para esta capa', 'Cerrar', { duration: 3000 });
    }
  }
}

// Layer Info Dialog Component
@Component({
  selector: 'layer-info-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>info</mat-icon>
      Información de la Capa
    </h2>
    <mat-dialog-content>
      <div class="layer-info-content">
        <div class="info-section">
          <h3>Título</h3>
          <p>{{ data.layer.title || data.layer.name }}</p>
        </div>

        <div class="info-section" *ngIf="data.layer.name !== data.layer.title">
          <h3>Nombre</h3>
          <p><code>{{ data.layer.name }}</code></p>
        </div>

        <div class="info-section" *ngIf="data.serviceName">
          <h3>Servicio</h3>
          <p>{{ data.serviceName }}</p>
        </div>

        <div class="info-section" *ngIf="data.layer.abstract">
          <h3>Resumen</h3>
          <p>{{ data.layer.abstract }}</p>
        </div>

        <div class="info-section" *ngIf="data.layer.keywords && data.layer.keywords.length > 0">
          <h3>Palabras Clave</h3>
          <p>{{ data.layer.keywords.join(', ') }}</p>
        </div>

        <div class="info-section" *ngIf="data.layer.supportedCrs && data.layer.supportedCrs.length > 0">
          <h3>Sistemas de Coordenadas Soportados</h3>
          <ul>
            <li *ngFor="let crs of data.layer.supportedCrs">{{ crs }}</li>
          </ul>
        </div>

        <div class="info-section" *ngIf="data.layer.boundingBox">
          <h3>Extensión Geográfica</h3>
          <p>
            <strong>Min X:</strong> {{ data.layer.boundingBox.minx }}<br>
            <strong>Min Y:</strong> {{ data.layer.boundingBox.miny }}<br>
            <strong>Max X:</strong> {{ data.layer.boundingBox.maxx }}<br>
            <strong>Max Y:</strong> {{ data.layer.boundingBox.maxy }}<br>
            <strong>CRS:</strong> {{ data.layer.boundingBox.crs }}
          </p>
        </div>

        <div class="info-section" *ngIf="data.layer.queryable">
          <h3>Consultable</h3>
          <p><mat-icon class="check-icon">check_circle</mat-icon> Esta capa es consultable</p>
        </div>

        <div class="info-section" *ngIf="data.layer.styles && data.layer.styles.length > 0">
          <h3>Estilos Disponibles</h3>
          <ul>
            <li *ngFor="let style of data.layer.styles">
              <strong>{{ style.title || style.name }}</strong>
              <span *ngIf="style.abstract"> - {{ style.abstract }}</span>
            </li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .layer-info-content {
      padding: 16px 0;
    }

    .info-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-section:last-child {
      border-bottom: none;
    }

    .info-section h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
    }

    .info-section p {
      margin: 0;
      line-height: 1.6;
    }

    .info-section code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }

    .info-section ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .info-section li {
      margin-bottom: 4px;
    }

    .check-icon {
      color: #4caf50;
      vertical-align: middle;
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class LayerInfoDialog {
  constructor(
    public dialogRef: MatDialogRef<LayerInfoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { layer: WMSLayerInfo; serviceName: string }
  ) {}
}
