import { Injectable } from '@angular/core';

/**
 * This service keeps, in only one point, who is able to see what in a template.
 * 
 * Returns the list of groups that are able to view a component template
 * element, as a menu element or button.
 * 
 * You must set the the elementTemplateName in the template,
 * in the showForRoles directive. Eg:
 *  <button *showForRoles="showForRoles('admin-menu')" cdkMenuItem ....>Admin</button>
 *        'admin-menu' is the elementTemplateName to show - hide, depending on
 *        the groups, or roles, of the user.
 * 
 * In the component you must have a method called showForRoles:
 *  showForRoles(elementTemplateName): string[]
 *      return this.showForRolesService.getAllowedRoles('app.component', elementTemplateName)
 * 
 * Manually set, in the method 'getAllowedRoles' of this service 
 * the name of the component, template elements name, 
 * and the groups that are able to see the component template object.
 * 
*/
@Injectable({
  providedIn: 'root'
})
export class ShowForRolesService {
  public allowedRoles: string[]=[];
  constructor() { }


/** 
 * @param {string} componentName - the name of the component 
 * @param {string} elementTemplateName - the element template name
 * @returns {string[]} - Eg: ['admin', 'surveyor']
 */
  getAllowedRoles(elementTemplateName:string): string[]{
    switch(elementTemplateName){
        case 'app.component.admin_menu':{return ['admin'];}
        case 'app.component.user_menu':{return ['admin','propietario','agrimensor','ant','gestor_catastral', 'srn', 'igac'];}
        case 'app.version.component.button_publish':{return ['admin'];}
        case 'app.version.component.button_unpublish':{return ['admin'];}
        case 'help.component.user_management':{return ['admin'];}
        case '':{return [];}
        default: {return [];}
    }
  }
}
