import { Component, OnInit, Input } from '@angular/core';
import { ComponentMessageComponent } from '../../../messages/component-message/component-message.component';
import { GlobalMessageService } from '../../../../services/global-message.service';
import { manageServerErrors, sendMessages } from '../../../../utilities/manageMessages';

import { Message } from '../../../../models/message';
import { StateEnum } from '../../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../services/data.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MobileAppVersionModel } from '../../../../models/mobileAppVersionModel';
import { AppVersionComponent } from '../app-version/app-version.component';
import { HeaderComponent } from '../../../header/header.component';
import { FooterComponent } from '../../../footer/footer.component';

@Component({
  selector: 'app-manage-app-versions',
  standalone: true,
  imports: [AppVersionComponent, ComponentMessageComponent, HeaderComponent, FooterComponent],
  templateUrl: './manage-app-versions.component.html',
  styleUrl: './manage-app-versions.component.scss'
})
export class ManageAppVersionsComponent implements OnInit{
  movileAppVersionModels: MobileAppVersionModel[]=[];
  componentMessages:Message[]=[];
  
  constructor(private dataService:DataService, 
    private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar){
    
  }
  
  ngOnInit(): void {
    this.getAppVersions();
  }
  getAppVersions(){
    this.dataService.get('mobileappversion/mobile_app_version/').subscribe({
      next: response => {
        //console.log('response',response)
        this.movileAppVersionModels=response as MobileAppVersionModel[];
        this.componentMessages = sendMessages(StateEnum.success,'Versiones recuperadas con éxito: ' + response.length.toString(),this.globalMessageService,this.matSnackBar)      
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });

  }
}
