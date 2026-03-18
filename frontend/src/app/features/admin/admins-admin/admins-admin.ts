import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-admins-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminShellComponent],
  templateUrl: './admins-admin.html',
  styleUrl: './admins-admin.css'
})
export class AdminsAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  admins: any[] = [];
  editingId: string | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';

  get currentUser() {
    return this.authService.getUser();
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['']
  });

  ngOnInit(): void {
    this.updatePasswordValidators();
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.adminService.getAdmins().subscribe({
      next: (resp: any) => {
        this.admins = resp;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los administradores.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Revisa los campos del administrador antes de guardar.';
      this.successMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const payload = this.form.getRawValue();

    if (this.editingId) {
      this.adminService.updateAdmin(this.editingId, payload).subscribe({
        next: () => {
          this.successMessage = 'Administrador actualizado.';
          this.cancelEdit();
          this.cdr.detectChanges();
          this.loadAdmins();
        },
        error: () => {
          this.errorMessage = 'No se pudo actualizar el administrador.';
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.adminService.createAdmin(payload).subscribe({
      next: () => {
        this.successMessage = 'Administrador creado.';
        this.form.reset();
        this.cdr.detectChanges();
        this.loadAdmins();
      },
      error: () => {
        this.errorMessage = 'No se pudo crear el administrador.';
        this.cdr.detectChanges();
      }
    });
  }

  editAdmin(admin: any): void {
    this.editingId = admin._id;
    this.form.patchValue({
      name: admin.name,
      email: admin.email,
      password: ''
    });
    this.updatePasswordValidators();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
    this.updatePasswordValidators();
  }

  canDelete(admin: any): boolean {
    return admin._id !== this.currentUser?._id;
  }

  deleteAdmin(admin: any): void {
    if (!this.canDelete(admin)) {
      this.errorMessage = 'No puedes eliminarte a ti mismo.';
      return;
    }

    const confirmDelete = window.confirm(`¿Eliminar a ${admin.name}?`);
    if (!confirmDelete) return;

    this.adminService.deleteAdmin(admin._id).subscribe({
      next: () => {
        this.successMessage = 'Administrador eliminado.';
        this.cdr.detectChanges();
        this.loadAdmins();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el administrador.';
        this.cdr.detectChanges();
      }
    });
  }

  get controls() {
    return this.form.controls;
  }

  private updatePasswordValidators(): void {
    const passwordControl = this.form.controls.password;

    if (this.editingId) {
      passwordControl.setValidators([Validators.minLength(6)]);
    } else {
      passwordControl.setValidators([Validators.required, Validators.minLength(6)]);
    }

    passwordControl.updateValueAndValidity({ emitEvent: false });
  }
}
