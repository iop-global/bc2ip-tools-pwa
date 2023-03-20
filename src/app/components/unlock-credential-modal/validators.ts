import { from, map, Observable, of } from 'rxjs';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { tryUnlockCredential } from '../../tools/crypto';

export const passwordValidator = (
  control: AbstractControl,
  credentialFile: Blob
): Observable<ValidationErrors | null> => {
  if (!credentialFile) {
    return of({ invalidPassword: true });
  }

  return from(tryUnlockCredential(credentialFile, control.value)).pipe(
    map((unlocked) => (unlocked ? null : { invalidPassword: true }))
  );
};
