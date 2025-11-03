import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaDatagridComponent } from './area-datagrid.component';

describe('AreaDatagridComponent', () => {
  let component: AreaDatagridComponent;
  let fixture: ComponentFixture<AreaDatagridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreaDatagridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreaDatagridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
