import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
export class NavbarComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);

  public cartCount = 0;
  public unreadNotifications = 0;
  public isMobileMenuOpen = false;
  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.cartService.cart$.subscribe((cart) => {
        this.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      })
    );

    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe((count) => {
        this.unreadNotifications = count;
      })
    );

    this.subscriptions.add(
      this.authService.authState$.subscribe((user) => {
        if (user?.role === 'user') {
          this.cartService.loadCart().subscribe();
          this.notificationService.refreshUnreadCount();
          return;
        }

        this.cartService.clearCartState();
        this.notificationService.clearUnreadCount();
      })
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.closeMobileMenu();
        })
    );
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

  public toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  public logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
