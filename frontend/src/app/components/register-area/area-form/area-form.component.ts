import { Component, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AreaDataService } from '../../../services/area-data.service';
import { AreaMapComponent } from '../area-map/area-map.component';
import { AreaDataModel } from '../../../models/areaDataModel';

@Component({
  selector: 'app-area-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, AreaMapComponent],
  templateUrl: './area-form.component.html',
  styleUrl: './area-form.component.scss'
})
export class AreaFormComponent {
  userForm: FormGroup;
  geoJson = signal('');
  polygonClosed = signal(false);
  coordinates = signal<{ lat: number, lng: number }[]>([]);

  constructor(private fb: FormBuilder, private userDataService: AreaDataService) {
    this.userForm = this.fb.group({
      entryMethod: ['map'],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      direccion: ['', Validators.required],
      manualCoordinates: this.fb.array([])
    });
  }

  get manualCoordinates(): FormArray {
    return this.userForm.get('manualCoordinates') as FormArray;
  }

  get entryMethod() {
    return this.userForm.get('entryMethod')?.value;
  }

  onEntryMethodChange() {
    this.clearPolygon();
  }

  addManualCoordinate(lat: string, lng: string) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;

    this.manualCoordinates.push(this.fb.group({ lat: latNum, lng: lngNum }));
    this.coordinates.update(coords => [...coords, { lat: latNum, lng: lngNum }]);
  }

  removeManualCoordinate(index: number) {
    this.manualCoordinates.removeAt(index);
    this.coordinates.update(coords => coords.filter((_, i) => i !== index));
  }

  addVertexFromMap(vertex: { lat: number, lng: number }) {
    if (this.entryMethod === 'map') {
      this.coordinates.update(coords => [...coords, vertex]);
    }
  }

  closePolygon() {
    if (this.coordinates().length < 3) return;
    this.polygonClosed.set(true);
    this.buildGeoJSON();
  }

  clearPolygon() {
    this.coordinates.set([]);
    this.polygonClosed.set(false);
    this.geoJson.set('');
    this.manualCoordinates.clear();
  }

  buildGeoJSON() {
    const coords = this.coordinates().map(p => [p.lng, p.lat]);
    coords.push(coords[0]);
    this.geoJson.set(JSON.stringify({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {}
    }));
  }

  onSubmit() {
    if (this.userForm.valid && this.polygonClosed()) {
      const data: AreaDataModel = {
        id: Date.now(),
        ...this.userForm.value,
        areaVivienda: this.geoJson()
      };

      this.userDataService.addUserData(data);
      this.userForm.reset({ entryMethod: 'map' });
      this.coordinates.set([]);
      this.geoJson.set('');
      this.polygonClosed.set(false);
      this.manualCoordinates.clear();
    }
  }
}
