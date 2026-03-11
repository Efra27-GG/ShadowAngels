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
    if (this.product?.images?.length) {
      return this.product.images[0];
    }
    return 'https://via.placeholder.com/300x400?text=ShadowAngels';
  }
}