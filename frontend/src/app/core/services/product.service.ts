import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../shared/interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:5000/api';

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

  createProduct(product: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }
}