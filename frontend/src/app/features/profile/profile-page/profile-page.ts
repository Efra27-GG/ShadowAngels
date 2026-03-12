<<<<<<< HEAD
import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient, HttpHeaders } from '@angular/common/http'
=======
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { User } from '../../../shared/interfaces/user.interface';
>>>>>>> cacd9a8403251f6607426fbad780d891657f89c7

@Component({
  selector: 'app-profile-page',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css']
})
export class ProfilePage implements OnInit {

  user: any = {
    name: '',
    email: '',
    role: ''
  }

  message: string = ''

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile()
  }

  loadProfile() {

    const token = localStorage.getItem('token')

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    })

    this.http.get<any>('http://127.0.0.1:5000/api/profile', { headers })
      .subscribe({
        next: (data) => {
          this.user = data
        },
        error: (err) => {
          console.error(err)
        }
      })
  }

  updateProfile() {

    const token = localStorage.getItem('token')

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })

    this.http.put(
      'http://127.0.0.1:5000/api/profile',
      {
        name: this.user.name,
        email: this.user.email
      },
      { headers }
    ).subscribe({
      next: () => {
        this.message = 'Perfil actualizado correctamente'
      },
      error: () => {
        this.message = 'Error al actualizar perfil'
      }
    })
=======
  imports: [CommonModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css'
})
export class ProfilePageComponent implements OnInit {
  private profileService = inject(ProfileService);

  user?: User;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (resp) => {
        this.user = resp;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el perfil.';
        this.loading = false;
      }
    });
>>>>>>> cacd9a8403251f6607426fbad780d891657f89c7
  }
}