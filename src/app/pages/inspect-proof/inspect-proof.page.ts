import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Entry, BlobWriter } from '@zip.js/zip.js';
import {
  InvalidCryptoArchiveModalProps,
  InvalidCryptoArchiveModalComponent,
} from '../../components/invalid-crypto-archive-modal/invalid-crypto-archive-modal.component';
import { ProofData, ProofService } from '../../services/proof.service';
import { CryptoValidationResult } from '../../tools/crypto';
import { handlePasswordProtectedZip } from '../../tools/protected-zip-modal';
import { Zipper } from '../../tools/zipper';

@Component({
  selector: 'app-inspect-proof',
  templateUrl: './inspect-proof.page.html',
  styleUrls: ['./inspect-proof.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class InspectProofPage {
  @ViewChild('proofFileControl', { static: true })
  proofFileControl!: ElementRef;
  selectedProof: string | null = null;
  proofData: ProofData | null = null;

  private proofEntries: Entry[] = [];

  constructor(
    private readonly proofService: ProofService,
    private readonly modalCtrl: ModalController
  ) {}

  async selectProof(event: Event): Promise<void> {
    const files = (event.target as HTMLInputElement).files;

    if (!!files && files.length === 1) {
      const zipFile = files[0];
      const entries = (await Zipper.doesRequirePassword(zipFile))
        ? await handlePasswordProtectedZip(this.modalCtrl, zipFile, 'proof')
        : await Zipper.getEntries(zipFile);

      if (!entries) {
        this.proofFileControl.nativeElement.value = '';
        return;
      }

      this.proofEntries = entries;

      const validationResult = await this.proofService.validate(entries);

      if (!validationResult.isValid()) {
        await this.handleInvalidProof(validationResult, zipFile.name);
        return;
      }

      const presentation = await this.proofService.extractPresentation(entries);
      this.proofData = await this.proofService.getProofData(presentation);
      this.selectedProof = zipFile.name;
    }
  }

  startOver(): void {
    this.selectedProof = null;
    this.proofData = null;
    this.proofEntries = [];
  }

  async downloadFile(fileName: string): Promise<void> {
    const file = await this.proofEntries.find((e) => e.filename === fileName)!
      .getData!(new BlobWriter());
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  private async handleInvalidProof(
    result: CryptoValidationResult,
    proofName: string
  ): Promise<void> {
    const props: InvalidCryptoArchiveModalProps = {
      result,
      archiveName: proofName,
      mode: 'proof',
    };
    const modal = await this.modalCtrl.create({
      component: InvalidCryptoArchiveModalComponent,
      componentProps: { props },
      presentingElement: document.querySelector('.ion-app') as HTMLElement,
    });
    await modal.present();
  }
}
