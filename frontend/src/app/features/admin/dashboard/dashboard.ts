import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  products: Product[] = [];
  loading = true;

  totalProducts = 0;
  discountedProducts = 0;
  newProducts = 0;

  get user() {
    return this.authService.getUser();
  }

  get isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (resp: Product[]) => {
        this.products = resp;
        this.totalProducts = resp.length;
        this.discountedProducts = resp.filter((p: Product) => p.discount > 0).length;
        this.newProducts = resp.filter((p: Product) => p.is_new).length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}