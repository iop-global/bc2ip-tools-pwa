import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CertificateValidationResult } from '../../services/certificate-service.service';

export interface InvalidCertificateModalProps {
  result: CertificateValidationResult;
  certificateName: string;
}

@Component({
  selector: 'app-invalid-certificate-modal',
  templateUrl: './invalid-certificate-modal.component.html',
  styleUrls: ['./invalid-certificate-modal.component.scss'],
})
export class InvalidCertificateModalComponent {
  props!: InvalidCertificateModalProps;

  constructor(private readonly modalCtrl: ModalController) {}

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}
