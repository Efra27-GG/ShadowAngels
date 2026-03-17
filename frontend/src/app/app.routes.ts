import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { superAdminGuard } from './core/guards/superadmin.guard';


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
      import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'carrito',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cart/cart-page/cart-page').then((m) => m.CartPageComponent),
  },

  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/admin-login/admin-login').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'admin/productos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/products-admin/products-admin').then(
        (m) => m.ProductsAdminComponent
      ),
  },
  {
    path: 'admin/solicitudes',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/solicitudes-admin/solicitudes-admin').then(
        (m) => m.SolicitudesAdminComponent
      ),
  },
  {
    path: 'admin/resenas',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/reviews-admin/reviews-admin').then(
        (m) => m.ReviewsAdminComponent
      ),
  },
  {
    path: 'admin/perfil',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-profile/admin-profile').then(
        (m) => m.AdminProfileComponent
      ),
  },
  {
    path: 'admin/admins',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admins-admin/admins-admin').then(
        (m) => m.AdminsAdminComponent
      ),
  },
  {
    path: 'admin/contacto',
    canActivate: [superAdminGuard],
    loadComponent: () =>
      import('./features/admin/contact-admin/contact-admin').then(
        (m) => m.ContactAdminComponent
      ),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
