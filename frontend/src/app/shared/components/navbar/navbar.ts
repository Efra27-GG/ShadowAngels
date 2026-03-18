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
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);

  cartCount = 0;
  unreadNotifications = 0;

  constructor() {
    this.cartService.cart$.subscribe((cart) => {
      this.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotifications = count;
    });

    if (this.isLoggedIn && !this.isAdmin) {
      this.cartService.loadCart().subscribe();
      this.notificationService.refreshUnreadCount();
    }
  }

  get user() {
    return this.authService.getUser();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAdmin(): boolean {
    return this.user?.role === 'admin' || this.user?.role === 'superadmin';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
