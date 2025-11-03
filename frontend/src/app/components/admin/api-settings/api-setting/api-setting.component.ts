import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { SettingModel } from '../../../../models/settingModel';
import { Message } from '../../../../models/message';
import { ComponentMessageComponent } from '../../../messages/component-message/component-message.component';
import { DataService } from '../../../../services/data.service';
import { GlobalMessageService } from '../../../../services/global-message.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { isNumeric } from '../../../../utilities/general';
import { manageServerErrors, sendMessages } from '../../../../utilities/manageMessages';
import { StateEnum } from '../../../../enumerations/stateEnum';

@Component({
  selector: 'app-api-setting',
  standalone: true,
  imports: [ComponentMessageComponent,MatInputModule, MatButtonModule, ReactiveFormsModule,
    CommonModule],
  templateUrl: './api-setting.component.html',
  styleUrl: './api-setting.component.scss'
})
export class ApiSettingComponent implements OnInit{
  @Input() setting: SettingModel = new SettingModel(-1,'','','','');
  componentMessages:Message[]=[];

  parameter_value = new FormControl('', [Validators.required]);
  
  controlsGroup = new FormGroup({
    parameter_value: this.parameter_value
  })

  constructor(public dataService: DataService, public globalMessageService: GlobalMessageService,
    public matSnackBar: MatSnackBar
  ){}

  changeSetting(){
    this.componentMessages=[];
    var value = this.parameter_value.value?.toLowerCase();
    let isTrue: boolean = value === 'true';
    let isFalse: boolean = value === 'false';
    let isNum: boolean = isNumeric(value!);

    if (!isTrue){
      if (!isFalse){
        if (!isNum){
          this.componentMessages=sendMessages(StateEnum.error,'El valor debe ser True, False, o un número entero',this.globalMessageService)
        }  
      }
    }
    this.dataService.patch('core/app_settings/' + this.setting.id.toString() + '/',this.controlsGroup.value).subscribe({
      next: response => {
        var setting:SettingModel = response as SettingModel;
        this.componentMessages=sendMessages(StateEnum.success,
          'Configuración actualizada: ' + setting.parameter_name + " = " + setting.parameter_value,
          this.globalMessageService);
          this.setting.parameter_value = value!;       
      },
      error:error=>{
        this.componentMessages=manageServerErrors(error,this.globalMessageService,this.matSnackBar);
      }
    });
  }
  ngOnInit(): void {
    this.parameter_value.setValue(this.setting.parameter_value);
  }
}
