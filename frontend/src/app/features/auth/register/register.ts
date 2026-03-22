import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  successMessage = '';
  errorMessage = '';

  registerForm = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(20),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$')
      ]
    ],
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

  get controls() {
    return this.registerForm.controls;
  }

  get nameLength(): number {
    return this.controls.name.value?.length || 0;
  }

  get emailLength(): number {
    return this.controls.email.value?.length || 0;
  }

  get passwordLength(): number {
    return this.controls.password.value?.length || 0;
  }

  soloLetras(event: KeyboardEvent): void {
    const char = event.key;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!regex.test(char)) {
      event.preventDefault();
      this.errorMessage = 'Solo se permiten letras en el nombre.';
    } else {
      this.errorMessage = '';
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();

    this.authService.register(name || '', email || '', password || '').subscribe({
      next: () => {
        this.successMessage = 'Usuario registrado correctamente.';
        this.errorMessage = '';
        this.registerForm.reset();
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error al registrar usuario';
        this.successMessage = '';
      }
    });
  }
}
