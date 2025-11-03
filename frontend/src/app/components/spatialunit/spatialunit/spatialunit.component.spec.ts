import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpatialunitComponent } from './spatialunit.component';

describe('SpatialunitComponent', () => {
  let component: SpatialunitComponent;
  let fixture: ComponentFixture<SpatialunitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpatialunitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpatialunitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
