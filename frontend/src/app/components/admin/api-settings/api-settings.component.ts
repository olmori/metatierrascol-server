import { Component, OnInit, Input } from '@angular/core';
import { ComponentMessageComponent } from '../../messages/component-message/component-message.component';
import { GlobalMessageService } from '../../../services/global-message.service';
import { manageServerErrors, sendMessages } from '../../../utilities/manageMessages';

import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../services/data.service';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { SettingModel } from '../../../models/settingModel';

import { ApiSettingComponent } from './api-setting/api-setting.component';

@Component({
  selector: 'app-api-settings',
  standalone: true,
  imports: [ComponentMessageComponent, HeaderComponent, 
    FooterComponent, ComponentMessageComponent, ApiSettingComponent
    ],

  templateUrl: './api-settings.component.html',
  styleUrl: './api-settings.component.scss'
})
export class ApiSettingsComponent implements OnInit{
  
  componentMessages: Message[]=[];
  settings:SettingModel[]=[];

  constructor(private dataService:DataService, 
    private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar){}
  ngOnInit(): void {
    this.getSettings();
  }
  getSettings(){
    this.dataService.get('core/app_settings/').subscribe({
      next: response => {
        this.settings= response as SettingModel[];
        this.componentMessages = sendMessages(StateEnum.success,'Configuraciones recuperadas con éxito: ' + response.length.toString(),this.globalMessageService,this.matSnackBar)      
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
}
