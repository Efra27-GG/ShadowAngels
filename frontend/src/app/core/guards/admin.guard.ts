import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUser();

  if (authService.isLoggedIn() && (user?.role === 'admin' || user?.role === 'superadmin')) {
    return true;
  }

  router.navigate(['/admin/login']);
  return false;
};