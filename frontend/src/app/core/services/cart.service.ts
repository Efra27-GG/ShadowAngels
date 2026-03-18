import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cart } from '../../shared/interfaces/cart.interface';
import { PurchaseRequest } from '../../shared/interfaces/purchase-request.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<Cart>({ items: [] });

  readonly cart$ = this.cartSubject.asObservable();

  clearCartState(): void {
    this.cartSubject.next({ items: [] });
  }

  loadCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/cart`).pipe(
      tap((cart) => this.cartSubject.next(cart))
    );
  }

  loadHistory(): Observable<PurchaseRequest[]> {
    return this.http.get<PurchaseRequest[]>(`${this.apiUrl}/cart/history`);
  }

  addItem(productId: string, quantity = 1) {
    return this.http.post<{ message: string; cart: Cart }>(`${this.apiUrl}/cart/items`, {
      product_id: productId,
      quantity
    }).pipe(
      tap((response) => this.cartSubject.next(response.cart))
    );
  }

  updateItem(productId: string, quantity: number) {
    return this.http.put<{ message: string; cart: Cart }>(`${this.apiUrl}/cart/items/${productId}`, {
      quantity
    }).pipe(
      tap((response) => this.cartSubject.next(response.cart))
    );
  }

  removeItem(productId: string) {
    return this.http.delete<{ message: string; cart: Cart }>(`${this.apiUrl}/cart/items/${productId}`).pipe(
      tap((response) => this.cartSubject.next(response.cart))
    );
  }

  checkout(channel: 'whatsapp' | 'instagram') {
    return this.http.post<{ message: string; active_cart: Cart; submitted_cart: Cart; request: PurchaseRequest }>(`${this.apiUrl}/cart/checkout`, {
      channel
    }).pipe(
      tap((response) => this.cartSubject.next(response.active_cart))
    );
  }
}
