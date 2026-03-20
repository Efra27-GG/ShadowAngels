import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationRelatedItem, UserNotification } from '../../../shared/interfaces/notification.interface';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css'
})
export class NotificationsPageComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  notifications: UserNotification[] = [];
  selectedNotification: UserNotification | null = null;
  loading = true;
  errorMessage = '';
  selectedFilter: 'new' | 'read' = 'new';

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

  get filteredNotifications(): UserNotification[] {
    return this.notifications.filter((notification) =>
      this.selectedFilter === 'new' ? !notification.is_read : notification.is_read
    );
  }

  setFilter(filter: 'new' | 'read'): void {
    this.selectedFilter = filter;
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

  hasRedirectTarget(notification: UserNotification): boolean {
    const targetType = this.getNotificationTargetType(notification);
    return targetType === 'cart' || (targetType === 'product' && !!notification.notification.target_id);
  }

  openNotificationTarget(notification: UserNotification): void {
    const targetType = this.getNotificationTargetType(notification);

    if (targetType === 'product' && notification.notification.target_id) {
      this.router.navigate(['/producto', notification.notification.target_id]);
      return;
    }

    if (targetType === 'cart') {
      this.router.navigate(['/carrito']);
    }
  }

  getRedirectLabel(notification: UserNotification): string {
    return this.getNotificationTargetType(notification) === 'product' ? 'Ir al producto' : 'Ver carrito';
  }

  getRelatedItems(notification: UserNotification): NotificationRelatedItem[] {
    return notification.notification.related_items ?? [];
  }

  hasRelatedItems(notification: UserNotification): boolean {
    return this.getRelatedItems(notification).length > 0;
  }

  getRelatedItemsTitle(notification: UserNotification): string {
    return this.getRelatedItems(notification).length > 1 ? 'Productos confirmados' : 'Producto confirmado';
  }

  formatRelatedItem(item: NotificationRelatedItem): string {
    const sizeText = item.selected_size ? ` - talla ${item.selected_size}` : '';
    const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
    return `${item.product_name}${sizeText}${quantityText}`;
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

  private getNotificationTargetType(notification: UserNotification): 'product' | 'cart' | null {
    const explicitTarget = notification.notification.target_type;
    if (explicitTarget === 'product' || explicitTarget === 'cart') {
      return explicitTarget;
    }

    const joinedText = `${notification.notification.title} ${notification.notification.summary} ${notification.notification.content}`.toLowerCase();
    if (joinedText.includes('compra confirmada') && (joinedText.includes('carrito') || joinedText.includes('productos incluidos'))) {
      return 'cart';
    }

    return null;
  }
}
