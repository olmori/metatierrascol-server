import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../../header/header.component';
import { FooterComponent } from '../../../footer/footer.component';
import { DataService } from '../../../../services/data.service';
import { GlobalMessageService } from '../../../../services/global-message.service';
import { ComponentMessageComponent } from '../../../messages/component-message/component-message.component';
import { MobileAppVersionModel } from '../../../../models/mobileAppVersionModel';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from '../../../../../environments/environment';
import { Message } from '../../../../models/message';
import { manageServerErrors, sendMessages } from '../../../../utilities/manageMessages';
import { StateEnum } from '../../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { MobileAppVersionNotesModel } from '../../../../models/mobileAppVersionNotesModel';

@Component({
  selector: 'app-last-app-version',
  standalone: true,
  imports: [HeaderComponent, FooterComponent,
    RouterLink, ComponentMessageComponent, MatTooltip, DatePipe
  ],
  templateUrl: './last-app-version.component.html',
  styleUrl: './last-app-version.component.scss'
})
export class LastAppVersionComponent{
  lastMobileAppVersionModel:MobileAppVersionModel = new MobileAppVersionModel(-1,-1,'',false,new Date('6666/06/06'),-1,'');
  allAppversionsNotes: MobileAppVersionNotesModel[]=[];

  componentMessages: Message[]=[]
  
  constructor(public dataService:DataService, public globalMessageService: GlobalMessageService,
    public matSnackBar:MatSnackBar
  ){
    this.getLastMobileAppVersionModel();
    this.getAllVersionNotes();
  }
  getLastMobileAppVersionModel(){
    this.dataService.get('mobileappversion/mobile_app_version/get_last_version_details/').subscribe({
      next: response => {
        this.componentMessages = sendMessages(StateEnum.success,'Versión obtenida con éxito',
          this.globalMessageService, this.matSnackBar);
          this.lastMobileAppVersionModel = response as MobileAppVersionModel;
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  getUrlDescargaApp():string{
    return environment.apiUrl + 'mobileappversion/mobile_app_version/download_version/' + this.lastMobileAppVersionModel.version.toString() + '/';
  }
  getAllVersionNotes(){
    this.dataService.get('mobileappversion/mobile_app_version_notes/').subscribe({
      next: response => {
        this.componentMessages = sendMessages(StateEnum.success,'Notas de todas las versiones obtenidas con éxito',
          this.globalMessageService, this.matSnackBar);
          this.allAppversionsNotes = response as MobileAppVersionNotesModel[];
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
}
