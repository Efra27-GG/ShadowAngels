import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admins-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admins-admin.html',
  styleUrl: './admins-admin.css'
})
export class AdminsAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  admins: any[] = [];
  editingId: string | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';

  get currentUser() {
    return this.authService.getUser();
  }

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['']
  });

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.adminService.getAdmins().subscribe({
      next: (resp: any) => {
        this.admins = resp;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los administradores.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();

    if (this.editingId) {
      this.adminService.updateAdmin(this.editingId, payload).subscribe({
        next: () => {
          this.successMessage = 'Administrador actualizado.';
          this.cancelEdit();
          this.loadAdmins();
        },
        error: () => this.errorMessage = 'No se pudo actualizar el administrador.'
      });
      return;
    }

    this.adminService.createAdmin(payload).subscribe({
      next: () => {
        this.successMessage = 'Administrador creado.';
        this.form.reset();
        this.loadAdmins();
      },
      error: () => this.errorMessage = 'No se pudo crear el administrador.'
    });
  }

  editAdmin(admin: any): void {
    this.editingId = admin._id;
    this.form.patchValue({
      name: admin.name,
      email: admin.email,
      password: ''
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
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
        this.loadAdmins();
      },
      error: () => this.errorMessage = 'No se pudo eliminar el administrador.'
    });
  }
}