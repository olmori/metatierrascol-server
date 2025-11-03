import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Message } from '../../../../models/message';
import { ComponentMessageComponent } from '../../../messages/component-message/component-message.component';
import { DataService } from '../../../../services/data.service';
import { GlobalMessageService } from '../../../../services/global-message.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { deleteObjectsFromArray, isStringInArrayOfStrings } from '../../../../utilities/general';
import { manageServerErrors, manageServerSucessMessages, sendMessages } from '../../../../utilities/manageMessages';
import { StateEnum } from '../../../../enumerations/stateEnum';
import { DjangoAndAppUserModel } from '../../../../models/djangoAndAppUserModel';
import { DjangoGroupModel } from '../../../../models/djangoGroupModel';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ReplacePipe } from '../../../../pipes/replace.pipe';
import { AuthService } from '../../../../services/auth.service';
import { delay } from 'rxjs';

@Component({
  selector: 'app-django-and-app-user',
  standalone: true,
  imports: [ComponentMessageComponent,MatInputModule, MatButtonModule, ReactiveFormsModule,
    CommonModule, MatSlideToggle, DatePipe, ReplacePipe, FormsModule, CommonModule],
    templateUrl: './django-and-app-user.component.html',
    styleUrl: './django-and-app-user.component.scss'
  })
  export class DjangoAndAppUserComponent implements OnInit, AfterViewInit{
    @Input() user: DjangoAndAppUserModel = new DjangoAndAppUserModel(-1,-1,'','',false,'',false,new Date('6666-01-01'),false,'',false,[],false,new Date('6666-01-01'));
    @Input() groups: DjangoGroupModel[] = [];
  componentMessages:Message[]=[];

  //status
  is_superuser=false;
  is_active=false;
  email_confirmed=false;

  //groups
  admin=false;
  agrimensor=false;
  gestor_catastral=false;
  igac=false;
  receptor_email_usuario_confirma_email=false;
  forjando_futuros=false;
  propietario=false;
  ant=false;
  snr=false;
  receptor_email_nuevos_usuarios=false;
  receptor_email_usuario_sube_predio=false;

  constructor(public dataService: DataService, public globalMessageService: GlobalMessageService,
    public matSnackBar: MatSnackBar, public authService: AuthService
  ){}
  ngOnInit(): void {
  }

  refreshComponent(){
    if (this.user.is_superuser && this.user.username == this.authService.authUserModel.username){
      this.componentMessages.push(sendMessages(
        StateEnum.info,"El control para superadministrador está deshabilitado. No puede eliminarse del grupo usted mismo",
        this.globalMessageService)[0]);
      this.componentMessages.push(sendMessages(
          StateEnum.info,"El control para activar-desactivar su usuario está deshabilitado. No puede desactivarse usted mismo",
          this.globalMessageService)[0]);
      this.componentMessages.push(sendMessages(
        StateEnum.info,"El control para quitarle del grupo admin está deshabilitado. No puede quitarse usted mismo",
        this.globalMessageService)[0]);
    }


    this.is_superuser=this.user.is_superuser;
    this.is_active=this.user.is_active;
    this.email_confirmed=this.user.email_confirmed;

    if (isStringInArrayOfStrings('admin', this.user.user_groups)){this.admin=true}
    if (isStringInArrayOfStrings('agrimensor', this.user.user_groups)){this.agrimensor=true}
    if (isStringInArrayOfStrings('gestor_catastral', this.user.user_groups)){this.gestor_catastral=true}
    if (isStringInArrayOfStrings('igac', this.user.user_groups)){this.igac=true}
    if (isStringInArrayOfStrings('receptor_email_usuario_confirma_email', this.user.user_groups)){this.receptor_email_usuario_confirma_email=true}
    if (isStringInArrayOfStrings('forjando_futuros', this.user.user_groups)){this.forjando_futuros=true}
    if (isStringInArrayOfStrings('ant', this.user.user_groups)){this.ant=true}
    if (isStringInArrayOfStrings('snr', this.user.user_groups)){this.snr=true}
    if (isStringInArrayOfStrings('receptor_email_nuevos_usuarios', this.user.user_groups)){this.receptor_email_nuevos_usuarios=true}
    if (isStringInArrayOfStrings('receptor_email_usuario_sube_predio', this.user.user_groups)){this.receptor_email_usuario_sube_predio=true}
    if (isStringInArrayOfStrings('propietario', this.user.user_groups)){this.propietario=true}
  }

  isItsOwnAdminSession():boolean{
    if (this.user.is_superuser && this.user.username == this.authService.authUserModel.username){
      return true;
    }else{
      return false;
    }

  }
  onChangeIsSuperUser(event:any){
    this.dataService.patch('core/django_user_status_update/' + this.user.user_id.toString() + '/',{'is_superuser':event.checked}).subscribe({
      next: response => {
        this.componentMessages.push(new Message(StateEnum.success,"Usuario cambiado. is_superuser: " + response.is_superuser.toString()));
        this.user.is_superuser=response.is_superuser;
        this.refreshComponent()
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }

  onChangeIsActive(event:any){
    this.dataService.patch('core/django_user_status_update/' + this.user.user_id.toString() + '/',{'is_active':event.checked}).subscribe({
      next: response => {
        this.componentMessages.push(new Message(StateEnum.success,"Usuario cambiado. is_active: " + response.is_active.toString()));
        this.user.is_active = response.is_active;
        this.refreshComponent();
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }

  onChangeEmailConfirmed(event:any){
    this.dataService.patch('core/app_user/' + this.user.user_id.toString() + '/',{'email_confirmed':event.checked}).subscribe({
      next: response => {
        this.componentMessages.push(new Message(StateEnum.success,"Email confirmado. email_confirmed: " + response.email_confirmed.toString()));
        this.user.email_confirmed=response.email_confirmed;
        this.refreshComponent();
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }

  onChangeGroup(groupName:string,event:any){
    var groupId = this.getGroupIdFromGroupName(groupName);
    console.log(groupName, groupId)
    if (event.checked){
      var endPoint = 'core/django_user_groups_update/' + this.user.user_id.toString() + '/add_user_to_group/'
    }else{
      var endPoint = 'core/django_user_groups_update/' + this.user.user_id.toString() + '/remove_user_from_group/'
    }
    this.dataService.post(endPoint,{'groupId':groupId}).subscribe({
      next: response => {
        this.componentMessages.push(manageServerSucessMessages(response,this.globalMessageService)[0]);
        if (event.checked){
          this.user.user_groups.push(groupName);
        }else{
          deleteObjectsFromArray(this.user.user_groups,[groupName])
        }
        this.refreshComponent();
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }

  onChangeGroupAdmin(event:any){
    this.dataService.patch('core/django_user_groups_update/' + this.user.user_id.toString() + '/add_user_to_group/' + this.user.user_id.toString() + '/',{'email_confirmed':event.checked}).subscribe({
      next: response => {
        this.componentMessages.push(new Message(StateEnum.success,"Email confirmado. email_confirmed: " + response.email_confirmed.toString()));
        this.user.email_confirmed=response.email_confirmed;
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  
  getGroupIdFromGroupName(groupName:string):number{
    var n=-1;
    for (let g of this.groups){
      if (g.name==groupName){
        n=g.id
        break;
      }
    }
    if (n == -1){
      this.componentMessages.push(sendMessages(StateEnum.error,'Grupo ' + groupName + ' no encontrado',this.globalMessageService)[0])
    }
    return n
  }

  ngAfterViewInit(): void {

    this.refreshComponent();
  }
}
