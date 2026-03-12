import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
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

  it('should have login form with email and password controls', () => {
    expect(component.loginForm.contains('email')).toBe(true);
    expect(component.loginForm.contains('password')).toBe(true);
  });

  it('should be invalid when form is empty', () => {
    component.loginForm.setValue({
      email: '',
      password: ''
    });

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