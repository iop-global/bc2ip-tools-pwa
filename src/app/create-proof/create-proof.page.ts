import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Entry } from '@zip.js/zip.js';
import {
  CredentialPasswordModalComponent,
  CredentialPasswordModalProps,
} from '../components/credential-password-modal/credential-password-modal.component';
import {
  InvalidCertificateModalComponent,
  InvalidCertificateModalProps,
} from '../components/invalid-certificate-modal/invalid-certificate-modal.component';
import { CertificateServiceService } from '../services/certificate-service.service';
import { Zipper } from '../tools/zipper';

@Component({
  selector: 'app-create-proof',
  templateUrl: './create-proof.page.html',
  styleUrls: ['./create-proof.page.scss'],
})
export class CreateProofPage {
  currentStep = 1;
  selectedCertificate = '';
  step1Completed = false;

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly certificateService: CertificateServiceService
  ) {}

  startOver(): void {
    this.currentStep = 1;
    this.selectedCertificate = '';
    this.step1Completed = false;
  }

  async selectFile(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      const zipFile = files[0];
      const entries = (await Zipper.doesRequirePassword(zipFile))
        ? await this.handlePasswordProtectedZip(zipFile)
        : await Zipper.getEntries(zipFile);

      const validationResult = await this.certificateService.validate(entries);

      if (!validationResult.isValid()) {
        const props: InvalidCertificateModalProps = {
          result: validationResult,
          certificateName: zipFile.name,
        };
        const modal = await this.modalCtrl.create({
          component: InvalidCertificateModalComponent,
          componentProps: { props },
          presentingElement: document.querySelector('.ion-app') as HTMLElement,
        });
        modal.present();
        this.startOver();
        (event!.target as HTMLInputElement).value = '';
        return;
      } else {
        this.selectedCertificate = zipFile.name;
        this.currentStep = 2;
        this.step1Completed = true;
      }

      (event!.target as HTMLInputElement).value = '';
    }
  }

  private async handlePasswordProtectedZip(zipFile: Blob): Promise<Entry[]> {
    const componentProps: CredentialPasswordModalProps = { zipFile };
    const modal = await this.modalCtrl.create({
      component: CredentialPasswordModalComponent,
      componentProps,
      presentingElement: document.querySelector('.ion-app') as HTMLElement,
    });
    modal.present();

    const result = await modal.onWillDismiss();

    if (result.role === 'confirm') {
      return result.data;
    }

    return [];
  }
}
