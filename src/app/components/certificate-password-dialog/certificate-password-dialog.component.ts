import { Component, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'iop-certificate-password-dialog',
  templateUrl: './certificate-password-dialog.component.html',
})
export class IopCertificatePasswordDialogComponent {
  readonly passwordForm = new FormGroup({
    password: new FormControl(''),
  });

  constructor(
    readonly dialogRef: MatDialogRef<IopCertificatePasswordDialogComponent>
  ) {}

  get passwordControl() {
    return this.passwordForm.get('password')!;
  }

  submit() {
    this.dialogRef.close(this.passwordControl.value);
  }
}
