import { Component } from '@angular/core';
import { ProfilePage } from '../../profile/profile-page/profile-page';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [AdminShellComponent, ProfilePage],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css'
})
export class AdminProfileComponent {}
