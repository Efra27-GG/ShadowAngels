import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { Cart, CartItem } from '../../../shared/interfaces/cart.interface';
import { ContactService } from '../../../core/services/contact.service';
import { ContactInfo } from '../../../shared/interfaces/contact.interface';
import { PurchaseRequest } from '../../../shared/interfaces/purchase-request.interface';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css'
})
export class CartPageComponent implements OnInit {
  private cartService = inject(CartService);
  private contactService = inject(ContactService);
  private cdr = inject(ChangeDetectorRef);

  cart: Cart = { items: [] };
  history: PurchaseRequest[] = [];
  contact: ContactInfo = {
    whatsapp_number: '',
    whatsapp_label: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
    location: ''
  };
  loading = true;
  message = '';
  errorMessage = '';
  historyFilter: 'all' | 'pending' | 'confirmed' = 'all';

  ngOnInit(): void {
    this.contactService.contact$.subscribe((contact) => {
      this.contact = contact;
    });

    this.contactService.loadContact().subscribe();
    this.loadCart();
    this.loadHistory();
  }

  loadCart(): void {
    this.cartService.loadCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el carrito.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    this.cartService.loadHistory().subscribe({
      next: (history) => {
        this.history = history;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  changeQuantity(item: CartItem, delta: number): void {
    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 1) {
      return;
    }

    this.cartService.updateItem(item.product_id, item.selected_size, nextQuantity).subscribe({
      next: (response) => {
        this.cart = response.cart;
        this.message = 'Cantidad actualizada.';
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar la cantidad.';
        this.message = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.product_id, item.selected_size).subscribe({
      next: (response) => {
        this.cart = response.cart;
        this.message = 'Producto eliminado del carrito.';
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el producto.';
        this.message = '';
        this.cdr.detectChanges();
      }
    });
  }

  checkout(channel: 'whatsapp' | 'instagram'): void {
    if (!this.cart.items.length) {
      return;
    }

    const cartItems = [...this.cart.items];

    this.cartService.checkout(channel).subscribe({
      next: (response) => {
        this.cart = response.active_cart;
        this.loadHistory();
        this.message = 'Tu solicitud del carrito se registro correctamente. Esperando a que el admin la confirme.';
        this.errorMessage = '';
        this.openExternalChannel(channel, cartItems);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'No se pudo registrar la solicitud.';
        this.message = '';
        this.cdr.detectChanges();
      }
    });
  }

  get totalItems(): number {
    return this.cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalAmount(): number {
    return this.cart.items.reduce((total, item) => total + (item.final_price * item.quantity), 0);
  }

  get filteredHistory(): PurchaseRequest[] {
    if (this.historyFilter === 'all') {
      return this.history;
    }

    return this.history.filter((request) => request.status === this.historyFilter);
  }

  getHistoryStatusMessage(request: PurchaseRequest): string {
    if (request.status === 'confirmed') {
      return request.request_type === 'cart'
        ? 'Compra confirmada. Ya puedes dejar resenas en los productos de este carrito.'
        : 'Compra confirmada. Ya puedes dejar tu resena de este producto.';
    }

    if (request.status === 'pending') {
      return 'Solicitud pendiente. Esperando a que el admin confirme esta compra.';
    }

    return '';
  }

  getHistoryTotal(request: PurchaseRequest): number {
    if (request.request_type === 'cart') {
      return (request.items || []).reduce((total, item) => total + ((item.final_price || 0) * item.quantity), 0);
    }

    return request.items?.reduce((total, item) => total + ((item.final_price || 0) * item.quantity), 0) || 0;
  }

  getHistoryTitle(request: PurchaseRequest): string {
    if (request.request_type === 'cart') {
      const totalUnits = (request.items || []).reduce((total, item) => total + item.quantity, 0);
      return `Carrito con ${totalUnits} prenda${totalUnits === 1 ? '' : 's'}`;
    }

    return request.product_name || 'Compra individual';
  }

  getHistoryItems(request: PurchaseRequest): Array<{ product_name: string; quantity: number; final_price?: number; selected_size?: string }> {
    if (request.request_type === 'cart') {
      return request.items || [];
    }

    return request.product_name
      ? [{ product_name: request.product_name, quantity: 1, final_price: undefined, selected_size: request.selected_size }]
      : [];
  }

  setHistoryFilter(filter: 'all' | 'pending' | 'confirmed'): void {
    this.historyFilter = filter;
  }

  getImagePath(image?: string): string {
    if (!image) {
      return '/img/no-image.png';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `http://127.0.0.1:5000/uploads/products/${image}`;
  }

  private openExternalChannel(channel: 'whatsapp' | 'instagram', items: CartItem[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    const summary = items
      .map((item) => `${item.product_name} talla ${item.selected_size} x${item.quantity}`)
      .join(', ');
    const message = encodeURIComponent(`Hola, quiero solicitar estos productos de mi carrito: ${summary}.`);

    const url = channel === 'whatsapp'
      ? this.getWhatsappUrl(message)
      : (this.contact.instagram || 'https://www.instagram.com/shadowangels/');

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private getWhatsappUrl(message: string): string {
    const rawNumber = this.contact.whatsapp_number || '';
    const cleanNumber = rawNumber.replace(/\D/g, '');

    if (!cleanNumber) {
      return `https://wa.me/525512345678?text=${message}`;
    }

    return `https://wa.me/${cleanNumber}?text=${message}`;
  }
}
