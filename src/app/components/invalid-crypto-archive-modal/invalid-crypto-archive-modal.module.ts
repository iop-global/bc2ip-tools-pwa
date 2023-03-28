import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InvalidCryptoArchiveModalComponent } from './invalid-crypto-archive-modal.component';

@NgModule({
  declarations: [InvalidCryptoArchiveModalComponent],
  imports: [CommonModule, IonicModule],
  exports: [InvalidCryptoArchiveModalComponent],
})
export class InvalidCryptoArchiveModalModule {}
