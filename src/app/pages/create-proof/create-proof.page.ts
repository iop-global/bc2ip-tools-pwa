import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, CheckboxCustomEvent, IonicModule, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Entry } from '@zip.js/zip.js';
import {
  InvalidCryptoArchiveModalProps,
  InvalidCryptoArchiveModalComponent,
} from '../../components/invalid-crypto-archive-modal/invalid-crypto-archive-modal.component';
import {
  UnlockCredentialModalComponent,
  UnlockCredentialModalProps,
} from '../../components/unlock-credential-modal/unlock-credential-modal.component';
import { getSignerFromCredential, CryptoValidationResult } from '../../tools/crypto';
import { handlePasswordProtectedZip } from '../../tools/protected-zip-modal';
import { Zipper } from '../../tools/zipper';
import { ValidatedCreateProofFormResult } from '../../types/create-proof-form';
import { passwordRepeatValidator, passwordStrengthValidator } from './validators';
import { CredentialPasswordModalComponent } from '../../components/credential-password-modal/credential-password-modal.component';
import { CertificateService } from '../../services/certificate.service';
import { CertificateData } from '../../types/common';
import { ProofService } from '../../services/proof.service';
import { SignedWitnessStatement } from '../../types/schemas/common/statement';

@Component({
  selector: 'app-create-proof',
  templateUrl: './create-proof.page.html',
  styleUrls: ['./create-proof.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    CredentialPasswordModalComponent,
    InvalidCryptoArchiveModalComponent,
    UnlockCredentialModalComponent,
  ],
})
export class CreateProofPage {
  @ViewChild('certificateFileControl', { static: true })
  certificateFileControl!: ElementRef;
  @ViewChild('credentialFileControl', { static: true })
  credentialFileControl!: ElementRef;

  currentStep = 1;
  selectedCertificate = '';
  certificateEntries: Entry[] = [];
  certificateData: CertificateData | null = null;
  certificateStatement: SignedWitnessStatement<unknown> | null = null;
  form!: FormGroup;
  formSubmitted = false;
  formResult: ValidatedCreateProofFormResult | null = null;
  now = new Date().toISOString();

  removeTime = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly certificateService: CertificateService,
    private readonly proofService: ProofService,
    private readonly alertController: AlertController,
    private readonly router: Router,
  ) {}

  gotoStep3(result: ValidatedCreateProofFormResult): void {
    this.currentStep = 3;
    this.formResult = result;
  }

  goto(step: 1 | 2): void {
    switch (step) {
      case 1:
        this.currentStep = 1;
        this.selectedCertificate = '';
        this.certificateEntries = [];
        this.certificateData = null;
        this.certificateStatement = null;
        this.certificateFileControl.nativeElement.value = '';
        this.credentialFileControl.nativeElement.value = '';
        this.formResult = null;
        break;
      case 2:
        this.currentStep = 2;
        this.formResult = null;
        break;
      default:
        throw new Error(`Unknown step: ${step}`);
    }
  }

  hasErrors(field: string): boolean {
    const subimmtedOrTouched = this.form.get(field)?.dirty || this.formSubmitted;
    const hasErrors = !!this.form.get(field)?.errors;
    return subimmtedOrTouched && hasErrors;
  }

  onPasswordChange(_: Event): void {
    if (this.form.get('passwordRepeat')?.touched) {
      this.form.get('passwordRepeat')?.updateValueAndValidity();
    }
  }

  async selectCertificate(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      const zipFile = files[0];
      const entries = (await Zipper.doesRequirePassword(zipFile))
        ? await handlePasswordProtectedZip(this.modalCtrl, zipFile, 'certificate')
        : await Zipper.getEntries(zipFile);

      if (!entries) {
        this.certificateFileControl.nativeElement.value = '';
        return;
      }

      this.certificateEntries = entries;

      const validationResult = await this.certificateService.validate(this.certificateEntries);

      if (!validationResult.isValid()) {
        await this.handleInvalidCertificate(validationResult, zipFile.name);
        return;
      }

      this.selectedCertificate = zipFile.name;
      const { data, statement } = await this.certificateService.extractData(this.certificateEntries);
      this.certificateData = data;
      this.certificateStatement = statement;
      this.form = new FormGroup({
        purpose: new FormControl(null, [Validators.required]),
        validUntil: new FormControl(new Date().toISOString(), [Validators.required]),
        password: new FormControl(null, [Validators.required, passwordStrengthValidator]),
        passwordRepeat: new FormControl(null, [Validators.required, passwordRepeatValidator]),
        shareProjectName: new FormControl(false),
        shareProjectDescription: new FormControl(false),
        shareVersionDescription: new FormControl(false),
        shareVersionSealer: new FormControl(false),
        files: new FormGroup(
          this.certificateData.files.map(
            (f) =>
              new FormGroup({
                shareFile: new FormControl(false),
                fileName: new FormControl(f.name),
                uploader: new FormControl(false),
                authors: new FormGroup(f.authors.map((_) => new FormControl(false))),
                owners: new FormGroup(f.owners.map((_) => new FormControl(false))),
              }),
          ),
        ),
      });

      this.certificateService.adjustFormToSchema(this.form, data.schemaVersion);

      this.goto(2);
    }
  }

  async selectCredential(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      const credentialFile = files[0];
      const componentProps: UnlockCredentialModalProps = { credentialFile };
      const modal = await this.modalCtrl.create({
        component: UnlockCredentialModalComponent,
        componentProps,
      });
      await modal.present();
      const result = await modal.onWillDismiss<string>();
      this.credentialFileControl.nativeElement.value = '';

      if (result.role !== 'confirm') {
        return;
      }

      await this.proofService.createAndDownload(
        this.formResult!,
        this.certificateStatement!,
        this.certificateData!.projectName,
        this.certificateData!.versionId,
        this.certificateEntries,
        await getSignerFromCredential(credentialFile, result.data!),
      );

      const alert = await this.alertController.create({
        header: $localize`Success`,
        message: $localize`Your proof has been downloaded`,
        buttons: [$localize`OK`],
      });
      await alert.present();
      await alert.onWillDismiss();

      await this.router.navigate(['/home']);
    }
  }

  async proofContentSelected(): Promise<void> {
    if (!this.form.get('passwordRepeat')?.touched) {
      this.form.get('passwordRepeat')?.updateValueAndValidity();
    }

    this.formSubmitted = true;

    if (!this.form.valid) {
      return;
    }

    if (!this.isSomethingToBeShared(this.form.value)) {
      const alert = await this.alertController.create({
        header: $localize`Cannot create proof`,
        message: $localize`You must select at least one file or any of the project's properties`,
        buttons: [$localize`OK`],
      });

      await alert.present();
      return;
    }

    this.gotoStep3(this.form.value);
  }

  private isSomethingToBeShared(formValue: ValidatedCreateProofFormResult): boolean {
    const atLeastOneFileSelected = Object.values(formValue.files).some((file) => file.shareFile);

    return (
      formValue.shareProjectDescription === true ||
      formValue.shareProjectName === true ||
      formValue.shareVersionDescription === true ||
      formValue.shareVersionSealer === true ||
      atLeastOneFileSelected
    );
  }

  private async handleInvalidCertificate(result: CryptoValidationResult, certificateName: string): Promise<void> {
    const props: InvalidCryptoArchiveModalProps = {
      result,
      archiveName: certificateName,
      mode: 'certificate',
    };
    const modal = await this.modalCtrl.create({
      component: InvalidCryptoArchiveModalComponent,
      componentProps: { props },
      presentingElement: document.querySelector('.ion-app') as HTMLElement,
    });
    await modal.present();
    this.goto(1);
  }
}
