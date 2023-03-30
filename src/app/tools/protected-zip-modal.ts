import { ModalController } from '@ionic/angular';
import { Entry } from '@zip.js/zip.js';
import {
  CredentialPasswordModalComponent,
  CredentialPasswordModalProps,
} from '../components/credential-password-modal/credential-password-modal.component';

export const handlePasswordProtectedZip = async (
  modalCtrl: ModalController,
  zipFile: Blob,
  mode: 'certificate' | 'proof',
): Promise<Entry[] | null> => {
  const componentProps: CredentialPasswordModalProps = { zipFile, mode };
  const modal = await modalCtrl.create({
    component: CredentialPasswordModalComponent,
    componentProps,
    presentingElement: document.querySelector('.ion-app') as HTMLElement,
  });
  modal.present();

  const result = await modal.onWillDismiss();

  if (result.role === 'confirm') {
    return result.data;
  }

  return null;
};
