import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { AreaDatagridComponent } from '../register-area/area-datagrid/area-datagrid.component';
import { AreaFormComponent } from '../register-area/area-form/area-form.component';
import { SdiServerComponent, WMSServiceConfig } from '../sdi-server/sdi-server.component';
import { WmsLayerComponent, ActiveLayer } from '../wms-layer/wms-layer.component';
import { MapViewerService, GeoJSONUpload, AreaPolygon, DrawingMode, PolygonDrawnEvent, BaseMapId } from '../../services/map-viewer.service';
import { AreaDataModel } from '../../models/areaDataModel';
import { AreaDataService } from '../../services/area-data.service';
import { WmsService } from '../../services/wms.service';
import { WmsService as WmsServiceModel } from '../../models/wmsService';
import { SimpleAuthService } from '../../services/simple-auth.service';
import { Subscription } from 'rxjs';
import { Coordinate } from 'ol/coordinate';
import { MatMenuModule } from '@angular/material/menu';


@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatExpansionModule,
    MatDividerModule,
    MatTableModule,
    HeaderComponent, 
    FooterComponent,
    AreaFormComponent,
    AreaDatagridComponent,
    SdiServerComponent,
    WmsLayerComponent,
    MatMenuModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  // Map state
  isMapLoading = true;
  isMapReady = false;
  
  // GeoJSON uploads
  isDragOver = false;
  geoJSONUploads: GeoJSONUpload[] = [];
  
  // Area registration
  areaRegistrationForm: FormGroup;
  editingAreaId: string | null = null;
  
  // Polygon drawing state
  isDrawingActive = false;
  hasPolygonDrawn = false;
  polygonInfo: { area: number; perimeter: number; coordinates: Coordinate[] } | null = null;
  generatedGeoJSON = '';
  
  // Records management
  registeredAreas: any[] = [];
  displayedColumns: string[] = ['nombres', 'apellidos', 'tipoDocumento', 'numeroDocumento', 'direccion', 'area', 'actions'];
  
  // Legacy area management (keeping for compatibility)
  areaPolygons: AreaPolygon[] = [];
  drawingMode: DrawingMode = 'none';

  // WMS Services
  wmsServices: WmsServiceModel[] = [];
  isLoadingWmsServices = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private mapViewerService: MapViewerService,
    private areaDataService: AreaDataService,
    private wmsService: WmsService,
    private simpleAuthService: SimpleAuthService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.areaRegistrationForm = this.formBuilder.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    // Subscribe to GeoJSON uploads
    const geoJSONSub = this.mapViewerService.getGeoJSONUploads().subscribe(
      uploads => this.geoJSONUploads = uploads
    );
    this.subscriptions.push(geoJSONSub);

    // Subscribe to area polygons (legacy)
    const areasSub = this.mapViewerService.getAreaPolygons().subscribe(
      areas => this.areaPolygons = areas
    );
    this.subscriptions.push(areasSub);

    // Subscribe to drawing mode changes
    const drawingModeSub = this.mapViewerService.getDrawingMode().subscribe(
      mode => {
        this.drawingMode = mode;
        this.isDrawingActive = mode === 'polygon';
      }
    );
    this.subscriptions.push(drawingModeSub);

    // Subscribe to polygon drawn events
    const polygonDrawnSub = this.mapViewerService.getPolygonDrawnEvent().subscribe(
      event => this.onPolygonCompleted(event)
    );
    this.subscriptions.push(polygonDrawnSub);

    // Load existing registered areas
    this.loadRegisteredAreas();

    // Load WMS services from backend
    this.loadWmsServices();
  }

  /**
   * Carga la lista de servicios WMS disponibles para el usuario
   */
  loadWmsServices(): void {
    console.log('🗺️ Iniciando carga de servicios WMS...');

    // Verificar si el usuario está autenticado
    const currentUser = this.simpleAuthService.getCurrentUser();
    console.log('👤 Usuario actual:', currentUser);

    if (!currentUser) {
      console.warn('⚠️ Usuario no autenticado, no se cargarán servicios WMS');
      this.snackBar.open(
        'Debe iniciar sesión para ver los servicios WMS',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    console.log('✅ Usuario autenticado, procediendo a cargar servicios...');
    this.isLoadingWmsServices = true;

    const wmsSub = this.wmsService.getWmsServices().subscribe({
      next: (services) => {
        this.wmsServices = services;
        this.isLoadingWmsServices = false;
        console.log('✅ Servicios WMS cargados:', services);

        if (services.length > 0) {
          this.snackBar.open(
            `${services.length} servicio(s) WMS cargado(s) correctamente`,
            'Cerrar',
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        this.isLoadingWmsServices = false;
        console.error('❌ Error al cargar servicios WMS:', error);
        console.error('❌ Detalle del error:', error.error);
        console.error('❌ Status:', error.status);

        let errorMessage = 'Error al cargar servicios WMS.';

        if (error.status === 401 || error.status === 403) {
          errorMessage = 'No está autenticado. Por favor inicie sesión.';
        } else if (error.error?.detail) {
          errorMessage = `Error: ${error.error.detail}`;
        }

        this.snackBar.open(
          errorMessage,
          'Cerrar',
          { duration: 5000 }
        );
      }
    });

    this.subscriptions.push(wmsSub);
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeMap() {
    try {
      this.mapViewerService.initializeMap(this.mapContainer.nativeElement);
      this.isMapLoading = false;
      this.isMapReady = true;
      this.showSnackBar('Mapa inicializado correctamente');
    } catch (error) {
      console.error('Error initializing map:', error);
      this.showSnackBar('Error al inicializar el mapa');
      this.isMapLoading = false;
      this.isMapReady = false;
    }
  }

  /**
   * Recarga la lista de servicios WMS del backend cuando se guarda uno nuevo
   */
  onBackendServiceSaved(): void {
    console.log('🔄 Recargando servicios del backend...');
    this.loadWmsServices();
  }

  // WMS Layer events
  onLayerToggled(activeLayer: ActiveLayer) {
    console.log('🔔 onLayerToggled llamado:', activeLayer);
    console.log('📍 Layer ID:', activeLayer.id);
    console.log('🗺️ ¿Está en el mapa?', this.isLayerInMap(activeLayer.id));

    if (this.isLayerInMap(activeLayer.id)) {
      this.mapViewerService.removeWMSLayer(activeLayer.id);
      this.showSnackBar(`Capa "${activeLayer.layer.title || activeLayer.layer.name}" removida`);
    } else {
      // Get the service URL for the WMS layer
      // Si serviceId ya es una URL (servicios del backend), usarla directamente
      let serviceUrl: string | null = null;

      if (activeLayer.serviceId.startsWith('http://') || activeLayer.serviceId.startsWith('https://')) {
        // serviceId ya es una URL (capas del backend)
        serviceUrl = activeLayer.serviceId;
        console.log('🌐 Service URL (directo):', serviceUrl);
      } else {
        // serviceId es un ID, buscar en localStorage (capas locales)
        serviceUrl = this.getServiceUrl(activeLayer.serviceId);
        console.log('🌐 Service URL (localStorage):', serviceUrl);
      }

      console.log('🆔 Service ID:', activeLayer.serviceId);

      if (serviceUrl) {
        const layerWithUrl = { ...activeLayer, serviceId: serviceUrl };
        console.log('📦 Capa con URL preparada:', layerWithUrl);
        this.mapViewerService.addWMSLayer(layerWithUrl);

        // Hacer zoom automático a la capa si tiene bounding box
        if (activeLayer.layer.boundingBox) {
          console.log('🎯 Haciendo zoom automático a la capa...');
          setTimeout(() => {
            this.mapViewerService.zoomToWMSLayer(activeLayer);
          }, 500); // Pequeño delay para asegurar que la capa se haya agregado
        }

        this.showSnackBar(`Capa "${activeLayer.layer.title || activeLayer.layer.name}" agregada`);
      } else {
        console.error('❌ No se pudo encontrar la URL del servicio');
        this.showSnackBar('Error: No se pudo encontrar la URL del servicio');
      }
    }
  }

  onLayerStyleChanged(activeLayer: ActiveLayer) {
    this.mapViewerService.updateWMSLayer(activeLayer);
  }

  onLayersOrderChanged(activeLayers: ActiveLayer[]) {
    if (activeLayers.length === 0) {
      // Clear all WMS layers from map
      this.mapViewerService.clearAllWMSLayers();
      this.showSnackBar('Todas las capas WMS han sido removidas');
    } else {
      this.mapViewerService.updateLayersOrder(activeLayers);
    }
  }

  onZoomToLayerRequested(activeLayer: ActiveLayer) {
    this.mapViewerService.zoomToWMSLayer(activeLayer);
    this.showSnackBar(`Haciendo zoom a "${activeLayer.layer.title || activeLayer.layer.name}"`);
  }

  // GeoJSON file handling
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
    // Clear input for re-selection
    input.value = '';
  }

  private async processFiles(files: File[]) {
    const validFiles = files.filter(file => 
      file.type === 'application/json' || 
      file.name.endsWith('.geojson') || 
      file.name.endsWith('.json')
    );

    if (validFiles.length === 0) {
      this.showSnackBar('Por favor selecciona archivos GeoJSON válidos');
      return;
    }

    for (const file of validFiles) {
      try {
        const upload = await this.mapViewerService.uploadGeoJSON(file);
        this.mapViewerService.addGeoJSONLayer(upload);
        this.showSnackBar(`Archivo "${file.name}" cargado exitosamente`);
      } catch (error) {
        console.error('Error uploading GeoJSON:', error);
        this.showSnackBar(`Error cargando "${file.name}": ${error}`);
      }
    }
  }

  // GeoJSON layer management
  isGeoJSONVisible(uploadId: string): boolean {
    // Simplified check - track visibility state
    const visibleLayers = this.getVisibleGeoJSONLayers();
    return visibleLayers.includes(uploadId);
  }

  private getVisibleGeoJSONLayers(): string[] {
    const stored = localStorage.getItem('visible-geojson-layers');
    return stored ? JSON.parse(stored) : [];
  }

  private updateVisibleGeoJSONLayers(layers: string[]) {
    localStorage.setItem('visible-geojson-layers', JSON.stringify(layers));
  }

  toggleGeoJSONVisibility(upload: GeoJSONUpload) {
    const visibleLayers = this.getVisibleGeoJSONLayers();
    
    if (this.isGeoJSONVisible(upload.id)) {
      this.mapViewerService.removeGeoJSONLayer(upload.id);
      const updatedLayers = visibleLayers.filter(id => id !== upload.id);
      this.updateVisibleGeoJSONLayers(updatedLayers);
      this.showSnackBar(`Capa "${upload.name}" ocultada`);
    } else {
      this.mapViewerService.addGeoJSONLayer(upload);
      this.updateVisibleGeoJSONLayers([...visibleLayers, upload.id]);
      this.showSnackBar(`Capa "${upload.name}" mostrada`);
    }
  }

  // View GeoJSON polygons on map temporarily
  viewGeoJSON(upload: GeoJSONUpload) {
    if (upload.features.length > 0) {
      // Clear any existing temporary polygons first
      this.mapViewerService.removeTemporaryPolygons();
      
      // Add GeoJSON features temporarily to the drawing source for viewing
      upload.features.forEach((feature, index) => {
        const clonedFeature = feature.clone();
        clonedFeature.setId(`geojson_view_${upload.id}_${index}`);
        this.mapViewerService.addTemporaryFeature(clonedFeature);
      });
      
      // Zoom to the GeoJSON extent
      this.mapViewerService.zoomToGeoJSON(upload);
      
      this.showSnackBar(`Visualizando "${upload.name}" - Se auto-eliminará en 8 segundos`);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        upload.features.forEach((_, index) => {
          this.mapViewerService.removeFeatureById(`geojson_view_${upload.id}_${index}`);
        });
      }, 8000);
    }
  }

  removeGeoJSON(uploadId: string) {
    const upload = this.geoJSONUploads.find(u => u.id === uploadId);
    if (upload) {
      const confirmDelete = confirm(`¿Está seguro de que desea eliminar el archivo "${upload.name}"?`);
      if (confirmDelete) {
        this.mapViewerService.removeGeoJSONLayer(uploadId);
        // Remove from visible layers tracking
        const visibleLayers = this.getVisibleGeoJSONLayers();
        const updatedLayers = visibleLayers.filter(id => id !== uploadId);
        this.updateVisibleGeoJSONLayers(updatedLayers);
        this.showSnackBar(`Archivo "${upload.name}" eliminado`);
      }
    }
  }

  // Map controls
  resetMapView() {
    this.mapViewerService.resetView();
    this.showSnackBar('Vista restaurada');
  }

  toggleFullscreen() {
    const mapElement = this.mapContainer.nativeElement.parentElement;
    if (!document.fullscreenElement) {
      mapElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  zoomIn() {
  this.mapViewerService.zoomIn();
}

zoomOut() {
  this.mapViewerService.zoomOut();
}



// MapComponent
baseMapMenuOpen = false;

toggleBaseMapMenu() {
  this.baseMapMenuOpen = !this.baseMapMenuOpen;
}

setBaseMap(id: BaseMapId) {
  this.mapViewerService.setBaseMap(id);
  this.baseMapMenuOpen = false;  // cerrar menú al elegir
}




  // Helper methods
  private isLayerInMap(layerId: string): boolean {
    return this.mapViewerService.isLayerInMap(layerId);
  }

  private getServiceUrl(serviceId: string): string | null {
    // Get service URL from localStorage
    const stored = localStorage.getItem('wms-services');
    if (stored) {
      const services = JSON.parse(stored) as WMSServiceConfig[];
      const service = services.find(s => s.id === serviceId);

      if (service?.url) {
        // Remove GetCapabilities parameters from URL to get base WMS URL
        let baseUrl = service.url;

        // Remove query parameters related to GetCapabilities
        try {
          const urlObj = new URL(baseUrl);

          // Delete both uppercase and lowercase versions
          const paramsToDelete = ['SERVICE', 'service', 'REQUEST', 'request', 'VERSION', 'version'];
          paramsToDelete.forEach(param => urlObj.searchParams.delete(param));

          // If no params left, just return the base URL without query string
          const cleanUrl = urlObj.searchParams.toString()
            ? urlObj.origin + urlObj.pathname + '?' + urlObj.searchParams.toString()
            : urlObj.origin + urlObj.pathname;

          console.log('🧹 URL base limpia:', cleanUrl);
          return cleanUrl;
        } catch (error) {
          console.error('Error al limpiar URL:', error);
          return baseUrl;
        }
      }

      return null;
    }
    return null;
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // ==== NEW AREA REGISTRATION METHODS ====

  // Load existing registered areas from localStorage
  private loadRegisteredAreas() {
    const stored = localStorage.getItem('registered-areas');
    if (stored) {
      try {
        this.registeredAreas = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading registered areas:', error);
        this.registeredAreas = [];
      }
    }
  }

  // Save registered areas to localStorage
  private saveRegisteredAreas() {
    localStorage.setItem('registered-areas', JSON.stringify(this.registeredAreas));
  }

  // Start drawing polygon
  startDrawingPolygon() {
    if (this.hasPolygonDrawn) {
      // Clear only the polygon from the map, keep the form data for redrawing
      this.mapViewerService.removeTemporaryPolygons();
      this.mapViewerService.clearPolygonDrawnEvent();
      
      // Reset drawing state
      this.hasPolygonDrawn = false;
      this.isDrawingActive = true;
    }
    
    this.mapViewerService.enableDrawing();
    this.showSnackBar('Haga clic en el mapa para dibujar los puntos del polígono. Haga clic en el último punto para cerrar y finalizar.');
  }

  // Clear polygon
  clearPolygon() {
    // Stop any active drawing
    this.mapViewerService.disableDrawing();
    
    // Remove all temporary polygons from the map
    this.mapViewerService.removeTemporaryPolygons();
    
    // Clear the event
    this.mapViewerService.clearPolygonDrawnEvent();
    
    // Reset local state
    this.hasPolygonDrawn = false;
    this.polygonInfo = null;
    this.generatedGeoJSON = '';
    this.isDrawingActive = false;
    
    this.showSnackBar('Polígono eliminado del mapa');
  }

  // Handle polygon completion
  private onPolygonCompleted(event: PolygonDrawnEvent | null) {
    console.log('onPolygonCompleted called with event:', event);
    
    if (event) {
      console.log('Procesando polígono completado...');
      this.hasPolygonDrawn = true;
      this.isDrawingActive = false;
      
      this.polygonInfo = {
        area: event.area,
        perimeter: event.perimeter,
        coordinates: event.coordinates
      };

      // Generate GeoJSON immediately
      this.generateGeoJSON();
      
      console.log('GeoJSON generado:', this.generatedGeoJSON ? 'SÍ' : 'NO');
      
      // The polygon should remain visible on the map (it's already added to drawingSource)
      console.log('Polígono completado:', {
        area: this.formatArea(event.area),
        perimeter: this.formatLength(event.perimeter),
        coordinates: event.coordinates.length + ' puntos'
      });
      
      this.showSnackBar('Polígono completado. Complete el formulario y guarde el registro.');
    } else {
      console.log('Evento de polígono es null, limpiando estado...');
    }
  }

  // Generate GeoJSON from polygon data
  private generateGeoJSON() {
    if (!this.polygonInfo) return;

    const geoJSON = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [this.polygonInfo.coordinates.map(coord => [coord[0], coord[1]])]
      },
      properties: {
        area: this.polygonInfo.area,
        perimeter: this.polygonInfo.perimeter,
        areaFormatted: this.formatArea(this.polygonInfo.area),
        perimeterFormatted: this.formatLength(this.polygonInfo.perimeter),
        fechaCreacion: new Date().toISOString()
      }
    };

    this.generatedGeoJSON = JSON.stringify(geoJSON, null, 2);
  }

  // Check if registration can be saved
  canSaveRegistration(): boolean {
    return this.areaRegistrationForm.valid && this.hasPolygonDrawn && !!this.polygonInfo;
  }

  // Save area registration
  saveAreaRegistration() {
    if (!this.canSaveRegistration()) {
      this.showSnackBar('Complete todos los campos y dibuje el polígono antes de guardar');
      return;
    }

    const formData = this.areaRegistrationForm.value;
    
    const record = {
      id: this.editingAreaId || Date.now().toString(),
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      direccion: formData.direccion,
      area: this.polygonInfo!.area,
      perimeter: this.polygonInfo!.perimeter,
      coordinates: this.polygonInfo!.coordinates,
      geoJSON: this.generatedGeoJSON,
      fechaRegistro: this.editingAreaId ? 
        this.registeredAreas.find(r => r.id === this.editingAreaId)?.fechaRegistro : 
        new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    if (this.editingAreaId) {
      // Update existing record
      const index = this.registeredAreas.findIndex(r => r.id === this.editingAreaId);
      if (index >= 0) {
        this.registeredAreas[index] = record;
        this.showSnackBar(`Registro de ${record.nombres} ${record.apellidos} actualizado`);
      }
    } else {
      // Add new record
      this.registeredAreas.push(record);
      this.showSnackBar(`Registro de ${record.nombres} ${record.apellidos} guardado exitosamente`);
    }

    this.saveRegisteredAreas();
    
    // Clear polygon from map after saving
    this.clearPolygon();
    
    this.cancelAreaRegistration();
  }

  // Cancel area registration
  cancelAreaRegistration() {
    this.areaRegistrationForm.reset();
    this.clearPolygon();
    this.editingAreaId = null;
    this.showSnackBar('Registro cancelado');
  }


  // Edit record
  editRecord(record: any) {
    console.log('editRecord llamado con registro:', record);
    console.log('Coordenadas del registro:', record.coordinates);
    
    this.editingAreaId = record.id;
    
    // Populate form
    this.areaRegistrationForm.patchValue({
      nombres: record.nombres,
      apellidos: record.apellidos,
      tipoDocumento: record.tipoDocumento,
      numeroDocumento: record.numeroDocumento,
      direccion: record.direccion
    });

    // Set polygon data and draw it on the map
    if (record.coordinates && record.coordinates.length > 0) {
      console.log('Recreando polígono para registro ID:', record.id, 'con', record.coordinates.length, 'coordenadas');
      
      this.hasPolygonDrawn = true;
      this.polygonInfo = {
        area: record.area,
        perimeter: record.perimeter,
        coordinates: record.coordinates
      };
      this.generatedGeoJSON = record.geoJSON;
      
      // Clear any existing polygons first
      this.mapViewerService.removeTemporaryPolygons();
      
      // Recreate and draw the polygon on the map using the specific record's coordinates
      const recreatedFeature = this.mapViewerService.drawPolygonFromCoordinates(record.coordinates, record.id);
      
      // Zoom to the polygon automatically
      if (recreatedFeature) {
        console.log('Haciendo zoom al polígono recreado');
        this.mapViewerService.zoomToFeature(recreatedFeature);
        
        const mockEvent = {
          coordinates: record.coordinates,
          area: record.area,
          perimeter: record.perimeter,
          feature: recreatedFeature
        };
        this.mapViewerService.setPolygonDrawnEvent(mockEvent);
      }
    } else {
      console.log('No hay coordenadas válidas en el registro:', record);
    }

    this.showSnackBar(`Editando registro de ${record.nombres} ${record.apellidos} - Polígono mostrado en el mapa`);
  }

  // Delete record
  deleteRecord(record: any) {
    const fullName = `${record.nombres} ${record.apellidos}`;
    if (confirm(`¿Está seguro de que desea eliminar el registro de ${fullName}?`)) {
      this.registeredAreas = this.registeredAreas.filter(r => r.id !== record.id);
      this.saveRegisteredAreas();
      this.showSnackBar(`Registro de ${fullName} eliminado`);
    }
  }

  // Download GeoJSON
  downloadGeoJSON(record: any) {
    if (!record.geoJSON) {
      this.showSnackBar('No hay datos de GeoJSON para descargar');
      return;
    }

    // Parse and enhance the GeoJSON with user data
    try {
      const geoJSON = JSON.parse(record.geoJSON);
      
      // Add user data to properties
      geoJSON.properties = {
        ...geoJSON.properties,
        nombres: record.nombres,
        apellidos: record.apellidos,
        tipoDocumento: record.tipoDocumento,
        numeroDocumento: record.numeroDocumento,
        direccion: record.direccion,
        fechaExportacion: new Date().toISOString()
      };

      const fileName = `area_${record.nombres.replace(/\s+/g, '_')}_${record.apellidos.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.geojson`;
      
      const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.showSnackBar(`Archivo GeoJSON de ${record.nombres} ${record.apellidos} descargado`);
    } catch (error) {
      this.showSnackBar('Error al generar el archivo GeoJSON');
      console.error('Error downloading GeoJSON:', error);
    }
  }

  // Utility methods
  formatArea(area: number): string {
    if (area > 10000) {
      return Math.round(area / 10000 * 100) / 100 + ' ha';
    }
    return Math.round(area * 100) / 100 + ' m²';
  }

  formatLength(length: number): string {
    if (length > 1000) {
      return Math.round(length / 1000 * 100) / 100 + ' km';
    }
    return Math.round(length * 100) / 100 + ' m';
  }
}
