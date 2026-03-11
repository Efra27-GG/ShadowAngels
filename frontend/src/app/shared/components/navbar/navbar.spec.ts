declare const jasmine: any;

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../../core/services/auth.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  const authServiceMock = {
    getUser: jasmine.createSpy('getUser').and.returnValue(null),
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
    logout: jasmine.createSpy('logout')
  };

  const routerMock = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return false when user is not logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    expect(component.isLoggedIn).toBe(false);
  });

  it('should return true when user is admin', () => {
    authServiceMock.getUser.and.returnValue({
      _id: '1',
      name: 'Admin',
      email: 'admin@test.com',
      role: 'admin'
    });

    expect(component.isAdmin).toBe(true);
  });

  it('should call logout and navigate to login', () => {
    component.logout();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});