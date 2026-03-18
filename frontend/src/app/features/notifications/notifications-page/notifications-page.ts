import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { UserNotification } from '../../../shared/interfaces/notification.interface';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css'
})
export class NotificationsPageComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  notifications: UserNotification[] = [];
  selectedNotification: UserNotification | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getUserNotifications().subscribe({
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

  openNotification(notification: UserNotification): void {
    this.selectedNotification = notification;

    if (!notification.is_read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.is_read = true;
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeModal(): void {
    this.selectedNotification = null;
  }

  markAsRead(notification: UserNotification): void {
    if (notification.is_read) {
      return;
    }

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        notification.is_read = true;
        this.cdr.detectChanges();
      }
    });
  }

  deleteNotification(notification: UserNotification): void {
    this.notificationService.deleteUserNotification(notification._id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((item) => item._id !== notification._id);
        if (this.selectedNotification?._id === notification._id) {
          this.selectedNotification = null;
        }
        this.cdr.detectChanges();
      }
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

  getImagePath(image?: string): string {
    if (!image) {
      return '';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `http://127.0.0.1:5000/uploads/notifications/${image}`;
  }
}
