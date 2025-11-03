
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

import { manageServerErrors, manageServerSucessMessages, sendMessages } from '../../../utilities/manageMessages';

import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';
import { DataService } from '../../../services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-reset-form',
  standalone: true,
  imports: [ComponentMessageComponent,CommonModule,
    MatInputModule, MatButtonModule, ReactiveFormsModule,],
  templateUrl: './password-reset-form.component.html',
  styleUrl: './password-reset-form.component.scss'
})
export class PasswordResetFormComponent {
  componentMessages:Message[]=[];

  username = new FormControl('', [Validators.required,Validators.email]);

  controlsGroup = new FormGroup({
    email: this.username,
  })

  constructor (public dataService: DataService, public globalMessageService: GlobalMessageService,
    public matSnackBar: MatSnackBar
  ){}

  send(){
    this.dataService.post('core/request_reset_password_email/',this.controlsGroup.value).subscribe({
      next: response => {
        console.log('response',response)
        this.componentMessages=manageServerSucessMessages(response,this.globalMessageService, this.matSnackBar);
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }

}
