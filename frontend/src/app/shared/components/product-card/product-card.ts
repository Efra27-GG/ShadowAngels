import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCardComponent {
  @Input() public product!: Product;

  public get imageUrl(): string {
    const firstImage = this.product?.images?.[0];

    if (!firstImage) {
      return '/img/no-image.png';
    }

    if (firstImage.startsWith('http://') || firstImage.startsWith('https://') || firstImage.startsWith('/')) {
      return firstImage;
    }

    return `${environment.uploadsBaseUrl}/products/${firstImage}`;
  }

  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/img/no-image.png';
  }
}
