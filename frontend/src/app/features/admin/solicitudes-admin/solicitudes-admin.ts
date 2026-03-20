import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';
import { PurchaseRequestService } from '../../../core/services/purchase-request.service';
import { PurchaseRequest } from '../../../shared/interfaces/purchase-request.interface';

@Component({
  selector: 'app-solicitudes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './solicitudes-admin.html',
  styleUrl: './solicitudes-admin.css'
})
export class SolicitudesAdminComponent implements OnInit {
  private purchaseRequestService = inject(PurchaseRequestService);
  private cdr = inject(ChangeDetectorRef);

  requests: PurchaseRequest[] = [];
  selectedFilter: 'all' | 'pending' | 'confirmed' | 'rejected' | 'recent' = 'all';
  loading = true;
  successMessage = '';
  errorMessage = '';
  adminNotes: Record<string, string> = {};
  expandedRequestId: string | null = null;

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.purchaseRequestService.getAdminRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.adminNotes = requests.reduce((acc, request) => {
          acc[request._id] = request.admin_note ?? '';
          return acc;
        }, {} as Record<string, string>);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las solicitudes.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(request: PurchaseRequest, status: PurchaseRequest['status']): void {
    this.purchaseRequestService
      .updateAdminRequest(request._id, status, this.adminNotes[request._id] ?? '')
      .subscribe({
        next: () => {
          this.successMessage = 'Solicitud actualizada correctamente.';
          this.errorMessage = '';
          this.loadRequests();
        },
        error: () => {
          this.errorMessage = 'No se pudo actualizar la solicitud.';
          this.successMessage = '';
          this.cdr.detectChanges();
        }
      });
  }

  deleteRequest(request: PurchaseRequest): void {
    const confirmed = window.confirm('Deseas eliminar esta solicitud? Esta accion no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    this.purchaseRequestService.deleteAdminRequest(request._id).subscribe({
      next: () => {
        this.successMessage = 'Solicitud eliminada correctamente.';
        this.errorMessage = '';
        this.requests = this.requests.filter((currentRequest) => currentRequest._id !== request._id);
        if (this.expandedRequestId === request._id) {
          this.expandedRequestId = null;
        }
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.error || 'No se pudo eliminar la solicitud.';
        this.successMessage = '';
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(filter: 'all' | 'pending' | 'confirmed' | 'rejected' | 'recent'): void {
    this.selectedFilter = filter;
  }

  get filteredRequests(): PurchaseRequest[] {
    if (this.selectedFilter === 'all') {
      return this.requests;
    }

    if (this.selectedFilter === 'recent') {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      return this.requests.filter((request) => new Date(request.created_at) >= sevenDaysAgo);
    }

    return this.requests.filter((request) => request.status === this.selectedFilter);
  }

  formatDate(date?: string | null): string {
    if (!date) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  getRequestTitle(request: PurchaseRequest): string {
    if (request.request_type === 'cart') {
      const totalProducts = request.items?.length || 0;
      return `Carrito con ${totalProducts} producto${totalProducts === 1 ? '' : 's'}`;
    }

    return request.product_name || 'Solicitud';
  }

  toggleDetails(requestId: string): void {
    this.expandedRequestId = this.expandedRequestId === requestId ? null : requestId;
  }

  isExpanded(requestId: string): boolean {
    return this.expandedRequestId === requestId;
  }

  getProductsSummary(request: PurchaseRequest): string {
    if (request.request_type === 'cart') {
      const items = request.items || [];
      const groupedItems = new Map<string, number>();

      items.forEach((item) => {
        const currentQuantity = groupedItems.get(item.product_name) || 0;
        groupedItems.set(item.product_name, currentQuantity + item.quantity);
      });

      const summary = Array.from(groupedItems.entries())
        .map(([productName, quantity]) => `${productName} x${quantity}`)
        .join(', ');

      return `Carrito: ${summary}`;
    }

    return `Producto: ${request.product_name || 'Sin nombre'} x1`;
  }

  getRequestDetailItems(request: PurchaseRequest): Array<{ label: string; quantity: number; size?: string }> {
    if (request.request_type === 'cart') {
      return (request.items || []).map((item) => ({
        label: item.product_name,
        quantity: item.quantity,
        size: item.selected_size
      }));
    }

    return request.product_name
      ? [{
          label: request.product_name,
          quantity: 1,
          size: request.selected_size
        }]
      : [];
  }
}
