import { Injectable } from '@angular/core';
import {Message} from '../models/message';
 
@Injectable({
  providedIn: 'root',
})
export class GlobalMessageService {
  messagesServiceOpened=false;
  messages: Message[] = [];//all messages

  add(message: Message):Message {
    var id = this.messages.length + 1;
    message.id=id;
    this.messages.unshift(message);
    return message;
  }
  clear() {
    this.messages = [];
  }
}
