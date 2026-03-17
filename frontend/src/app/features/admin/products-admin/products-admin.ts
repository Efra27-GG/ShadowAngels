import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminShellComponent],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.css'
})
export class ProductsAdminComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  editingId: string | null = null;
  loading = true;
  successMessage = '';
  errorMessage = '';
  selectedFiles: File[] = [];
  existingImages: string[] = [];
  newImagePreviews: string[] = [];
  uploadingImages = false;

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['dama', Validators.required],
    price: [0, Validators.required],
    discount: [0, Validators.required],
    sizesText: ['S,M,L'],
    is_new: [false]
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.clearNewImagePreviews();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (resp: Product[]) => {
        this.products = resp;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los productos.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    if (!this.existingImages.length && !this.selectedFiles.length) {
      this.errorMessage = 'Agrega al menos una imagen para el producto.';
      this.successMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const raw = this.productForm.getRawValue();
    const basePayload = {
      name: raw.name || '',
      description: raw.description || '',
      category: raw.category || 'dama',
      price: Number(raw.price || 0),
      discount: Number(raw.discount || 0),
      sizes: (raw.sizesText || '')
        .split(',')
        .map((size: string) => size.trim())
        .filter(Boolean),
      is_new: !!raw.is_new
    };

    const uploadRequest = this.selectedFiles.length
      ? this.productService.uploadImages(this.selectedFiles)
      : of({ message: '', images: [] as string[] });

    this.uploadingImages = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    uploadRequest.subscribe({
      next: (uploadResponse) => {
        const payload = {
          ...basePayload,
          images: [...this.existingImages, ...uploadResponse.images]
        };

        const request = this.editingId
          ? this.productService.updateProduct(this.editingId, payload)
          : this.productService.createProduct(payload);

        request.subscribe({
          next: () => {
            this.successMessage = this.editingId ? 'Producto actualizado.' : 'Producto creado.';
            this.errorMessage = '';
            this.resetFormState();
            this.cdr.detectChanges();
            this.loadProducts();
          },
          error: () => {
            this.uploadingImages = false;
            this.errorMessage = this.editingId
              ? 'No se pudo actualizar el producto.'
              : 'No se pudo crear el producto.';
            this.successMessage = '';
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.uploadingImages = false;
        this.errorMessage = 'No se pudieron subir las imagenes.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length) {
      return;
    }

    const acceptedFiles = files.filter((file) => file.type.startsWith('image/'));

    this.selectedFiles = [...this.selectedFiles, ...acceptedFiles];
    this.rebuildNewImagePreviews();
    input.value = '';
    this.cdr.detectChanges();
  }

  editProduct(product: Product): void {
    this.editingId = product._id;
    this.existingImages = [...(product.images ?? [])];
    this.selectedFiles = [];
    this.clearNewImagePreviews();

    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount,
      sizesText: product.sizes.join(','),
      is_new: product.is_new
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteProduct(id: string): void {
    const confirmDelete = window.confirm('Seguro que deseas eliminar este producto?');
    if (!confirmDelete) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.successMessage = 'Producto eliminado.';
        this.errorMessage = '';
        this.resetFormState();
        this.cdr.detectChanges();
        this.loadProducts();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el producto.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeExistingImage(image: string): void {
    this.existingImages = this.existingImages.filter((currentImage) => currentImage !== image);
    this.cdr.detectChanges();
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.rebuildNewImagePreviews();
    this.cdr.detectChanges();
  }

  getExistingImageUrl(image: string): string {
    return `http://127.0.0.1:5000/uploads/products/${image}`;
  }

  private rebuildNewImagePreviews(): void {
    this.clearNewImagePreviews();
    this.newImagePreviews = this.selectedFiles.map((file) => URL.createObjectURL(file));
  }

  private clearNewImagePreviews(): void {
    this.newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    this.newImagePreviews = [];
  }

  private resetFormState(): void {
    this.editingId = null;
    this.existingImages = [];
    this.selectedFiles = [];
    this.clearNewImagePreviews();
    this.uploadingImages = false;
    this.productForm.reset({
      category: 'dama',
      price: 0,
      discount: 0,
      sizesText: 'S,M,L',
      is_new: false
    });
  }
}
