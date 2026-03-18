import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';
import { NotificationItem } from '../../../shared/interfaces/notification.interface';

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminShellComponent],
  templateUrl: './notifications-admin.html',
  styleUrl: './notifications-admin.css'
})
export class NotificationsAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  notifications: NotificationItem[] = [];
  loading = true;
  successMessage = '';
  errorMessage = '';
  editingId: string | null = null;
  imagePreview = '';
  imageName = '';

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
    summary: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(220)]],
    content: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(3000)]],
    status: ['draft', Validators.required],
    scheduled_for: ['']
  });

  ngOnInit(): void {
    this.updateScheduledValidators();
    this.form.controls.status.valueChanges.subscribe(() => this.updateScheduledValidators());
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getAdminNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las notificaciones.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Revisa los campos marcados antes de guardar la notificacion.';
      this.successMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload: Partial<NotificationItem> = {
      title: rawValue.title || '',
      summary: rawValue.summary || '',
      content: rawValue.content || '',
      image: this.imageName || '',
      status: (rawValue.status as NotificationItem['status']) || 'draft',
      scheduled_for: rawValue.status === 'scheduled' ? rawValue.scheduled_for || '' : ''
    };
    const request = this.editingId
      ? this.notificationService.updateNotification(this.editingId, payload)
      : this.notificationService.createNotification(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingId ? 'Notificacion actualizada correctamente.' : 'Notificacion guardada correctamente.';
        this.errorMessage = '';
        this.resetForm();
        this.loadNotifications();
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar la notificacion.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  editNotification(notification: NotificationItem): void {
    this.editingId = notification._id;
    this.form.patchValue({
      title: notification.title,
      summary: notification.summary,
      content: notification.content,
      status: notification.status,
      scheduled_for: notification.scheduled_for || ''
    });
    this.imageName = notification.image || '';
    this.imagePreview = this.getImagePath(notification.image);
    this.cdr.detectChanges();
  }

  deleteNotification(notification: NotificationItem): void {
    const confirmed = window.confirm('¿Deseas eliminar esta notificacion?');
    if (!confirmed) {
      return;
    }

    this.notificationService.deleteNotification(notification._id).subscribe({
      next: () => {
        this.successMessage = 'Notificacion eliminada correctamente.';
        this.errorMessage = '';
        if (this.editingId === notification._id) {
          this.resetForm();
        }
        this.loadNotifications();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar la notificacion.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.imageName = '';
    this.imagePreview = '';
    this.form.reset({
      title: '',
      summary: '',
      content: '',
      status: 'draft',
      scheduled_for: ''
    });
  }

  formatDate(date?: string | null): string {
    if (!date) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Selecciona un archivo de imagen valido para la notificacion.';
      this.successMessage = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen de la notificacion no debe superar los 5 MB.';
      this.successMessage = '';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.notificationService.uploadImage(file).subscribe({
      next: (response) => {
        this.imageName = response.images[0] || '';
        this.imagePreview = this.getImagePath(this.imageName);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo subir la imagen de la notificacion.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeImage(): void {
    this.imageName = '';
    this.imagePreview = '';
    this.cdr.detectChanges();
  }

  getImagePath(image?: string): string {
    if (!image) {
      return '';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `http://127.0.0.1:5000/uploads/notifications/${image}`;
  }

  get controls() {
    return this.form.controls;
  }

  get isScheduled(): boolean {
    return this.controls.status.value === 'scheduled';
  }

  private updateScheduledValidators(): void {
    const scheduledControl = this.controls.scheduled_for;

    if (this.isScheduled) {
      scheduledControl.setValidators([
        Validators.required,
        this.futureDateValidator
      ]);
    } else {
      scheduledControl.clearValidators();
    }

    scheduledControl.updateValueAndValidity({ emitEvent: false });
  }

  private futureDateValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) {
      return null;
    }

    const scheduledAt = new Date(value).getTime();
    if (Number.isNaN(scheduledAt)) {
      return { invalidDate: true };
    }

    return scheduledAt > Date.now() ? null : { notFutureDate: true };
  }
}
