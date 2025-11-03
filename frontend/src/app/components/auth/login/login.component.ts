import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {FormControl} from '@angular/forms';
import {FormGroup, Validators} from '@angular/forms';
import {ReactiveFormsModule } from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import { Subscription } from 'rxjs';

import { ComponentMessageComponent } from '../../messages/component-message/component-message.component';

import { GlobalMessageService } from '../../../services/global-message.service';
import { AuthService } from '../../../services/auth.service';

import { sendMessages } from '../../../utilities/manageMessages';

import { Message } from '../../../models/message';
import { AuthUserModel } from '../../../models/authUserModel';
import { StateEnum } from '../../../enumerations/stateEnum';
import { PasswordResetFormComponent } from '../password-reset-form/password-reset-form.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ComponentMessageComponent, CommonModule,
    MatInputModule, MatButtonModule, ReactiveFormsModule, PasswordResetFormComponent

  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy{
  urlDjangoApi = new FormControl('', [Validators.required, Validators.minLength(10)]);//to show on insert;
  username = new FormControl('', [Validators.required, Validators.minLength(4)]);//to show on insert;
  password = new FormControl('', [Validators.required, Validators.minLength(4)]);//to show on insert;

  controlsGroup = new FormGroup({
    urlDjangoApi: this.urlDjangoApi,
    username: this.username,
    password: this.password
  })
  authUserModel: AuthUserModel = new AuthUserModel('',new Date('6666-01-01'),[],'',false)
  componentMessages:Message[] = [];
  
  authMessagesSub?: Subscription;
  authUserSub?:Subscription;

  showPasswordResetForm=false;

  constructor(private authService:AuthService, private router:Router, private globalMessageService: GlobalMessageService){
    this.urlDjangoApi.setValue(this.authService.authUserModel.apiUrl);
    this.authMessagesSub=this.authService.authMessagesSubject.subscribe({
      next: componentMessages => {
        this.componentMessages = componentMessages;
      }
    })
    this.authUserSub = this.authService.authUserSubject.subscribe({
      next: authUserModel => {
        this.authUserModel=authUserModel;
        if (this.authUserModel.isLoggedIn){this.showPasswordResetForm=false}
      }
    });
  }
  login(){
    if (this.authService.authUserModel.isLoggedIn){
      this.componentMessages = sendMessages(StateEnum.error,'La sesión está iniciada. Para iniciar una nueva debe primero debe cerrar su sesión actual',this.globalMessageService);
      return;
    }
    this.authService.login(this.urlDjangoApi.value as string,this.username.value as string,this.password.value as string);
    //this.router.navigate(['',{outlets: {right_sidenav:['baunit']}}]);
  }

  tooglePasswordResetEmail(){
    this.showPasswordResetForm = !this.showPasswordResetForm;
  }
  ngOnDestroy(): void {
    this.authMessagesSub?.unsubscribe();
    this.authUserSub?.unsubscribe();
  }
}
