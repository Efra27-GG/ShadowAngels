import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ContactInfo } from '../../shared/interfaces/contact.interface';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:5000/api';

  private readonly defaultContact: ContactInfo = {
    whatsapp_number: '',
    whatsapp_label: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
    location: ''
  };

  private readonly contactSubject = new BehaviorSubject<ContactInfo>(this.defaultContact);
  readonly contact$ = this.contactSubject.asObservable();

  loadContact(): Observable<ContactInfo> {
    return this.http.get<ContactInfo>(`${this.apiUrl}/contact`).pipe(
      tap((contact) => this.contactSubject.next({ ...this.defaultContact, ...contact }))
    );
  }

  getCurrentContact(): ContactInfo {
    return this.contactSubject.value;
  }

  updateContact(payload: ContactInfo) {
    return this.http.put<{ message: string }>(`${this.apiUrl}/contact`, payload).pipe(
      tap(() => this.contactSubject.next({ ...this.defaultContact, ...payload }))
    );
  }
}
