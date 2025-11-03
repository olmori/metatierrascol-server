import { Component, OnDestroy } from '@angular/core';
import { Router} from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from "@angular/material/button";

import { ComponentMessageComponent } from '../../messages/component-message/component-message.component';

import { AuthService } from '../../../services/auth.service';
import { SidenavsService } from '../../../services/sidenavs.service';

import { AuthUserModel } from '../../../models/authUserModel';
import { Message } from '../../../models/message';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [ComponentMessageComponent, CommonModule,
    MatButtonModule, ReactiveFormsModule],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss'
})
export class LogoutComponent implements OnDestroy {

  authUserModel: AuthUserModel = new AuthUserModel('',new Date('6666-01-01'),[],'',false)
  componentMessages:Message[] = [];

  authMessagesSub?: Subscription;
  authUserSub?:Subscription;

  constructor(private authService: AuthService, private router:Router, 
    private sidenavsService:SidenavsService
  ){
    this.authUserModel=authService.authUserModel;
    this.authMessagesSub=this.authService.authMessagesSubject.subscribe({
      next: componentMessages => {
        this.componentMessages = componentMessages;
      }
    })
    this.authUserSub=this.authService.authUserSubject.subscribe({
      next: authUserModel => {
        this.authUserModel=authUserModel;
      }
    });
  }
  logout(){
    this.authService.logout();
    this.sidenavsService.closeAppSidenavRight();
    this.router.navigate(['',{outlets: {right_sidenav:['blank']}}]);
  }
  ngOnDestroy(): void {
    this.authMessagesSub?.unsubscribe();
    this.authUserSub?.unsubscribe();
  }
}
