import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notifications-admin.html',
  styleUrl: './notifications-admin.css'
})
export class NotificationsAdminComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  successMessage = '';
  errorMessage = '';

  form = this.fb.group({
    title: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(5)]]
  });

  submit(): void {
    if (this.form.invalid) return;

    const confirmSend = window.confirm('¿Deseas publicar esta notificación para todos los usuarios registrados?');
    if (!confirmSend) return;

    this.adminService.createNotification(this.form.getRawValue()).subscribe({
      next: () => {
        this.successMessage = 'Notificación publicada correctamente.';
        this.errorMessage = '';
        this.form.reset();
      },
      error: () => {
        this.errorMessage = 'No se pudo publicar la notificación.';
        this.successMessage = '';
      }
    });
  }
}