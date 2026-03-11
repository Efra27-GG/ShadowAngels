import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminsAdmin } from './admins-admin';

describe('AdminsAdmin', () => {
  let component: AdminsAdmin;
  let fixture: ComponentFixture<AdminsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminsAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
