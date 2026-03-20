import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';
  loading = false;

  loginForm = this.fb.group({
  email: [
    '',
    [
      Validators.required,
      Validators.email,
      Validators.maxLength(50) 
    ]
  ],
  password: [
    '',
    [
      Validators.required,
      Validators.minLength(6), 
      Validators.maxLength(15)
    ]
  ]
});

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.getRawValue();

    this.authService.adminLogin(email || '', password || '').subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error || 'Error al iniciar sesión como administrador';
      }
    });
  }
}