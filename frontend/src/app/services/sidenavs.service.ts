import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav'
@Injectable({
  providedIn: 'root'
})
export class SidenavsService {
  appDrawerLeft: MatDrawer = {} as MatDrawer;
  appDrawerRight: MatDrawer = {} as MatDrawer;
  constructor() { }
  setAppDrawerLeft(appDrawerLeft:MatDrawer){
    this.appDrawerLeft = appDrawerLeft;
  }
  setAppDrawerRight(appDrawerRight:MatDrawer){
    this.appDrawerRight = appDrawerRight;
  }
  toggleAppDrawerLeft(){
    this.appDrawerLeft.toggle();
    if (this.appDrawerLeft.opened){this.appDrawerRight.close()}
  }
  toggleAppDrawerRight(){
    this.appDrawerRight.toggle();
    if (this.appDrawerRight.opened){this.appDrawerLeft.close()}
  }
  closeAppSidenavRight(){
    this.appDrawerRight.close();
  }
  closeAppSidenavLeft(){
    this.appDrawerLeft.close();
  }  
}
