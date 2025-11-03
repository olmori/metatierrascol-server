import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdiServerComponent } from './sdi-server.component';

describe('SdiServerComponent', () => {
  let component: SdiServerComponent;
  let fixture: ComponentFixture<SdiServerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdiServerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdiServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
