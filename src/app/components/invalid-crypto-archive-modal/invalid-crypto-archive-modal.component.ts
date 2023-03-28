import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CryptoValidationResult } from '../../tools/crypto';

export interface InvalidCryptoArchiveModalProps {
  result: CryptoValidationResult;
  archiveName: string;
  mode: 'certificate' | 'proof';
}

@Component({
  selector: 'app-invalid-crypto-archive-modal',
  templateUrl: './invalid-crypto-archive-modal.component.html',
  styleUrls: ['./invalid-crypto-archive-modal.component.scss'],
})
export class InvalidCryptoArchiveModalComponent {
  props!: InvalidCryptoArchiveModalProps;

  constructor(private readonly modalCtrl: ModalController) {}

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  isCertificate(): boolean {
    return this.props.mode === 'certificate';
  }

  isProof(): boolean {
    return this.props.mode === 'proof';
  }
}
