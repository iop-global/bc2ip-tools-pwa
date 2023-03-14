import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InspectProofPage } from './inspect-proof.page';

const routes: Routes = [
  {
    path: '',
    component: InspectProofPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InspectProofPageRoutingModule {}
