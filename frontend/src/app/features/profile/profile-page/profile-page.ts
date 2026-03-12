import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-profile-page',
  standalone: true,
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
  }
}