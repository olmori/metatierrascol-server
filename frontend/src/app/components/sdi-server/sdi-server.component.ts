import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { WmsService, WMSServiceValidation, WMSCapabilities, WMSLayerInfo } from '../../services/wms.service';
import { WmsService as WmsServiceModel } from '../../models/wmsService';
import { WmsLayerCreate } from '../../models/wmsLayer';

export interface WMSServiceConfig {
  id: string;
  name: string;
  url: string;
  title?: string;
  abstract?: string;
  version?: string;
  layers?: WMSLayerInfo[]; // Solo capas hijas (para TAB "Servicios WMS")
  layersWithHierarchy?: WMSLayerInfo[]; // Padre + capas hijas (para TAB "Capas")
  capabilities?: WMSCapabilities;
  active: boolean;
  lastUpdated?: Date;
  validationErrors?: string[];
  validationWarnings?: string[];
  source?: 'backend' | 'local'; // Indica si el servicio viene del backend o es local
  backendId?: number; // ID del backend si aplica
}

@Component({
  selector: 'app-sdi-server',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sdi-server.component.html',
  styleUrl: './sdi-server.component.scss'
})
export class SdiServerComponent implements OnInit, OnChanges {
  @Input() backendServices: WmsServiceModel[] = [];
  @Input() isLoadingBackendServices = false;

  @Output() backendServiceSaved = new EventEmitter<void>(); // Evento para recargar servicios del backend

  wmsForm: FormGroup;
  backendWmsServices: WMSServiceConfig[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private wmsService: WmsService
  ) {
    this.wmsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  ngOnInit() {
    // No es necesario cargar nada, los servicios vienen del backend vía @Input
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['backendServices'] && this.backendServices) {
      this.processBackendServices();
    }
  }

  /**
   * Convierte los servicios del backend en WMSServiceConfig
   */
  private processBackendServices(): void {
    this.backendWmsServices = this.backendServices.map(backendService => ({
      id: `backend-${backendService.id}`,
      name: backendService.name,
      url: backendService.base_url,
      version: backendService.version,
      active: true,
      source: 'backend' as const,
      backendId: backendService.id,
      lastUpdated: new Date(backendService.created_at),
      layers: [],
      validationErrors: [],
      validationWarnings: []
    }));
    console.log('processBackendServices', this.backendWmsServices);
  }

  addWMSService() {
    if (this.wmsForm.valid) {
      this.loading = true;
      const formData = this.wmsForm.value;
      
      const newService: WMSServiceConfig = {
        id: this.generateId(),
        name: formData.name,
        url: formData.url,
        active: true,
        layers: [],
        lastUpdated: new Date()
      };

      // Usar el nuevo servicio WMS
      this.wmsService.validateAndGetCapabilities(formData.url).subscribe({
        next: (validation: WMSServiceValidation) => {
          this.handleValidationResult(newService, validation);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error en validación WMS:', error);
          this.showSnackBar('Error inesperado al validar el servicio WMS');
          this.loading = false;
        }
      });
    }
  }

  private handleValidationResult(service: WMSServiceConfig, validation: WMSServiceValidation) {
    // Guardar errores y warnings
    service.validationErrors = validation.errors;
    service.validationWarnings = validation.warnings;

    if (validation.isValid && validation.capabilities) {
      // Actualizar información del servicio con los datos reales
      service.title = validation.capabilities.serviceTitle;
      service.abstract = validation.capabilities.serviceAbstract;
      service.version = validation.capabilities.version;
      service.layers = validation.capabilities.layers; // Solo capas hijas para TAB "Servicios WMS"
      service.layersWithHierarchy = validation.capabilities.layersWithHierarchy; // Padre + hijas para TAB "Capas"
      service.capabilities = validation.capabilities;

      console.log('✅ Validación exitosa, guardando en backend...');

      // Guardar en el backend
      const backendData = {
        name: service.name,
        base_url: service.url,
        version: service.version || '1.3.0'
      };

      this.wmsService.createWmsService(backendData).subscribe({
        next: (savedService) => {
          console.log('✅ Servicio guardado en backend:', savedService);

          // Mapear y enviar las capas al backend
          if (service.layers && service.layers.length > 0) {
            console.log('📋 Mapeando capas para enviar al backend...');
            const layersToSend = this.mapLayersToBackendFormat(service.layers);

            this.wmsService.createWmsLayers(savedService.id, layersToSend).subscribe({
              next: (savedLayers) => {
                console.log('✅ Capas guardadas en backend:', savedLayers);

                // Limpiar formulario y recargar servicios del backend
                this.wmsForm.reset();
                this.loading = false;

                // Mostrar mensaje de éxito
                let message = `Servicio WMS "${service.name}" agregado con ${savedLayers.length} capa(s) guardada(s)`;
                if (validation.warnings.length > 0) {
                  message += `\nAdvertencias: ${validation.warnings.length}`;
                }

                this.showSnackBar(message);

                // Notificar al componente padre para que recargue la lista del backend
                this.backendServiceSaved.emit();
              },
              error: (layerError) => {
                console.error('❌ Error al guardar capas:', layerError);

                this.wmsForm.reset();
                this.loading = false;

                this.showSnackBar(`Servicio guardado, pero hubo un error al guardar las capas.`);
                this.backendServiceSaved.emit();
              }
            });
          } else {
            // Si no hay capas, solo notificar que se guardó el servicio
            this.wmsForm.reset();
            this.loading = false;

            this.showSnackBar(`Servicio WMS "${service.name}" agregado exitosamente (sin capas)`);
            this.backendServiceSaved.emit();
          }
        },
        error: (error) => {
          console.error('❌ Error al guardar en backend:', error);

          this.loading = false;

          let errorMessage = 'Error al guardar el servicio en el servidor.';
          if (error.error?.detail) {
            errorMessage += ` Detalle: ${error.error.detail}`;
          }

          this.showSnackBar(errorMessage);
        }
      });

    } else {
      // El servicio no es válido
      let errorMessage = `Error al validar el servicio WMS "${service.name}":`;
      if (validation.errors.length > 0) {
        errorMessage += `\n• ${validation.errors.join('\n• ')}`;
      }

      this.showSnackBar(errorMessage);
    }
  }


  /**
   * Elimina un servicio WMS del backend
   */
  deleteBackendService(service: WMSServiceConfig) {
    if (!service.backendId) {
      this.showSnackBar('Error: El servicio no tiene ID del backend');
      return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Está seguro que desea eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    console.log(`🗑️ Eliminando servicio del backend: ${service.name} (ID: ${service.backendId})`);
    this.loading = true;

    this.wmsService.deleteWmsService(service.backendId).subscribe({
      next: () => {
        console.log('✅ Servicio eliminado del backend exitosamente');

        // Eliminar de la lista local
        this.backendWmsServices = this.backendWmsServices.filter(s => s.backendId !== service.backendId);

        this.showSnackBar(`Servicio "${service.name}" eliminado exitosamente`);
        this.loading = false;

        // Notificar al componente padre para que recargue la lista del backend
        this.backendServiceSaved.emit();
      },
      error: (error) => {
        console.error('❌ Error al eliminar servicio del backend:', error);

        let errorMessage = `Error al eliminar el servicio "${service.name}"`;
        if (error.error?.detail) {
          errorMessage += `: ${error.error.detail}`;
        }

        this.showSnackBar(errorMessage);
        this.loading = false;
      }
    });
  }

  /**
   * Mapea las capas del XML GetCapabilities al formato requerido por el backend
   */
  private mapLayersToBackendFormat(layers: WMSLayerInfo[]): WmsLayerCreate[] {
    return layers.map((layer, index) => {
      const layerData: WmsLayerCreate = {
        layer_name: layer.name,
        layer_title: layer.title || layer.name,
        visible: false, // Por defecto no visible
        opacity: 1.0, // Opacidad por defecto
        z_index: index + 1 // z_index secuencial basado en el orden
      };

      // Agregar estilo si existe (usar el primero disponible)
      if (layer.styles && layer.styles.length > 0) {
        layerData.style = layer.styles[0].name;
      }

      // Agregar información extra si existe
      const extra: Record<string, any> = {};

      // Agregar formato preferido (image/png por defecto si está disponible)
      if (layer.supportedCrs && layer.supportedCrs.length > 0) {
        extra['FORMAT'] = 'image/png'; // Formato estándar
      }

      // Solo agregar extra si tiene contenido
      if (Object.keys(extra).length > 0) {
        layerData.extra = extra;
      }

      console.log(`  📄 Capa mapeada: ${layer.name} (${layer.title})`);

      return layerData;
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
