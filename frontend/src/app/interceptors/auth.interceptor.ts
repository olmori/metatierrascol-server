import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener token desde sessionStorage
  const token = sessionStorage.getItem('auth_token');

  // Debug logging
  console.log('🔐 Auth Interceptor - URL:', req.url);
  console.log('🔐 Auth Interceptor - Token exists:', !!token);
  if (token) {
    console.log('🔐 Auth Interceptor - Token (first 20 chars):', token.substring(0, 20) + '...');
  }

  // Skip token injection for login endpoint
  if (req.url.includes('/login/')) {
    console.log('⏭️ Skipping token for login endpoint');
    return next(req);
  }

  // If token exists, clone the request and add Authorization header
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`
      }
    });
    console.log('✅ Token added to request from sessionStorage');
    return next(clonedRequest);
  }

  // If no token, proceed with original request
  console.warn('⚠️ No token found, proceeding without authentication');
  return next(req);
};
