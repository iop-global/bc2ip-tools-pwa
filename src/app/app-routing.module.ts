import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'create-proof',
    loadChildren: () =>
      import('./pages/create-proof/create-proof.module').then(
        (m) => m.CreateProofPageModule
      ),
  },
  {
    path: 'inspect-proof',
    loadChildren: () =>
      import('./pages/inspect-proof/inspect-proof.module').then(
        (m) => m.InspectProofPageModule
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
