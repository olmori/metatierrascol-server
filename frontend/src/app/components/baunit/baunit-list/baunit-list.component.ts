import { Component, OnInit, Input } from '@angular/core';
import { ComponentMessageComponent } from '../../messages/component-message/component-message.component';
import { GlobalMessageService } from '../../../services/global-message.service';
import { manageServerErrors, sendMessages } from '../../../utilities/manageMessages';

import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../services/data.service';
import { SettingModel } from '../../../models/settingModel';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { BaunitModel } from '../../../models/baunitModel';
import { BaunitComponent } from '../baunit/baunit.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-baunit-list',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ComponentMessageComponent, BaunitComponent],
  templateUrl: './baunit-list.component.html',
  styleUrl: './baunit-list.component.scss'
})
export class BaunitListComponent {
  componentMessages: Message[]=[];
  baunitModels: BaunitModel[]=[]
  mode='user';
  constructor(private dataService:DataService, 
    private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar, public route: ActivatedRoute,
    private authService: AuthService){}
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.mode = params.get("mode")!;//indicates mode can't be null
      if (this.mode=='creado_por'){
        this.getCreadoPor();
      }
      if (this.mode=='admin'){
        this.getAllBaunits();
      }
      if (this.mode == 'interesado'){
        console.log(this.mode)
      }
    });
  }
  getAllBaunits(){
    console.log(this.mode);
    this.dataService.get('baunit/baunit/').subscribe({
      next: response => {
        this.baunitModels = response as BaunitModel[];
        this.componentMessages = sendMessages(StateEnum.success,'Predios recibidos con éxito: ' + response.length.toString(),this.globalMessageService,this.matSnackBar)      
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  getCreadoPor(){
    console.log('-----------')
    console.log(this.mode);
    this.dataService.post('baunit/baunit/get_created_by_user_baunits/',{'creado_por':this.authService.authUserModel.username}).subscribe({
      next: response => {
        this.baunitModels = response as BaunitModel[];
        this.componentMessages = sendMessages(StateEnum.success,'Predios recibidos con éxito: ' + response.length.toString(),this.globalMessageService,this.matSnackBar)      
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
}

