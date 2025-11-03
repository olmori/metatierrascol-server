import {FormGroup, ValidationErrors} from '@angular/forms';


/*
export function getFormValidationErrors(form: FormGroup) {

    const result: any[] = [];
    Object.keys(form.controls).forEach(key => {
  
      const controlErrors: ValidationErrors = form.get(key).errors;
      if (controlErrors) {
        Object.keys(controlErrors).forEach(keyError => {
          result.push({
            'control': key,
            'error': keyError,
            'value': controlErrors[keyError]
          });
        });
      }
    });
  
    return result;
  }
*/
/**
 * Transform the month number in a month name
 * Receives the month number in a string
 * accepts '01' or '1' for January
 */
export function monthNumberToMonthName(monthNumber: string): string {
  const month = Number(monthNumber);
  switch (month) {
    case 1: return 'January';
    case 2: return 'February';
    case 3: return 'March';
    case 4: return 'April';
    case 5: return 'May';
    case 6: return 'June';
    case 7: return 'July';
    case 8: return 'August';
    case 9: return 'September';
    case 10: return 'October';
    case 11: return 'November';
    case 12: return 'December';
  }
  return '';
}

export function urlPattern(): string {
  return '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';
}

export function getTime(displayAM_PM:boolean = false):string {
    var str = "";
    var currentTime: Date = new Date();
    var hours: number = currentTime.getHours();
    var minutes: number = currentTime.getMinutes();
    var seconds: number = currentTime.getSeconds();

    var hours_str:string;
    var minutes_str:string;
    var seconds_str:string;
    var str:string="";

    if (minutes < 10) {
        minutes_str = "0" + minutes.toString();
    }
    if (seconds < 10) {
        seconds_str = "0" + seconds.toString();
    }
    str += hours.toString() + ":" + minutes + ":" + seconds + " ";
    if (displayAM_PM){
        if(hours > 11){
            str += "PM";
        } else {
            str += "AM";
        }
    }
    return str;
}

/**
* Returns a timestamp. It is the equivalent to now() in other languages
* @method ahora
* @return Timestamp: Sun Feb 26 2017 15:31:12 GMT+0100 (CET)
*/
export function getNow(){
	var f = new Date();
	var year = f.getFullYear();
	var month = f.getMonth();
	var day = f.getDate()
	var hours = f.getHours();
	var minutes = f.getMinutes();
	var seconds = f.getSeconds();
	var milliseconds = f.getMilliseconds();
	var d = new Date(year, month, day, hours, minutes, seconds, milliseconds);
	return d;
}

export function reverseArray(a: any[]) {
    const b: any[] = [];
    a.forEach(v => {
      b.unshift(v);
    });
    return b;
  }

export function arrayMove(arr: any[], old_index: number, new_index: number) {
    // returns [2, 1, 3]
    // console.log(array_move([1, 2, 3], 0, 1)); 
    if (new_index > arr.length) {
        new_index = arr.length;
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
}

export function deleteObjectsFromArray(myArray: any[], elements: any[]) {
  elements.forEach( element => {
    const index = myArray.indexOf(element, 0);
    if (index > -1) {myArray.splice(index, 1);}
  });
}

export function isObjectInArray(arrayObj: any[], obj: any): boolean {
  if (typeof arrayObj === 'undefined'){return false;}
  const n = arrayObj.indexOf(obj);
  if (n==-1){
    return false;
  }else{
    return true;
  }
}

//var boolValue = getBoolean('true'); //returns true
export function getBoolean(value: any): boolean{
   switch(value){
        case true: return true;
        case "true": return true;
        case 1: return true;
        case "1": return true;
        case "on": return true;
        case "yes":return true;
        default: 
            return false;
    }
    return false;
}
export function isAnyOfTheseValuesInArray(searchArray: any[], valuesArray:any[] | undefined){
  if (valuesArray == undefined){return false}
  
  var itIs=false;
  for (let v of valuesArray){
    if (isObjectInArray(searchArray,v)){
      itIs=true;
      break;
    }
  }
  return itIs;
}

export function formGroupToFormData(formGroup:FormGroup):FormData{
  /**NO tested
   * 
   */
    var formData = new FormData()
    Object.entries(formGroup).forEach(
      ([key, value]) => {
        formData.append(key,value);
      }
    );
    console.log(formData)
    return formData
}

export function isNumeric(maybeNumber:string):boolean{
  return !isNaN(+maybeNumber)
}

export function isStringInArrayOfStrings(searchString:string, arrayOfStrings:string[]):boolean {
  const index = arrayOfStrings.indexOf(searchString);
  if (index > -1) { 
    return true;
  } else { 
    return false 
  }
}



function delay(ms: number) {
  //Use like this:
  //await delay(1000);
  return new Promise( resolve => setTimeout(resolve, ms) );
}