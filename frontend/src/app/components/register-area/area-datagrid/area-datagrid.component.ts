import { Component, computed, EventEmitter, Output } from '@angular/core';
import { AreaDataService } from '../../../services/area-data.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AreaDataModel } from '../../../models/areaDataModel';

@Component({
  selector: 'app-area-datagrid',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  templateUrl: './area-datagrid.component.html',
  styleUrl: './area-datagrid.component.scss'
})
export class AreaDatagridComponent {
  userDataList = computed(() => this.areaDataService.userDataList());
  
  @Output() editArea = new EventEmitter<AreaDataModel>();
  @Output() viewInMapEvent = new EventEmitter<AreaDataModel>();

  displayedColumns: string[] = [
    'nombres', 
    'apellidos', 
    'tipoDocumento', 
    'numeroDocumento', 
    'direccion', 
    'actions'
  ];

  constructor(private areaDataService: AreaDataService) {}

  delete(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este registro?')) {
      this.areaDataService.deleteUserData(id);
    }
  }

  edit(areaData: AreaDataModel) {
    this.editArea.emit(areaData);
  }

  viewInMap(areaData: AreaDataModel) {
    this.viewInMapEvent.emit(areaData);
  }

  exportGeoJSON(areaData: AreaDataModel) {
    try {
      // Parse and pretty format the GeoJSON
      const geoJSON = JSON.parse(areaData.areaVivienda);
      
      // Add export timestamp
      if (!geoJSON.properties) {
        geoJSON.properties = {};
      }
      geoJSON.properties.fechaExportacion = new Date().toISOString();
      
      const formattedGeoJSON = JSON.stringify(geoJSON, null, 2);
      const fileName = `area_${areaData.nombres.replace(/\s+/g, '_')}_${areaData.apellidos.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.geojson`;
      
      const blob = new Blob([formattedGeoJSON], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting GeoJSON:', error);
      // Fallback to original method
      const blob = new Blob([areaData.areaVivienda], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `area_${areaData.nombres}_${areaData.apellidos}.geojson`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }
}