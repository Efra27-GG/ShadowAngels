import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getWomenProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products?category=dama`);
  }

  getMenProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products?category=caballero`);
  }

  getOffers(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products?offers=true`);
  }

  getNews(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products?newest=true`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: unknown): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  createReview(productId: string, payload: { rating: number; comment: string }) {
    return this.http.post(`${this.apiUrl}/products/${productId}/reviews`, payload);
  }

  updateReview(reviewId: string, payload: { rating: number; comment: string }) {
    return this.http.put(`${this.apiUrl}/reviews/${reviewId}`, payload);
  }

  uploadImages(files: File[]): Observable<{ message: string; images: string[] }> {
    const formData = new FormData();

    files.forEach((file) => formData.append('images', file));

    return this.http.post<{ message: string; images: string[] }>(
      `${this.apiUrl}/uploads/products`,
      formData
    );
  }
}
