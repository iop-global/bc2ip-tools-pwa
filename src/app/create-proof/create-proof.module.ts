import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CreateProofPageRoutingModule } from './create-proof-routing.module';
import { CreateProofPage } from './create-proof.page';
import { CredentialPasswordModalModule } from '../components/credential-password-modal/credential-password-modal.module';
import { InvalidCertificateModalModule } from '../components/invalid-certificate-modal/invalid-certificate-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreateProofPageRoutingModule,
    CredentialPasswordModalModule,
    InvalidCertificateModalModule,
  ],
  declarations: [CreateProofPage],
})
export class CreateProofPageModule {}
