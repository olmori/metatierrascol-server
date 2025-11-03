import { Component, Input} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Message } from '../../../models/message';

@Component({
  selector: 'app-component-message',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './component-message.component.html',
  styleUrl: './component-message.component.scss'
})
export class ComponentMessageComponent{
  @Input() componentMessages: Message[]=[];
  constructor(){
  }
}
