import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  product?: Product;
  selectedImage = '';
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe({
      next: (params) => {
        const id = params.get('id');

        if (!id) {
          this.product = undefined;
          this.errorMessage = 'Producto no encontrado.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.loadProduct(id);
      }
    });
  }

  private loadProduct(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.product = undefined;

    this.productService.getProductById(id).subscribe({
      next: (resp: Product) => {
        this.product = resp;
        this.selectedImage = this.getImagePath(resp.images?.[0]);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el producto.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get imageUrl(): string {
    return this.selectedImage || this.getImagePath(this.product?.images?.[0]);
  }

  get galleryImages(): string[] {
    const images = this.product?.images ?? [];
    return images.length ? images.map((image) => this.getImagePath(image)) : ['/img/no-image.png'];
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  formatReviewDate(date?: string): string {
    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  private getImagePath(image?: string): string {
    if (!image) {
      return '/img/no-image.png';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `http://127.0.0.1:5000/uploads/products/${image}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/img/no-image.png';
  }
}
