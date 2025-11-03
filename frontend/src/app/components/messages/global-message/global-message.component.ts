import { Component } from '@angular/core';
import { GlobalMessageService } from '../../../services/global-message.service';
import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';

@Component({
  selector: 'app-global-message',
  standalone: true,
  imports: [],
  templateUrl: './global-message.component.html',
  styleUrl: './global-message.component.scss'
})
export class GlobalMessageComponent {
  constructor(private globalMessageService:GlobalMessageService){
  }
  getMessages(){return this.globalMessageService.messages}
}
