import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';

import { Message } from '../models/message';
import { MatSnackBar } from '@angular/material/snack-bar';

import { GlobalMessageService } from '../services/global-message.service';
import { StateEnum } from '../enumerations/stateEnum';

export function sendMessages(status: StateEnum, message:string, messageService: GlobalMessageService, snackBar?: MatSnackBar): Message[]{ 
  var m = new Message(status, message);
  messageService.add(m);
  if (!(snackBar === undefined)){
    snackBar.open(message, 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
  }
  if (isDevMode()){console.log(message)}
  return [m]
}

export function manageServerSucessMessages(response: any, messageService: GlobalMessageService, snackBar?: MatSnackBar):Message[]{
  var messages:Message[]=[];
  for (let key in response) {
    if (Array.isArray(response[key])){
      var arrayMensajes:string[] = response[key];
      arrayMensajes.forEach( mens =>{
          var message=new Message(StateEnum.success,'Éxito: ' + key + ': ' + mens);
          messages.push(messageService.add(message));
          if (!(snackBar === undefined)){
            snackBar.open('Éxito: ' + key + ': ' + mens, 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
          }
        });
    }else{
      if (typeof response[key] === 'string' || response[key] instanceof String){
        var message=new Message(StateEnum.success,'Éxito: ' + key + ': ' + response[key]);
          messages.push(messageService.add(message));
          if (!(snackBar === undefined)){
            snackBar.open('Éxito: ' + key + ': ' + response[key], 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
          }
      }
    }
  }
  return messages;
}

export function manageServerErrors(error: HttpErrorResponse, messageService: GlobalMessageService, snackBar?: MatSnackBar):Message[]{
  if (error.status === 0) {
    sendMessages(StateEnum.error,'Error de red, o servidor no disponible',messageService,snackBar);
    return [new Message(StateEnum.error,'Error de red, o servidor no disponible')];
  }
  if (error.status === 401) {
    sendMessages(StateEnum.error,'Token inválido. Debe iniciar sesión',messageService,snackBar);
    return [new Message(StateEnum.error,'Token inválido. Debe iniciar sesión')];
  }
  if (error.status==404){
    sendMessages(StateEnum.error,'Dirección url no encontrada',messageService,snackBar);
    return [new Message(StateEnum.error,'Dirección url no encontrada')];
  }
  if (error.status==500){
    sendMessages(StateEnum.error,'Error interno. El administrador recibió un email e intentará resolver el problema',messageService,snackBar);
    return [new Message(StateEnum.error,'Error interno. El administrador recibió un email e intentará resolver el problema')];
  }
  if (error.status>500){
    sendMessages(StateEnum.error, 'El servidor no está disponible',messageService,snackBar);
    return [new Message(StateEnum.error,'El servidor no está disponible')];
  }
  return showDRFerrorMessages(error, messageService, snackBar);
}

export function showDRFerrorMessages(error: HttpErrorResponse, messageService: GlobalMessageService, snackBar?: MatSnackBar):Message[]{
  var err = error.error;
  var messages:Message[]=[];

  for (let key in err) {
    if (Array.isArray(err[key])){
      var arrayMensajes:string[] = err[key];
      arrayMensajes.forEach( mens =>{
          var message=new Message(StateEnum.error,'Error: ' + key + ': ' + mens);
          messages.push(messageService.add(message));
          if (!(snackBar === undefined)){
            snackBar.open('Error: ' + key + ': ' + mens, 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
          }
        });
    }else{
      if (typeof err[key] === 'string' || err[key] instanceof String){
        var message=new Message(StateEnum.error,'Error: ' + key + ': ' + err[key]);
        messages.push(messageService.add(message));
        if (!(snackBar === undefined)){
          snackBar.open('Error: ' + key + ': ' + err[key], 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
        }
      }else{
        var obj = err[key];
        for (let key2 in obj) {
          if (Array.isArray(obj[key2])){
            var arrayMensajes:string[] = obj[key2];
            arrayMensajes.forEach( mens =>{
                var message=new Message(StateEnum.error,'Error: ' + key2 + ': ' + mens);
                messages.push(messageService.add(message));
                if (!(snackBar === undefined)){
                  snackBar.open('Error: ' + key2 + ': ' + mens, 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
                }
              });
          }else{
            if (typeof obj[key2] === 'string' || obj[key2] instanceof String){
              var message=new Message(StateEnum.error,'Error: ' + key2 + ': ' + obj[key2]);
              messages.push(messageService.add(message));
              if (!(snackBar === undefined)){
                snackBar.open('Error: ' + key2 + ': ' + obj[key2], 'Cerrar', { duration: 3000, verticalPosition: 'bottom' });
              }
            }//
          }
        }//for
      }
    }//else
  }//for
  return messages;
}

