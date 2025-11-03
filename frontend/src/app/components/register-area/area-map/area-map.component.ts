import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-area-map',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule
  ],
  templateUrl: './area-map.component.html',
  styleUrl: './area-map.component.scss'
})
export class AreaMapComponent {
  @Input() coordinates: { lat: number, lng: number }[] = [];
  @Input() mode: 'map' | 'manual' = 'map';
  @Input() polygonClosed = false;
  @Output() vertexAdded = new EventEmitter<{ lat: number, lng: number }>();

  center = { lat: -12.0464, lng: -77.0428 };
  polygonPath: google.maps.LatLngLiteral[] = [];
  zoom = 15;

  ngOnChanges(changes: SimpleChanges) {
    this.polygonPath = this.coordinates.map(p => ({ lat: p.lat, lng: p.lng }));
    if (this.coordinates.length) {
      const last = this.coordinates[this.coordinates.length - 1];
      this.center = { lat: last.lat, lng: last.lng };
    }
  }

  addVertex(event: google.maps.MapMouseEvent) {
    if (this.mode === 'map' && !this.polygonClosed && event.latLng) {
      this.vertexAdded.emit({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  }
}
