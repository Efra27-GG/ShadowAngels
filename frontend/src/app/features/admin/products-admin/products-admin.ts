import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.css'
})
export class ProductsAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  products: Product[] = [];
  editingId: string | null = null;
  loading = true;
  successMessage = '';
  errorMessage = '';

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['dama', Validators.required],
    price: [0, Validators.required],
    discount: [0, Validators.required],
    sizesText: ['S,M,L'],
    imagesText: ['no-image.png'],
    is_new: [false]
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (resp: Product[]) => {
        this.products = resp;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los productos.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.productForm.invalid) return;

    const raw = this.productForm.getRawValue();

    const payload = {
      name: raw.name || '',
      description: raw.description || '',
      category: raw.category || 'dama',
      price: Number(raw.price || 0),
      discount: Number(raw.discount || 0),
      sizes: (raw.sizesText || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      images: (raw.imagesText || '')
        .split(',')
        .map((i: string) => i.trim())
        .filter(Boolean),
      is_new: !!raw.is_new
    };

    if (this.editingId) {
      this.productService.updateProduct(this.editingId, payload).subscribe({
        next: () => {
          this.successMessage = 'Producto actualizado.';
          this.errorMessage = '';
          this.cancelEdit();
          this.loadProducts();
        },
        error: () => {
          this.errorMessage = 'No se pudo actualizar el producto.';
          this.successMessage = '';
        }
      });
      return;
    }

    this.productService.createProduct(payload).subscribe({
      next: () => {
        this.successMessage = 'Producto creado.';
        this.errorMessage = '';
        this.productForm.reset({
          category: 'dama',
          price: 0,
          discount: 0,
          sizesText: 'S,M,L',
          imagesText: 'no-image.png',
          is_new: false
        });
        this.loadProducts();
      },
      error: () => {
        this.errorMessage = 'No se pudo crear el producto.';
        this.successMessage = '';
      }
    });
  }

  editProduct(product: Product): void {
    this.editingId = product._id;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount,
      sizesText: product.sizes.join(','),
      imagesText: product.images.join(','),
      is_new: product.is_new
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.productForm.reset({
      category: 'dama',
      price: 0,
      discount: 0,
      sizesText: 'S,M,L',
      imagesText: 'no-image.png',
      is_new: false
    });
  }

  deleteProduct(id: string): void {
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este producto?');
    if (!confirmDelete) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.successMessage = 'Producto eliminado.';
        this.errorMessage = '';
        this.loadProducts();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el producto.';
        this.successMessage = '';
      }
    });
  }
}