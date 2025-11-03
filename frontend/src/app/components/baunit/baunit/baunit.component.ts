import { Component, Input } from '@angular/core';
import { BaunitModel, createDummyBaunit } from '../../../models/baunitModel';
import { environment } from '../../../../environments/environment';
import {MatIconModule} from '@angular/material/icon';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-baunit',
  standalone: true,
  imports: [MatIconModule, HeaderComponent, FooterComponent, MatTooltip, DatePipe],
  templateUrl: './baunit.component.html',
  styleUrl: './baunit.component.scss'
})
export class BaunitComponent {
  @Input() baunit: BaunitModel = createDummyBaunit();
  constructor(){}
  getUrlDownload(){
    return environment.apiUrl + 'source/descarga_zip_codigo_acceso/' + this.baunit.codigo_acceso + '/';
  }
}
