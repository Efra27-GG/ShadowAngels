import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationsAdminComponent } from './notifications-admin';
import { AdminService } from '../../../core/services/admin.service';

describe('NotificationsAdminComponent', () => {
  let component: NotificationsAdminComponent;
  let fixture: ComponentFixture<NotificationsAdminComponent>;

  const adminServiceMock = {
    createNotification: (_data: any) => of({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsAdminComponent],
      providers: [{ provide: AdminService, useValue: adminServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});