import { Component, OnInit } from '@angular/core';

import {FormControl} from '@angular/forms';
import {FormGroup, Validators} from '@angular/forms';
import {ReactiveFormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";

import { ComponentMessageComponent } from '../../messages/component-message/component-message.component';
import { GlobalMessageService } from '../../../services/global-message.service';
import { manageServerErrors, sendMessages } from '../../../utilities/manageMessages';

import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../services/data.service';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';




@Component({
  selector: 'app-app-user',
  standalone: true,
  imports: [ComponentMessageComponent, CommonModule,
    MatInputModule, MatButtonModule, ReactiveFormsModule, MatTooltip
  ],
  templateUrl: './app-user.component.html',
  styleUrl: './app-user.component.scss'
})
export class AppUserComponent implements OnInit{
  username = new FormControl('', [Validators.required,Validators.email]);
  interest =  new FormControl('', [Validators.required, Validators.minLength(100)]);
  passwordFormControl1 = new FormControl('', [Validators.required,Validators.minLength(9)]);
  passwordFormControl2 = new FormControl('', [Validators.required,Validators.minLength(9)]);
  checkAcceptDataPolicy = new FormControl(false, [Validators.required]);
  checkAcceptEmailNotifications = new FormControl(false, [Validators.required]);
  
  srcImgCaptcha ='';
  captcha_0 = new FormControl('');
  captcha_1 = new FormControl('', [Validators.required]);

  data_acceptation=false;
  notification_acceptation=false;

  controlsGroup = new FormGroup({
    username: this.username,
    password: this.passwordFormControl1,
    passwordFormControl2: this.passwordFormControl2,
    data_acceptation: this.checkAcceptDataPolicy,
    notification_acceptation: this.checkAcceptEmailNotifications,
    captcha_0: this.captcha_0,
    captcha_1: this.captcha_1,
    interest: this.interest
  })

  componentMessages:Message[] = [];


  constructor(private dataService:DataService, private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar
  ){
    if (environment.debug){
      this.username.setValue('joamona@upv.es');
      this.passwordFormControl1.setValue('micarro222')
      this.passwordFormControl2.setValue('micarro222')
      this.interest.setValue('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd')
    }
  }

  ngOnInit(): void {
    this.getCaptcha()
  }

  addUser(){
    this.componentMessages=[];
    if (this.passwordFormControl1.value != this.passwordFormControl2.value){
      this.componentMessages= sendMessages(StateEnum.error,'Las contraseñas no son iguales',this.globalMessageService,this.matSnackBar);
      return;
    }

    this.dataService.post('core/django_and_app_user/',this.controlsGroup.value).subscribe({
      next: response => {
        console.log('response',response)
        if ('id' in response){
          var m:Message[]=sendMessages(StateEnum.success,'Su usuario ha sido añadido con éxito',this.globalMessageService, this.matSnackBar);
          var m1:Message[]=sendMessages(StateEnum.success,'Ahora consulte su email. Debe confirmar su correo electrónico',this.globalMessageService, this.matSnackBar);
          m[0].id=1;m1[0].id=0;
          this.componentMessages=[m[0],m1[0]]
        }        
      },
      error:error=>{
        this.getCaptcha();
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }

  getCaptcha(){
    //returns a dict with csrmidlewaretoken, srcImg, captcha_0
    sendMessages(StateEnum.info,"Obteniendo captcha",this.globalMessageService)
    this.dataService.get("core/create_captcha/").subscribe({
      next: data  => {
        sendMessages(StateEnum.success,"Captcha recibido",this.globalMessageService)
        if (data.ok=="true"){
            this.srcImgCaptcha=this.dataService.authUserModel.apiUrl + data.data[0].srcImgCaptcha;
            this.captcha_0.setValue(data.data[0].captcha_0);
            this.captcha_1.setValue('')
          }
      },
      error:error  => {
          this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  changeAcceptdata(checkbox: HTMLInputElement){
    this.data_acceptation = checkbox.checked;
    console.log(this.data_acceptation)
    console.log(this.controlsGroup.value)
  }
  changeAcceptNotification(checkbox: HTMLInputElement){
    this.notification_acceptation = checkbox.checked;
    console.log(this.notification_acceptation)
    console.log(this.controlsGroup.value)
  }
}

