import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

<<<<<<< HEAD
import { Home } from './features/home/home/home';
import { ProfilePage } from './features/profile/profile-page/profile-page';
import { AdminLogin } from './features/admin/admin-login/admin-login';

export const routes: Routes = [

  {
    path: '',
    component: Home
  },

  {
    path: 'profile',
    component: ProfilePage
  },

  {
    path: 'admin-login',
    component: AdminLogin
  }

=======
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/products/home/home').then((m) => m.Home),
  },
  {
    path: 'mujeres',
    loadComponent: () =>
      import('./features/products/women/women').then((m) => m.Women),
  },
  {
    path: 'hombres',
    loadComponent: () =>
      import('./features/products/men/men').then((m) => m.Men),
  },
  {
    path: 'ofertas',
    loadComponent: () =>
      import('./features/products/offers/offers').then((m) => m.Offers),
  },
  {
    path: 'novedades',
    loadComponent: () =>
      import('./features/products/news/news').then((m) => m.News),
  },
  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail').then(
        (m) => m.ProductDetail
      ),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },

  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page').then(
        (m) => m.ProfilePage
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
>>>>>>> cacd9a8403251f6607426fbad780d891657f89c7
];