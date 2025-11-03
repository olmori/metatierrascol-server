import { CanActivateFn, Router} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';


export const isLoggedInGuard: CanActivateFn = (route, state) => {
  var authService: AuthService = inject(AuthService);
  var router: Router = inject(Router);
  const isLoggedIn=authService.authUserModel.isLoggedIn;
  console.log('isLoggedIn',isLoggedIn)
  if (isLoggedIn){
    return isLoggedIn;
  }else{
    return router.createUrlTree(['',{outlets: {right_sidenav:['you_dont_have_permission'] }}]);
  }
};
