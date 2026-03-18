import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { CatalogFiltersComponent } from '../../../shared/components/catalog-filters/catalog-filters';
import { FilterableProductPage } from '../../../shared/utils/filterable-product-page';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, CatalogFiltersComponent],
  templateUrl: './offers.html',
  styleUrl: './offers.css'
})
export class OffersComponent extends FilterableProductPage implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  loading = true;

  constructor() {
    super();
    this.sortOption = 'discount-desc';
    this.sortOptions = [
      { value: 'discount-desc', label: 'Mayor descuento' },
      { value: 'price-asc', label: 'Precio: menor a mayor' },
      { value: 'price-desc', label: 'Precio: mayor a menor' },
      { value: 'name-asc', label: 'Nombre: A-Z' },
      { value: 'name-desc', label: 'Nombre: Z-A' }
    ];
  }

  ngOnInit(): void {
    this.productService.getOffers().subscribe({
      next: (resp) => {
        this.setProducts(resp);
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
