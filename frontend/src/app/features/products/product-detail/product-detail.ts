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
    console.log('ID PRODUCTO:', id);

    if (!id) {
      this.errorMessage = 'Producto no encontrado.';
      this.loading = false;
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (resp: Product) => {
        console.log('DETALLE PRODUCTO:', resp);
        this.product = resp;
        this.loading = false;
      },
      error: (err) => {
        console.error('ERROR DETALLE:', err);
        this.errorMessage = 'No se pudo cargar el producto.';
        this.loading = false;
      }
    });
  }
}