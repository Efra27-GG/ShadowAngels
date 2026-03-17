import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css'
})
export class AdminShellComponent {
  private authService = inject(AuthService);
  mobileMenuOpen = false;

  get user() {
    return this.authService.getUser();
  }

  get isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
