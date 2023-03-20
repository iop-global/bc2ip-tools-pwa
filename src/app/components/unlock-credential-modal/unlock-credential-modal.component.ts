import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { IonInput, ModalController } from '@ionic/angular';
import { passwordValidator } from './validators';

export interface UnlockCredentialModalProps {
  credentialFile: Blob;
}

@Component({
  selector: 'app-unlock-credential-modal',
  templateUrl: './unlock-credential-modal.component.html',
  styleUrls: ['./unlock-credential-modal.component.scss'],
})
export class UnlockCredentialModalComponent {
  @ViewChild('password', { static: true }) password!: IonInput;

  readonly credentialFile!: Blob;

  form = new FormGroup({
    password: new FormControl(
      null,
      [Validators.required],
      [(control) => passwordValidator(control, this.credentialFile)]
    ),
  });

  constructor(private readonly modalCtrl: ModalController) {}

  ngAfterViewInit() {
    setTimeout(() => this.password.setFocus(), 500);
  }

  cancel(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async unlock(): Promise<void> {
    if (this.form.valid) {
      await this.modalCtrl.dismiss(this.password.value, 'confirm');
    }
  }
}
