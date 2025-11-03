import { Component, OnInit} from '@angular/core';
import { ComponentMessageComponent } from '../../messages/component-message/component-message.component';
import { GlobalMessageService } from '../../../services/global-message.service';
import { manageServerErrors, sendMessages } from '../../../utilities/manageMessages';

import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../services/data.service';
import { MatTooltip } from '@angular/material/tooltip';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule } from '@angular/common';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { DjangoAndAppUserComponent } from './django-and-app-user/django-and-app-user.component';
import { DjangoAndAppUserModel } from '../../../models/djangoAndAppUserModel';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { DjangoGroupModel } from '../../../models/djangoGroupModel';
import { isStringInArrayOfStrings } from '../../../utilities/general';

@Component({
  selector: 'app-django-and-app-users',
  standalone: true,
  imports: [ComponentMessageComponent, HeaderComponent, 
    FooterComponent, ComponentMessageComponent,DjangoAndAppUserComponent, 
    MatFormField, CommonModule, MatInputModule, MatButtonModule, ReactiveFormsModule,
    MatButtonToggle, MatButtonToggleGroup, MatTooltip
    ],
    templateUrl: './django-and-app-users.component.html',
    styleUrl: './django-and-app-users.component.scss'
  })
  export class DjangoAndAppUsersComponent implements OnInit{
  
  componentMessages: Message[]=[];
  users:DjangoAndAppUserModel[]=[];
  numero_maximo_de_filas_recuperadas: number = 0;

  username = new FormControl('');
  groups: DjangoGroupModel[]=[];

  selectedGroupId:number=-1;
  selectedStatus:any=undefined;
  selectedSuperUser:any=undefined;
  selectedEmailConfirmed:any=undefined;
  
  constructor(private dataService:DataService, 
    private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar){}

  ngOnInit(): void {
    this.getSetting();   
    this.getGroups(); 
  }

  getSetting(){
    let endPoint = 'core/app_settings/get_parameter_value_by_name/';
    this.dataService.post(endPoint,{'parameter_name':'numero_maximo_de_filas_recuperadas'}).subscribe({
      next: response => {
        this.numero_maximo_de_filas_recuperadas= Number(response.parameter_value);
        this.componentMessages = sendMessages(StateEnum.success,
          'Número máximo de filas: ' + this.numero_maximo_de_filas_recuperadas.toString(),
          this.globalMessageService);  
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });  
  }

  getGroups(){
    this.groups=[];
    let endPoint = 'core/django_groups/';
    this.dataService.get(endPoint).subscribe({
      next: response => {
        this.groups = response as DjangoGroupModel[];
        this.componentMessages = sendMessages(StateEnum.success,
          'Grupos recuperados: ' + this.groups.length.toString(),
          this.globalMessageService);  
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });  
  }

  onGrupSelected(groupId:number){
    //console.log(groupId)
    this.selectedGroupId=groupId;
  }

  onStatusSelected(status:boolean[]){
    //console.log(status)
    this.selectedStatus=status;
  }

  onEmailSelected(status:boolean){
    this.selectedEmailConfirmed=status;
  }

  onSuperUserSelected(selected:boolean){
    //console.log(selected);
    this.selectedSuperUser=selected;
  }

  getUsers(mode: number){
    this.users=[];
    var endPoint:string='';
    //generates an object that admists new properties
    //obj['new_property']=value
    var obj: {[k: string]: any} = {};
    switch(mode){
      case 1: {
        endPoint = 'core/django_and_app_user/get_users/';
        if (this.username.value){obj['username'] = this.username.value;}
        if (this.selectedStatus !== undefined){obj['is_active'] = this.selectedStatus;}
        if (this.selectedSuperUser !== undefined){{obj['is_superuser'] = this.selectedSuperUser;}}
        if (this.selectedEmailConfirmed !== undefined){{obj['email_confirmed'] = this.selectedEmailConfirmed;}}
        break;
      }
      case 2: {
        endPoint='core/django_and_app_user/get_users_of_group/'; 
        obj['groupId']=this.selectedGroupId;
        break;
      }
    }
    this.dataService.post(endPoint,obj).subscribe({
      next: response => {
        this.users = response.data as DjangoAndAppUserModel[];
        this.componentMessages = sendMessages(StateEnum.success,response.message,this.globalMessageService,this.matSnackBar)      
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
}
