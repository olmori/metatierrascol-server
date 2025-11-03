import { StateEnum } from '../enumerations/stateEnum';
import { getTime } from '../utilities/general';

export class Message {
  public id:number=0;
  public ok: boolean=false;
  public message: string="";
  public state: StateEnum=StateEnum.error;
  public time: string="";
  
  constructor(stateType:StateEnum, message: string, id=0) {
    this.message = message;
    this.time = getTime();
    this.state = stateType;
    this.id =id;

    switch(stateType){
      case StateEnum.success:
        this.ok=true;
        break;
      case StateEnum.info:
        this.ok=true;
        break;
      case StateEnum.error:
        this.ok=false;
        break;
      default:
    }
  }
}
