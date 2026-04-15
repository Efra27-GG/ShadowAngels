import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HeroContent } from '../../shared/interfaces/hero.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HeroService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private readonly defaultHero: HeroContent = {
    title: 'Bienvenido a ShadowAngels',
    subtitle: 'Descubre nuestros productos, novedades y ofertas especiales.',
    image: ''
  };

  private readonly heroSubject = new BehaviorSubject<HeroContent>(this.defaultHero);
  readonly hero$ = this.heroSubject.asObservable();

  loadHero(): Observable<HeroContent> {
    return this.http.get<HeroContent>(`${this.apiUrl}/hero`).pipe(
      tap((hero) => this.heroSubject.next({ ...this.defaultHero, ...hero }))
    );
  }

  getCurrentHero(): HeroContent {
    return this.heroSubject.value;
  }

  updateHero(payload: HeroContent) {
    return this.http.put<{ message: string }>(`${this.apiUrl}/hero`, payload).pipe(
      tap(() => this.heroSubject.next({ ...this.defaultHero, ...payload }))
    );
  }

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('images', file);
    return this.http.post<{ message: string; images: string[] }>(`${this.apiUrl}/uploads/hero`, formData);
  }

  getImagePath(image?: string): string {
    if (!image) {
      return '';
    }

    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }

    return `${environment.uploadsBaseUrl}/hero/${image}`;
  }
}
