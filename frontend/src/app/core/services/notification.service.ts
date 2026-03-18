import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem, UserNotification } from '../../shared/interfaces/notification.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private unreadSubject = new BehaviorSubject<number>(0);

  readonly unreadCount$ = this.unreadSubject.asObservable();

  getAdminNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.apiUrl}/admin/notifications`);
  }

  createNotification(payload: Partial<NotificationItem>) {
    return this.http.post<{ message: string; notification: NotificationItem }>(`${this.apiUrl}/notifications`, payload);
  }

  updateNotification(id: string, payload: Partial<NotificationItem>) {
    return this.http.put<{ message: string; notification: NotificationItem }>(`${this.apiUrl}/admin/notifications/${id}`, payload);
  }

  deleteNotification(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/notifications/${id}`);
  }

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('images', file);
    return this.http.post<{ message: string; images: string[] }>(`${this.apiUrl}/uploads/notifications`, formData);
  }

  getUserNotifications(): Observable<UserNotification[]> {
    return this.http.get<UserNotification[]>(`${this.apiUrl}/notifications`).pipe(
      tap((notifications) => this.unreadSubject.next(notifications.filter((item) => !item.is_read).length))
    );
  }

  markAsRead(id: string) {
    return this.http.put<{ message: string }>(`${this.apiUrl}/notifications/${id}/read`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  deleteUserNotification(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/notifications/${id}`).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  refreshUnreadCount(): void {
    this.getUserNotifications().subscribe();
  }
}
