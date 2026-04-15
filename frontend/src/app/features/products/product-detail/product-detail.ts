import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseRequestService } from '../../../core/services/purchase-request.service';
import { PurchaseRequest } from '../../../shared/interfaces/purchase-request.interface';
import { Review } from '../../../shared/interfaces/review.interface';
import { ContactService } from '../../../core/services/contact.service';
import { ContactInfo } from '../../../shared/interfaces/contact.interface';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private purchaseRequestService = inject(PurchaseRequestService);
  private contactService = inject(ContactService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  product?: Product;
  selectedImage = '';
  loading = true;
  errorMessage = '';
  purchaseRequest: PurchaseRequest | null = null;
  canReview = false;
  hasPurchased = false;
  requestMessage = '';
  reviewMessage = '';
  reviewErrorMessage = '';
  contact: ContactInfo = {
    whatsapp_number: '',
    whatsapp_label: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
    location: ''
  };
  reviewForm = {
    rating: 5,
    comment: ''
  };
  selectedSize = '';
  guestRequestForm = {
    guest_name: ''
  };
  reviewSubmitted = false;
  guestRequestSubmitted = false;
  private readonly guestNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  ngOnInit(): void {
    this.contactService.contact$.subscribe((contact) => {
      this.contact = contact;
    });

    this.contactService.loadContact().subscribe();

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

        if (this.ownReview) {
          this.reviewForm = {
            rating: this.ownReview.rating,
            comment: this.ownReview.comment
          };
        } else {
          this.reviewForm = {
            rating: 5,
            comment: ''
          };
        }

        this.reviewSubmitted = false;
        this.selectedSize = '';

        this.loading = false;
        this.loadPurchaseStatus(id);
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

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser() {
    return this.authService.getUser();
  }

  get isUser(): boolean {
    return this.currentUser?.role === 'user';
  }

  get canGuestRequest(): boolean {
    return !this.isLoggedIn;
  }

  get ownReview(): Review | undefined {
    return this.product?.reviews?.find((review) => review.user_id === this.currentUser?._id);
  }

  get canEditOwnReview(): boolean {
    if (!this.ownReview?.created_at) {
      return false;
    }

    const createdAt = this.parseServerDate(this.ownReview.created_at);
    if (!createdAt) {
      return false;
    }

    const elapsed = Date.now() - createdAt;
    return elapsed >= 0 && elapsed <= 10 * 60 * 1000;
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  createPurchaseRequest(channel: 'whatsapp' | 'instagram'): void {
    if (!this.product || !this.isUser) {
      return;
    }

    if (this.sizeError) {
      this.requestMessage = this.sizeError;
      this.cdr.detectChanges();
      return;
    }

    this.purchaseRequestService.createRequest(this.product._id, channel, this.selectedSize).subscribe({
      next: (response) => {
        this.purchaseRequest = response.request;
        this.requestMessage = response.message;
        this.reviewErrorMessage = '';
        this.reviewMessage = '';
        this.loadPurchaseStatus(this.product!._id);
        this.openExternalChannel(channel);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.requestMessage = error?.error?.error || 'No se pudo registrar la solicitud.';
        this.cdr.detectChanges();
      }
    });
  }

  createGuestPurchaseRequest(channel: 'whatsapp' | 'instagram'): void {
    this.guestRequestSubmitted = true;

    if (!this.product || !this.canGuestRequest || this.guestRequestError || this.sizeError) {
      this.requestMessage = this.guestRequestError || this.sizeError || 'Completa tus datos para solicitar este producto.';
      this.cdr.detectChanges();
      return;
    }

    this.purchaseRequestService.createGuestRequest(
      this.product._id,
      channel,
      this.guestRequestForm.guest_name,
      `${channel}:${this.guestRequestForm.guest_name.trim().toLowerCase()}`,
      this.selectedSize
    ).subscribe({
      next: (response) => {
        this.requestMessage = response.message;
        this.openExternalChannel(channel);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.requestMessage = error?.error?.error || 'No se pudo registrar la solicitud.';
        this.cdr.detectChanges();
      }
    });
  }

  addToCart(): void {
    if (!this.product || !this.isUser) {
      return;
    }

    if (this.sizeError) {
      this.requestMessage = this.sizeError;
      this.cdr.detectChanges();
      return;
    }

    this.cartService.addItem(this.product._id, this.selectedSize).subscribe({
      next: () => {
        this.requestMessage = `Producto agregado al carrito en talla ${this.selectedSize}.`;
        this.reviewErrorMessage = '';
        this.reviewMessage = '';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.requestMessage = error?.error?.error || 'No se pudo agregar el producto al carrito.';
        this.cdr.detectChanges();
      }
    });
  }

  submitReview(): void {
    this.reviewSubmitted = true;

    if (!this.product || (!this.canReview && !this.canEditOwnReview)) {
      return;
    }

    if (this.commentError) {
      this.reviewErrorMessage = this.commentError;
      this.reviewMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const request = this.ownReview
      ? this.productService.updateReview(this.ownReview._id, this.reviewForm)
      : this.productService.createReview(this.product._id, this.reviewForm);

    request.subscribe({
      next: () => {
        this.reviewMessage = this.ownReview
          ? 'Tu reseña se actualizó correctamente.'
          : 'Tu reseña se guardó correctamente.';
        this.reviewErrorMessage = '';
        this.reviewSubmitted = false;
        this.loadProduct(this.product!._id);
      },
      error: (error) => {
        this.reviewErrorMessage = error?.error?.error || 'No se pudo guardar la reseña.';
        this.reviewMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  private loadPurchaseStatus(productId: string): void {
    this.purchaseRequest = null;
    this.canReview = false;
    this.hasPurchased = false;
    this.requestMessage = '';

    if (!this.isUser) {
      return;
    }

    this.purchaseRequestService.getMyProductStatus(productId).subscribe({
      next: (response) => {
        this.purchaseRequest = response.request;
        this.canReview = response.can_review;
        this.hasPurchased = response.has_purchased;
        this.cdr.detectChanges();
      }
    });
  }

  private openExternalChannel(channel: 'whatsapp' | 'instagram'): void {
    if (!this.product || typeof window === 'undefined') {
      return;
    }

    const message = encodeURIComponent(
      `Hola, me interesa el producto ${this.product.name} de ShadowAngels en talla ${this.selectedSize}.`
    );

    const url = channel === 'whatsapp'
      ? this.getWhatsappUrl(message)
      : (this.contact.instagram || 'https://www.instagram.com/shadowangels/');

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  formatReviewDate(date?: string): string {
    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(this.parseServerDate(date)));
  }

  private parseServerDate(date: string): number {
    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
    return new Date(normalized).getTime();
  }

  private getWhatsappUrl(message: string): string {
    const rawNumber = this.contact.whatsapp_number || '';
    const cleanNumber = rawNumber.replace(/\D/g, '');

    if (!cleanNumber) {
      return `https://wa.me/525512345678?text=${message}`;
    }

    return `https://wa.me/${cleanNumber}?text=${message}`;
  }

  private getImagePath(image?: string): string {
    if (!image) {
      return '/img/no-image.png';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `${environment.uploadsBaseUrl}/products/${image}`;
  }

  get commentError(): string {
    const comment = this.reviewForm.comment.trim();

    if (!this.reviewSubmitted) {
      return '';
    }

    if (!comment) {
      return 'El comentario es obligatorio.';
    }

    if (comment.length < 5) {
      return 'El comentario debe tener al menos 5 caracteres.';
    }

    if (comment.length > 500) {
      return 'El comentario no debe superar los 500 caracteres.';
    }

    return '';
  }

  get guestRequestError(): string {
    if (!this.guestRequestSubmitted) {
      return '';
    }

    const guestName = this.guestRequestForm.guest_name.trim();

    if (!guestName) {
      return 'Tu nombre es obligatorio para registrar la solicitud.';
    }

    if (guestName.length < 2) {
      return 'Tu nombre debe tener al menos 2 caracteres.';
    }

    if (guestName.length > 60) {
      return 'Tu nombre no debe superar los 60 caracteres.';
    }

    if (!this.guestNamePattern.test(guestName)) {
      return 'Tu nombre no debe contener numeros ni caracteres especiales.';
    }

    return '';
  }

  get sizeError(): string {
    if (this.selectedSize) {
      return '';
    }

    return 'Selecciona una talla para continuar.';
  }

  selectSize(size: string): void {
    this.selectedSize = size;
    this.requestMessage = '';
    this.cdr.detectChanges();
  }

  onGuestNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    input.value = filtered;
    this.guestRequestForm.guest_name = filtered;
  }

  get guestNameLength(): number {
    return this.guestRequestForm.guest_name.length;
  }

  get commentLength(): number {
    return this.reviewForm.comment.length;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/img/no-image.png';
  }
}
