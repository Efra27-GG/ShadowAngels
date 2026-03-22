import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';
import { CatalogFiltersComponent } from '../../../shared/components/catalog-filters/catalog-filters';
import { FilterableProductPage } from '../../../shared/utils/filterable-product-page';
import { CatalogSortOption } from '../../../shared/utils/catalog-filter.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, AdminShellComponent, CatalogFiltersComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent extends FilterableProductPage implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  loading = true;

  totalProducts = 0;
  discountedProducts = 0;
  newProducts = 0;
  override sortOptions: CatalogSortOption[] = [
    { value: 'featured', label: 'Destacados' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
    { value: 'name-desc', label: 'Nombre: Z-A' },
    { value: 'discount-desc', label: 'Mayor descuento' }
  ];

  get user() {
    return this.authService.getUser();
  }

  get isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (resp: Product[]) => {
        this.setProducts(resp);
        this.totalProducts = resp.length;
        this.discountedProducts = resp.filter((p: Product) => p.discount > 0).length;
        this.newProducts = resp.filter((p: Product) => p.is_new).length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
