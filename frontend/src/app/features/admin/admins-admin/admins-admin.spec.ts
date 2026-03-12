import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminsAdminComponent } from './admins-admin';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminsAdminComponent', () => {
  let component: AdminsAdminComponent;
  let fixture: ComponentFixture<AdminsAdminComponent>;

  const adminServiceMock = {
    getAdmins: () => of([]),
    createAdmin: (_data: any) => of({}),
    updateAdmin: (_id: string, _data: any) => of({}),
    deleteAdmin: (_id: string) => of({})
  };

  const authServiceMock = {
    getUser: () => ({
      _id: '1',
      name: 'Super',
      email: 'super@test.com',
      role: 'superadmin'
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminsAdminComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});