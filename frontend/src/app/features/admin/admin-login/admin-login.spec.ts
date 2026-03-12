import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { AdminLogin } from './admin-login';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminLoginComponent', () => {
  let component: AdminLogin;
  let fixture: ComponentFixture<AdminLogin>;

  const authServiceMock = {
    adminLogin: (_email: string, _password: string) => of({})
  };

  const routerMock = {
    navigate: (_commands: string[]) => {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});