import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLogin {

  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  login() {

    this.loading = true;
    this.error = '';

    this.http.post<any>('http://127.0.0.1:5000/api/admin/auth/login', {
      email: this.email,
      password: this.password
    }).subscribe({

      next: (res) => {

        localStorage.setItem('adminToken', res.token);

        this.router.navigate(['/admin']);
      },

      error: () => {
        this.error = 'Credenciales incorrectas';
        this.loading = false;
      }

    });

  }

}