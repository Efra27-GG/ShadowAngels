import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseRequest } from '../../shared/interfaces/purchase-request.interface';

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createRequest(productId: string, channel: 'whatsapp' | 'instagram', selectedSize: string) {
    return this.http.post<{ message: string; request: PurchaseRequest }>(
      `${this.apiUrl}/purchase-requests`,
      { product_id: productId, channel, selected_size: selectedSize }
    );
  }

  createGuestRequest(productId: string, channel: 'whatsapp' | 'instagram', guestName: string, guestContact: string, selectedSize: string) {
    return this.http.post<{ message: string; request: PurchaseRequest }>(
      `${this.apiUrl}/guest-purchase-requests`,
      {
        product_id: productId,
        channel,
        guest_name: guestName,
        guest_contact: guestContact,
        selected_size: selectedSize
      }
    );
  }

  getMyProductStatus(productId: string): Observable<{ request: PurchaseRequest | null; confirmed_request?: PurchaseRequest | null; can_review: boolean; has_purchased: boolean }> {
    return this.http.get<{ request: PurchaseRequest | null; confirmed_request?: PurchaseRequest | null; can_review: boolean; has_purchased: boolean }>(
      `${this.apiUrl}/purchase-requests/status/${productId}`
    );
  }

  getAdminRequests(): Observable<PurchaseRequest[]> {
    return this.http.get<PurchaseRequest[]>(`${this.apiUrl}/admin/purchase-requests`);
  }

  updateAdminRequest(requestId: string, status: PurchaseRequest['status'], adminNote = '') {
    return this.http.put<{ message: string; request: PurchaseRequest }>(
      `${this.apiUrl}/admin/purchase-requests/${requestId}`,
      { status, admin_note: adminNote }
    );
  }

  deleteAdminRequest(requestId: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/purchase-requests/${requestId}`);
  }
}
