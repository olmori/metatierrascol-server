import { Component } from '@angular/core';
import { MessageService } from '../../../services/global-message.service';
import { Message } from '../../../models/message';
import { StateEnum } from '../../../enumerations/stateEnum';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  constructor(private messageService:MessageService){
    this.messageService.add(new Message(StateEnum.success,'Prueba1'));
    this.messageService.add(new Message(StateEnum.info,'Prueba2'));
    this.messageService.add(new Message(StateEnum.error,'Prueba3'));
  }
  getMessages(){return this.messageService.messages}
}
