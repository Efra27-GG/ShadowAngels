import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { Review } from '../../interfaces/review.interface';
import { PurchaseRequestService } from '../../../core/services/purchase-request.service';
import { PurchaseRequest } from '../../interfaces/purchase-request.interface';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-shell.html',
  styleUrls: ['./admin-shell.css']
})
export class AdminShellComponent {
  private readonly reviewsSeenKey = 'admin_seen_reviews_at';
  private readonly requestsSeenKey = 'admin_seen_requests_at';
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly purchaseRequestService = inject(PurchaseRequestService);
  private readonly router = inject(Router);
  public mobileMenuOpen = false;
  public recentReviewsCount = 0;
  public recentRequestsCount = 0;

  constructor() {
    this.markCurrentSectionAsSeen();
    this.refreshBadges();

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.markCurrentSectionAsSeen();
      this.refreshBadges();
    });
  }

  public get user() {
    return this.authService.getUser();
  }

  public get isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  public toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  public closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  private refreshBadges(): void {
    forkJoin({
      reviews: this.adminService.getAdminReviews(),
      requests: this.purchaseRequestService.getAdminRequests()
    }).subscribe({
      next: ({ reviews, requests }) => {
        const currentUrl = this.router.url;
        this.recentReviewsCount = currentUrl.startsWith('/admin/resenas')
          ? 0
          : this.countUnseenItems(reviews, this.readSeenTimestamp(this.reviewsSeenKey));
        this.recentRequestsCount = currentUrl.startsWith('/admin/solicitudes')
          ? 0
          : this.countUnseenItems(requests, this.readSeenTimestamp(this.requestsSeenKey));
      }
    });
  }

  private markCurrentSectionAsSeen(): void {
    const currentUrl = this.router.url;

    if (currentUrl.startsWith('/admin/resenas')) {
      this.persistSeenTimestamp(this.reviewsSeenKey);
      this.recentReviewsCount = 0;
    }

    if (currentUrl.startsWith('/admin/solicitudes')) {
      this.persistSeenTimestamp(this.requestsSeenKey);
      this.recentRequestsCount = 0;
    }
  }

  private countUnseenItems(items: Array<Review | PurchaseRequest>, seenTimestamp: number): number {
    return items.filter((item) => {
      const createdAt = this.parseServerDate(item.created_at);
      return !Number.isNaN(createdAt) && createdAt > seenTimestamp;
    }).length;
  }

  private parseServerDate(value: string): number {
    if (!value) {
      return Number.NaN;
    }

    const normalizedValue = /z$|[+-]\d{2}:\d{2}$/i.test(value) ? value : `${value}Z`;
    return new Date(normalizedValue).getTime();
  }

  private readSeenTimestamp(storageKey: string): number {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 0;
    }

    return Number(localStorage.getItem(storageKey) || '0');
  }

  private persistSeenTimestamp(storageKey: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(storageKey, String(Date.now()));
  }
}
