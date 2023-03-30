import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'create-proof',
    loadComponent: () => import('./pages/create-proof/create-proof.page').then((m) => m.CreateProofPage),
  },
  {
    path: 'inspect-proof',
    loadComponent: () => import('./pages/inspect-proof/inspect-proof.page').then((m) => m.InspectProofPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
