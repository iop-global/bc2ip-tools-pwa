import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateProofComponent } from './components/generate-proof/generate-proof.component';
import { HomeComponent } from './components/home/home.component';
import { InspectProofComponent } from './components/inspect-proof/inspect-proof.component';

const routes: Routes = [
  {
    path: 'generate-proof',
    component: GenerateProofComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'inspect-proof',
    component: InspectProofComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
