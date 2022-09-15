import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IopTranslationService {
  readonly translations: { [key: string]: string } = {
    'Cancel selected file': $localize`Cancel selected file`,
    'Set up proof': $localize`Set up proof`,
    'Sign proof': $localize`Sign proof`,
    'Upload proof': $localize`Upload proof`,
    'Validate content': $localize`Validate content`,
    'Verified files': $localize`Verified files`,
  };

  getTranslation(value: string) {
    const translation = this.translations[value];

    if (translation === undefined) {
      throw `Translation definition is missing for ${value}`;
    }

    return translation;
  }
}
