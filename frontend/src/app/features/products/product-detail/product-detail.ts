import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  product?: Product;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Producto no encontrado.';
      this.loading = false;
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (resp: Product) => {
        this.product = resp;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el producto.';
        this.loading = false;
      }
    });
  }

  get imageUrl(): string {
    const firstImage = this.product?.images?.[0];

    if (!firstImage) {
      return 'assets/img/no-image.png';
    }

    if (firstImage.startsWith('http') || firstImage.startsWith('assets/')) {
      return firstImage;
    }

    return `assets/img/products/${firstImage}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/no-image.png';
  }
}