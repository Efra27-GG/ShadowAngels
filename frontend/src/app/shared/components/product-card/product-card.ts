import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCardComponent {
  @Input() product!: Product;

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