import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';
import { AdminService } from '../../../core/services/admin.service';
import { Review } from '../../../shared/interfaces/review.interface';

@Component({
  selector: 'app-reviews-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminShellComponent],
  templateUrl: './reviews-admin.html',
  styleUrl: './reviews-admin.css'
})
export class ReviewsAdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  reviews: Review[] = [];
  loading = true;
  successMessage = '';
  errorMessage = '';
  selectedFilter: 'all' | 'new' | 'recent' = 'new';

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.adminService.getAdminReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las resenas.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteReview(review: Review): void {
    const confirmed = window.confirm('¿Deseas eliminar esta resena?');
    if (!confirmed) {
      return;
    }

    this.adminService.deleteReview(review._id).subscribe({
      next: () => {
        this.successMessage = 'Resena eliminada correctamente.';
        this.errorMessage = '';
        this.reviews = this.reviews.filter((item) => item._id !== review._id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar la resena.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(filter: 'all' | 'new' | 'recent'): void {
    this.selectedFilter = filter;
  }

  get filteredReviews(): Review[] {
    if (this.selectedFilter === 'all') {
      return this.reviews;
    }

    const now = new Date();
    const recentLimit = new Date();
    recentLimit.setDate(now.getDate() - 7);

    return this.reviews.filter((review) => new Date(review.created_at) >= recentLimit);
  }

  formatDate(date?: string): string {
    if (!date) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  getImagePath(image?: string): string {
    if (!image) {
      return '/img/no-image.png';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `http://127.0.0.1:5000/uploads/products/${image}`;
  }
}
