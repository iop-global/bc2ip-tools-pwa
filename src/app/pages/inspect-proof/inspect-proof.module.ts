import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InspectProofPageRoutingModule } from './inspect-proof-routing.module';

import { InspectProofPage } from './inspect-proof.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InspectProofPageRoutingModule
  ],
  declarations: [InspectProofPage]
})
export class InspectProofPageModule {}
