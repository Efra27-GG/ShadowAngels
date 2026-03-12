import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/products/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'mujeres',
    loadComponent: () =>
      import('./features/products/women/women').then((m) => m.WomenComponent),
  },
  {
    path: 'hombres',
    loadComponent: () =>
      import('./features/products/men/men').then((m) => m.MenComponent),
  },
  {
    path: 'ofertas',
    loadComponent: () =>
      import('./features/products/offers/offers').then((m) => m.OffersComponent),
  },
  {
    path: 'novedades',
    loadComponent: () =>
      import('./features/products/news/news').then((m) => m.NewsComponent),
  },
  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },

  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page').then(
        (m) => m.ProfilePageComponent
      ),
  },

  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/admin-login/admin-login').then(
        (m) => m.AdminLogin
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'admin/productos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/products-admin/products-admin').then(
        (m) => m.ProductsAdmin
      ),
  },
  {
    path: 'admin/notificaciones',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/notifications-admin/notifications-admin').then(
        (m) => m.NotificationsAdmin
      ),
  },
  {
    path: 'admin/admins',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admins-admin/admins-admin').then(
        (m) => m.AdminsAdmin
      ),
  },

  {
    path: '**',
    redirectTo: '',
  },
];