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
import { MatCardModule } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { ShowForRolesDirective } from '../../../../directives/show-for-roles.directive';
import { ShowForRolesService } from '../../../../services/show-for-roles.service';
import { environment } from '../../../../../environments/environment';
import { MobileAppVersionNotesModel } from '../../../../models/mobileAppVersionNotesModel';

@Component({
  selector: 'app-app-version',
  standalone: true,
  imports: [ComponentMessageComponent, MatCardModule, MatButton, DatePipe, ShowForRolesDirective],
  templateUrl: './app-version.component.html',
  styleUrl: './app-version.component.scss'
})
export class AppVersionComponent implements OnInit{
  @Input() mobileAppVersionModel: MobileAppVersionModel = new MobileAppVersionModel(
    -1,-1,'No file',false,new Date('6666-01-01'),-1,'');
  componentMessages:Message[]=[];
  mobileAppVersionNotes: MobileAppVersionNotesModel[]=[];

  constructor(private dataService:DataService, 
    private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar, public showForRolesService:ShowForRolesService){}
  ngOnInit(): void {
    this.getAppVersionNotes();
  }
  getAppVersionNotes(){
    //mobileappversion/mobile_app_version_notes/get_version_notes/
    this.dataService.get('mobileappversion/mobile_app_version_notes/get_version_notes/'+ this.mobileAppVersionModel.id.toString()+'/').subscribe({
      next: response => {
        this.mobileAppVersionNotes = response as MobileAppVersionNotesModel[];     
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  showForRoles(elementTemplateName:string): string[]{
    return this.showForRolesService.getAllowedRoles(elementTemplateName)
  }
  publicarAppVersion(){
    this.dataService.post('mobileappversion/mobile_app_version/publicar_version/'+ this.mobileAppVersionModel.id.toString()+'/',{'publicarr':true}).subscribe({
      next: response => {
        this.componentMessages = sendMessages(StateEnum.success,
          response.ok,
          this.globalMessageService)
          this.mobileAppVersionModel.publicar=true;
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  desPublicarAppVersion(){
    this.dataService.post('mobileappversion/mobile_app_version/despublicar_version/'+ this.mobileAppVersionModel.id.toString()+'/',{'publicarr':true}).subscribe({
      next: response => {
        this.componentMessages = sendMessages(StateEnum.success,
          response.ok,
          this.globalMessageService)
          this.mobileAppVersionModel.publicar=false;
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  getUrlDescargaApp():string{
    return environment.apiUrl + 'mobileappversion/mobile_app_version/download_version/' + this.mobileAppVersionModel.version.toString() + '/';
  }


}

