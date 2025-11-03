import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import { MatToolbarModule} from '@angular/material/toolbar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';
import { SimpleAuthService, SimpleUser } from './services/simple-auth.service';
import { SidenavsService } from './services/sidenavs.service';
import { ShowForRolesDirective } from './directives/show-for-roles.directive';
import { ShowForRolesService } from './services/show-for-roles.service';
import { AuthUserModel } from './models/authUserModel';
import { GlobalMessageComponent } from './components/messages/global-message/global-message.component';
import { AuthComponent } from './components/auth/auth.component';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatNavList } from '@angular/material/list';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RouterLink,RouterLinkActive, 
    MatToolbarModule, MatSidenavModule, MatIconModule,
    ShowForRolesDirective, GlobalMessageComponent, MatTooltipModule, MatMenu, 
    MatMenuModule, MatNavList, MatDialogModule, MatButtonModule, CommonModule
    ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit{
  title = 'metatierrascol-web';
  showMessages=false;
  @ViewChild('appDrawerLeft') appDrawerLeft: MatDrawer = {} as MatDrawer;
  // @ViewChild('appDrawerRight') appDrawerRight: MatDrawer = {} as MatDrawer;

  authUserModel:AuthUserModel = new AuthUserModel('',new Date('1500/01/01'),[],'');
  currentUser: SimpleUser | null = null;

  constructor (private authService: AuthService, private simpleAuthService: SimpleAuthService,
    private sidenavsService: SidenavsService, private showForRolesService: ShowForRolesService,
    private dialog: MatDialog){

    authService.authUserSubject.subscribe({
      next: (value) => {
        this.authUserModel=value;
      }
    })
    authService.isValidToken();

    // Subscribe to simple auth service
    this.simpleAuthService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
      }
    });
  }
  toggleAppDrawerLeft(){
    this.sidenavsService.toggleAppDrawerLeft();
  }
  // toggleAppDrawerRight(){
  //   this.sidenavsService.toggleAppDrawerRight();
  // }
  // toggleShowMessages(){
  //   this.showMessages=!this.showMessages;
  // }

  getAllowedRoles(elementTemplateName:string):string[]{
    return this.showForRolesService.getAllowedRoles(elementTemplateName);
  }

  ngAfterViewInit(): void {
    /**
     * After the view is completed I can get the elements
     * and put them into the service, in order to be
     * available for the rest of the components
     */
    this.sidenavsService.setAppDrawerLeft(this.appDrawerLeft);
    // this.sidenavsService.setAppDrawerRight(this.appDrawerRight);
  }
  navigateToAdmin(){
    let url= environment.apiUrl + 'admin/'
    window.open(url,'_blank');
  }

  // Simple Auth methods
  openAuthDialog() {
    const dialogRef = this.dialog.open(AuthComponent, {
      width: '450px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User logged in successfully');
      }
    });
  }

  logout() {
    this.simpleAuthService.logout();
  }

  isSimpleAuthLoggedIn(): boolean {
    return this.simpleAuthService.isLoggedIn();
  }
}
