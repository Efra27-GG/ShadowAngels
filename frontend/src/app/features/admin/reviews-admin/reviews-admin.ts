import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminShellComponent } from '../../../shared/components/admin-shell/admin-shell';

@Component({
  selector: 'app-reviews-admin',
  standalone: true,
  imports: [CommonModule, AdminShellComponent],
  templateUrl: './reviews-admin.html',
  styleUrl: './reviews-admin.css'
})
export class ReviewsAdminComponent {}
