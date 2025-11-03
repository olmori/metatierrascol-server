import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, catchError, takeWhile } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models/loginResponse';

export interface SimpleUser {
  username: string;
  loginTime: Date;
  token?: string;
  groups?: string[];
  expiresAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleAuthService {
  private currentUserSubject = new BehaviorSubject<SimpleUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly TOKEN_EXPIRY_HOURS = 24; // Token expira en 24 horas

  constructor(
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
    this.startTokenExpiryCheck();
  }

  private loadUserFromStorage(): void {
    const token = sessionStorage.getItem('auth_token');
    const username = sessionStorage.getItem('auth_username');
    const groups = sessionStorage.getItem('auth_groups');
    const expiresAt = sessionStorage.getItem('auth_expires_at');

    if (token && username && expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();

      // Verificar si el token ha expirado
      if (expiryDate > now) {
        const user: SimpleUser = {
          username: username,
          loginTime: new Date(),
          token: token,
          groups: groups ? JSON.parse(groups) : [],
          expiresAt: expiryDate
        };
        this.currentUserSubject.next(user);
        console.log('✅ Sesión restaurada desde sessionStorage:', username);
        console.log('⏰ Token expira en:', expiryDate.toLocaleString());
      } else {
        console.warn('⚠️ Token expirado, limpiando sesión...');
        this.handleTokenExpiry();
      }
    }
  }

  /**
   * Inicia verificación periódica de expiración del token (cada minuto)
   */
  private startTokenExpiryCheck(): void {
    interval(60000) // Verificar cada 60 segundos
      .pipe(
        takeWhile(() => true) // Siempre activo mientras el servicio exista
      )
      .subscribe(() => {
        const user = this.currentUserSubject.value;
        if (user && user.expiresAt) {
          const now = new Date();
          if (user.expiresAt <= now) {
            console.warn('⏰ Token expirado, cerrando sesión automáticamente...');
            this.handleTokenExpiry();
          }
        }
      });
  }

  /**
   * Maneja la expiración del token
   */
  private handleTokenExpiry(): void {
    // Limpiar sessionStorage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_username');
    sessionStorage.removeItem('auth_groups');
    sessionStorage.removeItem('auth_expires_at');

    // Limpiar capas activas
    localStorage.removeItem('active-layers');

    // Limpiar estado
    this.currentUserSubject.next(null);

    // Redirigir a home
    this.router.navigate(['/home']);
    console.log('🏠 Redirigido a /home por expiración de token');
  }

  login(username: string, password: string): Observable<boolean> {
    return this.httpClient.post<LoginResponse>(
      `${environment.authApiUrl}core/knox/login/`,
      { username, password }
    ).pipe(
      map(response => {
        console.log('🔑 Login exitoso, guardando token en sessionStorage...');

        // Calcular fecha de expiración (24 horas desde ahora)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

        // Guardar token en sessionStorage (persiste en refresh, se elimina al cerrar navegador)
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('auth_username', response.username);
        sessionStorage.setItem('auth_expires_at', expiresAt.toISOString());

        if (response.groups) {
          sessionStorage.setItem('auth_groups', JSON.stringify(response.groups));
        }

        console.log('💾 Token guardado en sessionStorage:', response.token.substring(0, 20) + '...');
        console.log('⏰ Token expirará en:', expiresAt.toLocaleString());

        // Verificar que se guardó correctamente
        const savedToken = sessionStorage.getItem('auth_token');
        if (savedToken) {
          console.log('✅ sessionStorage verificado exitosamente:', savedToken.substring(0, 20) + '...');
        } else {
          console.error('❌ ERROR: sessionStorage no se guardó correctamente');
        }

        // Crear usuario y actualizar estado
        const user: SimpleUser = {
          username: response.username,
          loginTime: new Date(),
          token: response.token,
          groups: response.groups,
          expiresAt: expiresAt
        };

        this.currentUserSubject.next(user);
        console.log('👤 Usuario actualizado:', user.username);
        return true;
      }),
      catchError(error => {
        console.error('❌ Login error:', error);
        return of(false);
      })
    );
  }

  logout(): void {
    console.log('🔒 Cerrando sesión...');

    // Limpiar sessionStorage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_username');
    sessionStorage.removeItem('auth_groups');
    sessionStorage.removeItem('auth_expires_at');

    // Limpiar capas activas del localStorage al cerrar sesión
    localStorage.removeItem('active-layers');
    // Limpiar geojson uploads
    localStorage.removeItem('geojson-uploads');

    // Limpiar estado
    this.currentUserSubject.next(null);
    console.log('✅ Sesión cerrada y almacenamiento limpiado');

    // Redirigir a home
    this.router.navigate(['/home']);
    console.log('🏠 Redirigido a /home');
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): SimpleUser | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return sessionStorage.getItem('auth_token') || null;
  }
}
