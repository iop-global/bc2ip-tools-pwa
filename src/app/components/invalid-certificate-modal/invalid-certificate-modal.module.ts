import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InvalidCertificateModalComponent } from './invalid-certificate-modal.component';

@NgModule({
  declarations: [InvalidCertificateModalComponent],
  imports: [CommonModule, IonicModule],
  exports: [InvalidCertificateModalComponent],
})
export class InvalidCertificateModalModule {}
