import { Routes } from '@angular/router';

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

];