import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login'; 
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  // Definimos mocks usando vi.fn() de Vitest
  const authServiceMock = {
    login: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
<<<<<<< HEAD
    vi.clearAllMocks(); // Limpia llamadas previas

=======
>>>>>>> 50e9c02f3e2a8ccb163b720906f9a573c5860c26
    await TestBed.configureTestingModule({
      // Importamos ReactiveFormsModule para que no falle el loginForm
      imports: [LoginComponent, ReactiveFormsModule], 
      providers: [
        { provide: AuthService, useValue: authServiceMock as any },
        { provide: Router, useValue: routerMock as any }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

<<<<<<< HEAD
  it('should login and navigate to perfil', () => {
    authServiceMock.login.mockReturnValue(of({}));

    component.loginForm.setValue({
      email: 'efra@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('efra@gmail.com', '123456');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/perfil']);
  });

  it('should set errorMessage on login error', () => {
    // Simulación de error con Vitest
    authServiceMock.login.mockReturnValue(
      throwError(() => ({ error: { error: 'Credenciales incorrectas' } }))
    );
=======
  it('should have login form with email and password controls', () => {
    expect(component.loginForm.contains('email')).toBe(true);
    expect(component.loginForm.contains('password')).toBe(true);
  });

  it('should be invalid when form is empty', () => {
    component.loginForm.setValue({
      email: '',
      password: ''
    });
>>>>>>> 50e9c02f3e2a8ccb163b720906f9a573c5860c26

    expect(component.loginForm.invalid).toBe(true);
  });

  it('should be valid when form has correct values', () => {
    component.loginForm.setValue({
      email: 'efra@gmail.com',
      password: '123456'
    });

    expect(component.loginForm.valid).toBe(true);
  });
});