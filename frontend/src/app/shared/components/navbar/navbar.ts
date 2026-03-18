import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);

  public cartCount = 0;
  public unreadNotifications = 0;

  constructor() {
    this.cartService.cart$.subscribe((cart) => {
      this.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotifications = count;
    });

    this.authService.authState$.subscribe((user) => {
      if (user?.role === 'user') {
        this.cartService.loadCart().subscribe();
        this.notificationService.refreshUnreadCount();
        return;
      }

      this.cartService.clearCartState();
      this.notificationService.clearUnreadCount();
    });
  }

  public get user() {
    return this.authService.getUser();
  }

  public get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  public get isAdmin(): boolean {
    return this.user?.role === 'admin' || this.user?.role === 'superadmin';
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
