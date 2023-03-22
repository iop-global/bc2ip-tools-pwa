import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateProofPage } from './create-proof.page';

const routes: Routes = [
  {
    path: '',
    component: CreateProofPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateProofPageRoutingModule {}
