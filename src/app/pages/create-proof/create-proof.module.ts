import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CreateProofPageRoutingModule } from './create-proof-routing.module';
import { CreateProofPage } from './create-proof.page';
import { CredentialPasswordModalModule } from '../../components/credential-password-modal/credential-password-modal.module';
import { InvalidCryptoArchiveModalModule } from '../../components/invalid-crypto-archive-modal/invalid-crypto-archive-modal.module';
import { UnlockCredentialModalModule } from '../../components/unlock-credential-modal/unlock-credential-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CreateProofPageRoutingModule,
    CredentialPasswordModalModule,
    InvalidCryptoArchiveModalModule,
    UnlockCredentialModalModule,
  ],
  declarations: [CreateProofPage],
})
export class CreateProofPageModule {}
