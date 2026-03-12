import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { RegisterComponent } from './register';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  const authServiceMock = {
    register: (_name: string, _email: string, _password: string) => of({})
  };

  const routerMock = {
    navigate: (_commands: string[]) => {}
  };

  beforeEach(async () => {
    spyOn(authServiceMock, 'register').and.returnValue(of({}));
    spyOn(routerMock, 'navigate');

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register user', () => {
    component.registerForm.setValue({
      name: 'Efra',
      email: 'efra@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith('Efra', 'efra@gmail.com', '123456');
  });

  it('should set errorMessage on register error', () => {
    (authServiceMock.register as any).and.returnValue(
      throwError(() => ({ error: { error: 'El correo ya está registrado' } }))
    );

    component.registerForm.setValue({
      name: 'Efra',
      email: 'efra@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('El correo ya está registrado');
  });
});