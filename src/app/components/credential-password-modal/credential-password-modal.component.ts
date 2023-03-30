import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { IonicModule, IonInput, ModalController } from '@ionic/angular';
import { Entry } from '@zip.js/zip.js';
import { Observable, from, map, catchError, of } from 'rxjs';
import { Zipper } from '../../tools/zipper';

export interface CredentialPasswordModalProps {
  zipFile: Blob;
  mode: 'certificate' | 'proof';
}

@Component({
  selector: 'app-credential-password-modal',
  templateUrl: './credential-password-modal.component.html',
  styleUrls: ['./credential-password-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class CredentialPasswordModalComponent implements AfterViewInit {
  @ViewChild('password', { static: true }) password!: IonInput;

  readonly zipFile!: Blob;
  readonly mode!: 'certificate' | 'proof';

  private readonly entries: Entry[] = [];

  private readonly passwordValidator = (
    control: AbstractControl
  ): Observable<ValidationErrors | null> => {
    return from(
      Zipper.getEntriesWithPassword(
        this.zipFile,
        this.form.get('password')?.value!
      )
    ).pipe(
      map((entries: Entry[]) => {
        this.entries.push(...entries);
        return null;
      }),
      catchError(() => of({ invalidPassword: true }))
    );
  };

  form = new FormGroup({
    password: new FormControl(
      null,
      [Validators.required],
      [this.passwordValidator]
    ),
  });

  constructor(private readonly modalCtrl: ModalController) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.password.setFocus();
    }, 500);
  }

  cancel(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async unlock(): Promise<void> {
    if (this.form.valid) {
      await this.modalCtrl.dismiss(this.entries, 'confirm');
    }
  }
}
