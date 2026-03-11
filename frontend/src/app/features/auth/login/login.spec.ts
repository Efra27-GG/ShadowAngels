import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const authServiceMock = {
    login: (_email: string, _password: string) => of({})
  };

  const routerMock = {
    navigate: (_commands: string[]) => {}
  };

  beforeEach(async () => {
    spyOn(authServiceMock, 'login').and.returnValue(of({}));
    spyOn(routerMock, 'navigate');

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
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
    component.loginForm.setValue({
      email: 'efra@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('efra@gmail.com', '123456');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/perfil']);
  });

  it('should set errorMessage on login error', () => {
    (authServiceMock.login as any).and.returnValue(
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