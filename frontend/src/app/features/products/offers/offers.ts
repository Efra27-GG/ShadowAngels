import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './offers.html',
  styleUrl: './offers.css'
})
export class OffersComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  loading = true;

  ngOnInit(): void {
    this.productService.getOffers().subscribe({
      next: (resp) => {
        this.products = resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}