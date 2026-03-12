import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAdmins() {
    return this.http.get(`${this.apiUrl}/admins`);
  }

  createAdmin(data: any) {
    return this.http.post(`${this.apiUrl}/admins`, data);
  }

  updateAdmin(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/admins/${id}`, data);
  }

  deleteAdmin(id: string) {
    return this.http.delete(`${this.apiUrl}/admins/${id}`);
  }

  createNotification(data: any) {
    return this.http.post(`${this.apiUrl}/notifications`, data);
  }
}