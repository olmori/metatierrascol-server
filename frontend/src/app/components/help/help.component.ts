import { Component } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { ShowForRolesDirective } from '../../directives/show-for-roles.directive';
import { ShowForRolesService } from '../../services/show-for-roles.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [FooterComponent, HeaderComponent, ShowForRolesDirective],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss'
})
export class HelpComponent {

constructor(public showForRolesService: ShowForRolesService){}

showForRoles(templateName:string):string[]{
  return this.showForRolesService.getAllowedRoles(templateName);
}
}
