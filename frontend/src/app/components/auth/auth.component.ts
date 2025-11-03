import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { SimpleAuthService } from '../../services/simple-auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <h2 mat-dialog-title>Iniciar Sesión</h2>

      <mat-dialog-content>
        <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Usuario</mat-label>
            <input matInput
                   type="text"
                   formControlName="username"
                   placeholder="Ingrese su usuario">
            <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
              El usuario es requerido
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input matInput
                   [type]="hidePassword ? 'password' : 'text'"
                   formControlName="password">
            <button mat-icon-button
                    matSuffix
                    (click)="hidePassword = !hidePassword"
                    type="button">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
              La contraseña es requerida
            </mat-error>
          </mat-form-field>

          <div class="form-actions">
            <button mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="loginForm.invalid || isLoading">
              <mat-icon>login</mat-icon>
              {{ isLoading ? 'Iniciando...' : 'Iniciar Sesión' }}
            </button>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancelar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .auth-container {
      width: 400px;
      max-width: 90vw;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class AuthComponent implements OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  private loginSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: SimpleAuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AuthComponent>
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;

      this.loginSubscription = this.authService.login(username, password).subscribe({
        next: (success) => {
          this.isLoading = false;

          if (success) {
            const currentUser = this.authService.getCurrentUser();
            this.snackBar.open(
              `¡Bienvenido, ${currentUser?.username}!`,
              'Cerrar',
              {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top'
              }
            );
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(
              'Error al iniciar sesión. Verifique sus credenciales.',
              'Cerrar',
              {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top'
              }
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            'Error de conexión. Intente nuevamente.',
            'Cerrar',
            {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }
          );
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }
}
