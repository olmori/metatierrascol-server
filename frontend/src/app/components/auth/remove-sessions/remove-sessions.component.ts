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
  selector: 'app-remove-sessions',
  standalone: true,
  imports: [ComponentMessageComponent, CommonModule,
    MatButtonModule, ReactiveFormsModule],
  templateUrl: './remove-sessions.component.html',
  styleUrl: './remove-sessions.component.scss'
})
export class RemoveSessionsComponent implements OnDestroy{
  componentMessages:Message[] = [];

  authMessagesSub?: Subscription;

  constructor(private authService: AuthService){
      this.authMessagesSub=this.authService.authMessagesSubject.subscribe({
        next: componentMessages => {
          this.componentMessages = componentMessages;
        }
      })

    }
  removeAllSessions(){
      this.authService.removeAllSessions();
  }
  ngOnDestroy(): void {
      this.authMessagesSub?.unsubscribe();
  }

}
