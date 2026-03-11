import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsAdmin } from './notifications-admin';

describe('NotificationsAdmin', () => {
  let component: NotificationsAdmin;
  let fixture: ComponentFixture<NotificationsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
