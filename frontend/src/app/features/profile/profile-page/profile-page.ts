import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css'
})
export class ProfilePage implements OnInit {
  private profileService = inject(ProfileService);
  private cdr = inject(ChangeDetectorRef);
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  user: User = {
    _id: '',
    name: '',
    email: '',
    role: 'user',
    is_active: true
  };

  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';
  touchedFields = {
    name: false,
    email: false
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.user = {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          is_active: data.is_active ?? true
        };
        this.touchedFields = {
          name: false,
          email: false
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la informacion del perfil.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

 onNameInput(event: any): void {
  const inputElement = event.target as HTMLInputElement;
  const filtered = inputElement.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  inputElement.value = filtered;
  this.user.name = filtered;
}

  updateProfile(): void {
    this.touchedFields.name = true;
    this.touchedFields.email = true;

    if (this.nameError || this.emailError) {
      this.errorMessage = 'Revisa los datos del perfil antes de guardar.';
      this.successMessage = '';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.updateProfile({
      name: this.user.name,
      email: this.user.email
    }).subscribe({
      next: (response) => {
        this.saving = false;
        this.successMessage = response?.message || 'Perfil actualizado correctamente.';

        if (response?.user && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        this.loadProfile();
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'No se pudo actualizar el perfil.';
        this.cdr.detectChanges();
      }
    });
  }

  get roleLabel(): string {
    if (this.user.role === 'superadmin') {
      return 'Superadmin';
    }

    if (this.user.role === 'admin') {
      return 'Administrador';
    }

    return 'Usuario';
  }

  get statusLabel(): string {
    return this.user.is_active ? 'Activa' : 'Inactiva';
  }

  get sectionTitle(): string {
    if (this.user.role === 'superadmin') {
      return 'Gestión de perfil superadmin';
    }

    if (this.user.role === 'admin') {
      return 'Gestión de perfil administrativo';
    }

    return 'Gestión de perfil';
  }

  get nameHelpText(): string {
    if (this.user.role === 'superadmin') {
      return 'Este nombre identifica tu cuenta dentro de la gestión general del sistema.';
    }

    if (this.user.role === 'admin') {
      return 'Este nombre identifica tu cuenta dentro del panel y la gestión de solicitudes.';
    }

    return 'Este nombre se muestra en tus reseñas y solicitudes.';
  }

  get emailHelpText(): string {
    if (this.user.role === 'superadmin') {
      return 'Usamos este correo para el acceso y administracion principal de la plataforma.';
    }

    if (this.user.role === 'admin') {
      return 'Usamos este correo para identificar tu cuenta administrativa.';
    }

    return 'Usamos este correo para identificar tu cuenta.';
  }

  get nameError(): string {
    const value = this.user.name.trim();

    if (!this.touchedFields.name) {
      return '';
    }

    if (!value) {
      return 'El nombre es obligatorio.';
    }

    if (value.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (value.length > 80) {
      return 'El nombre no debe superar los 80 caracteres.';
    }

    // 🔥 VALIDACIÓN EXTRA
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
      return 'El nombre no debe contener números ni caracteres especiales.';
    }

    return '';
  }

  get emailError(): string {
    const value = this.user.email.trim();

    if (!this.touchedFields.email) {
      return '';
    }

    if (!value) {
      return 'El correo es obligatorio.';
    }

    if (!this.emailPattern.test(value)) {
      return 'Ingresa un correo valido.';
    }

    return '';
  }

  markFieldTouched(field: 'name' | 'email'): void {
    this.touchedFields[field] = true;
  }
}