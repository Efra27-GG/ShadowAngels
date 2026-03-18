import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { Review } from '../../interfaces/review.interface';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css'
})
export class AdminShellComponent {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  mobileMenuOpen = false;
  recentReviewsCount = 0;

  constructor() {
    this.adminService.getAdminReviews().subscribe({
      next: (reviews: Review[]) => {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        this.recentReviewsCount = reviews.filter((review) => new Date(review.created_at) >= sevenDaysAgo).length;
      }
    });
  }

  get user() {
    return this.authService.getUser();
  }

  get isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
