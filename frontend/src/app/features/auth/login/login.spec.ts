import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
    vi.clearAllMocks(); // Limpia llamadas previas

    await TestBed.configureTestingModule({
      // Importamos ReactiveFormsModule para que no falle el loginForm
      imports: [LoginComponent, ReactiveFormsModule], 
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

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

    component.loginForm.setValue({
      email: 'efra@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Credenciales incorrectas');
  });
});