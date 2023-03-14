import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CredentialPasswordModalComponent } from './credential-password-modal.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [CredentialPasswordModalComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  exports: [CredentialPasswordModalComponent],
})
export class CredentialPasswordModalModule {}
