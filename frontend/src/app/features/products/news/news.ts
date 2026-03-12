import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './news.html',
  styleUrl: './news.css'
})
export class NewsComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  loading = true;

  ngOnInit(): void {
    this.productService.getNews().subscribe({
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
