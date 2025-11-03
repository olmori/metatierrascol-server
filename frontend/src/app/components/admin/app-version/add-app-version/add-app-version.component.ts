import { Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';

import { FormControl } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";

import { ComponentMessageComponent } from '../../../messages/component-message/component-message.component';
import { GlobalMessageService } from '../../../../services/global-message.service';
import { manageServerErrors, sendMessages } from '../../../../utilities/manageMessages';

import { Message } from '../../../../models/message';
import { StateEnum } from '../../../../enumerations/stateEnum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../services/data.service';
import { MatTooltip } from '@angular/material/tooltip';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject } from 'rxjs';
import { MobileAppVersionModel } from '../../../../models/mobileAppVersionModel';

@Component({
  selector: 'app-upload-app-version',
  standalone: true,
  imports: [ComponentMessageComponent, CommonModule,
    MatInputModule, MatButtonModule, ReactiveFormsModule, MatTooltip,
    MatProgressBarModule
  ],
  templateUrl: './add-app-version.component.html',
  styleUrl: './add-app-version.component.scss'
})
export class AddAppVersionComponent implements OnDestroy{

  subUploadedAppVersion = new Subject<MobileAppVersionModel>()

  @ViewChild('fileNameParagraph') fileNameParagraph: ElementRef = {} as ElementRef;
  filenameParagraphClass = 'red';
  file: File | null = null

  versionNumber = -1;
  uploadProgress = 1;

  controlsGroup = new FormGroup({});
  controlNames: string[];

  componentMessages:Message[]=[];

  version = new FormControl('', [Validators.required]);


  constructor(private dataService:DataService, 
    private globalMessageService: GlobalMessageService,
    private matSnackBar:MatSnackBar
  ){
    this.controlNames=['note0']
    this.controlsGroup.addControl('note0',new FormControl('',[Validators.required]));
    this.controlsGroup.addControl('fileNameInput',new FormControl('',[Validators.required]));
    this.controlsGroup.addControl('appVersion',new FormControl('',[Validators.required]));  
    this.controlsGroup.addControl('file',new FormControl(null));

    this.subUploadedAppVersion.subscribe({
      next: (mapvm:MobileAppVersionModel) => {
        this.sendNotes(mapvm);
        /**
         response = {
        "ok": true,
        "mensaje": "Versión guardada exitosamente (2.852149 mb). Número de versión 1.0",
        "data": [
            {
                "id": 1,
                "version": 1.0,
                "url_descarga": "http://localhost:8000/mobileappversion/mobile_app_version/download_version/1.0/",
                "filename": "mobileappversion/1.0.apk",
                "publicar": false,
                "fecha": "2024-07-11T20:38:19.094210Z",
                "creado_por": 1
            }
          ],
        "error": []
        }
        */
  //      this.versionNumber = response.data[0].version;
  //      this.componentMessages = sendMessages(StateEnum.success,response.message,this.globalMessageService, this.matSnackBar);
        
    },
    error:error=>{
      this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
    }

    })
  }

  onFileInput(files: FileList | null): void {
    if (files == null){
      return;
    }else{
      if (files.length>0) {
        this.uploadProgress =-1;
        this.componentMessages=[];
        this.file = files.item(0);
        this.fileNameParagraph.nativeElement.innerHTML=this.file!.name;
        this.controlsGroup.patchValue({fileNameInput: this.file!.name})
      }
    }
  }

  getFilenameParagraphClass():String{
    var className:String;
    this.file?  className= 'blue' :  className = 'red';
    return className
  }
  addnote(){
    let controlName = 'note' + this.controlNames.length.toString()
    this.controlNames.push(controlName)
    this.controlsGroup.addControl(controlName, new FormControl('', Validators.required));
  }
  removeNote(){
    let index = this.controlNames.length-1
    let controlName = this.controlNames[index];
    this.controlNames.pop();
    console.log(index, controlName)
    this.controlsGroup.removeControl(controlName)
  }
  send(){
    var formData = new FormData();
    formData.append('archivo', this.file!);
    formData.append('version', this.controlsGroup.get('appVersion')?.value!)

    //THIS WORKS WITHOUT OBSERVING THE RESPONSES
    //this.dataService.postUpload('mobileappversion/mobile_app_version/',formData).subscribe({
    //  next: (response:any) => {
          /**
           * {
          "ok": true,
          "mensaje": "Versión guardada exitosamente (2.852149 mb). Número de versión 1.0",
          "data": [
              {
                  "id": 1,
                  "version": 1.0,
                  "url_descarga": "http://localhost:8000/mobileappversion/mobile_app_version/download_version/1.0/",
                  "filename": "mobileappversion/1.0.apk",
                  "publicar": false,
                  "fecha": "2024-07-11T20:38:19.094210Z",
                  "creado_por": 1
              }
            ],
          "error": []
          }
          */
    //      this.versionNumber = response.data[0].version;
    //      this.componentMessages = sendMessages(StateEnum.success,response.message,this.globalMessageService, this.matSnackBar);
    //  },
    //  error:error=>{
    //    this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
    //  }
    //})
    
    this.dataService.postUpload('mobileappversion/mobile_app_version/',formData).subscribe(event => {
      switch (event.type) {
        case HttpEventType.UploadProgress:
          console.log('Uploaded ' + event.loaded + ' out of ' + event.total + ' bytes');
          this.uploadProgress = Math.round(100 * event.loaded / event.total!);
          break;
        case HttpEventType.Response:
          let body:any = event.body;
          var mobileAppVersionModel = body.data[0] as MobileAppVersionModel
          this.versionNumber = body.data[0].version
          this.componentMessages = sendMessages(StateEnum.success,body.message,this.globalMessageService, this.matSnackBar);
          this.subUploadedAppVersion.next(mobileAppVersionModel);
          break;
      }
    }, 
    (error: HttpErrorResponse) => {
      this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
    });
  }
  getNotes(){
    return Object.entries(this.controlsGroup)
  }

  sendNotes(mavm:MobileAppVersionModel){
    console.log(mavm)
    var values = this.controlsGroup.value;
    console.log(values);
    Object.entries(values).forEach(
      ([key, value]) => {
        if (key.includes('note')){
          this.componentMessages.push(sendMessages(StateEnum.info,'Enviando la nota: ' + key,this.globalMessageService)[0])
          this.dataService.post('mobileappversion/mobile_app_version_notes/',{'mobileappversion':mavm.id,'nota':value}).subscribe({
              next: (response:any) => {
                //console.log(response)
                this.componentMessages=this.componentMessages.concat(sendMessages(StateEnum.success,"Nota " + key + " añadida correctamente",this.globalMessageService));
              },
              error:error=>{
                this.componentMessages=this.componentMessages.concat(manageServerErrors(error,this.globalMessageService,this.matSnackBar));
              }
            })
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.subUploadedAppVersion.unsubscribe();
  }
}

