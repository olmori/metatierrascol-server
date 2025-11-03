import { Injectable } from '@angular/core';
//MODE:
//  1. Local development
//  2. Production in upvusig
//  3. Production in fff

var MODE = 1;

@Injectable({
  providedIn: 'root'
})
export class AppGlobalVarsService {
  apiUrl = ""
  webUrl = ""
  geoserverUrl = ""
  constructor() { 
    this.setProperties()
  }
  private setProperties(){
    switch ( MODE ) {
      case 1:
          this.apiUrl='http://localhost:8000/'
          this.webUrl='http://localhost:4200/'
          this.geoserverUrl='http://localhost:8080/geoserver/'
          break;
      case 2:
        this.apiUrl='https://metatierrascol.upvusig.car.upv.es/api/'
        this.webUrl='https://metatierrascol.upvusig.car.upv.es/'
        this.geoserverUrl='https://metatierrascol.upvusig.car.upv.es/geoserver/'
        break;
      case 3:
          // statement N
          break;
      default: 
          console.log('Mala appGlobalVarsOption');
          break;
   }
  }
}
