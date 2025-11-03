import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SimpleAuthService } from '../services/simple-auth.service';

export const simpleAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(SimpleAuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();

  console.log('🔒 SimpleAuthGuard - Verificando acceso a:', state.url);
  console.log('🔒 SimpleAuthGuard - Usuario autenticado:', isLoggedIn);

  if (isLoggedIn) {
    return true;
  } else {
    console.warn('⚠️ Acceso denegado. Redirigiendo a /home');
    return router.createUrlTree(['/home']);
  }
};
