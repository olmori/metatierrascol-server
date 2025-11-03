import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { isAnyOfTheseValuesInArray } from '../utilities/general';

export const belongsToGroupGuard: CanActivateFn = (route, state) => {
  /**
   * Checks if the user belongs to any of the groups in allowedGroups.
   * allowedGroups is set as a parameter in app.routes.ts
   */
  var router: Router = inject(Router);
  const allowedGroups = route.data?.['allowedGroups'];
  var authService: AuthService = inject(AuthService);
  const belongs = isAnyOfTheseValuesInArray(authService.authUserModel.groups,allowedGroups);
  if (belongs){
    return belongs;
  }else{
    return router.createUrlTree(['',{outlets: {right_sidenav:['you_dont_have_permission'] }}]);
  }
};
