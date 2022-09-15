import { Pipe, PipeTransform } from '@angular/core';
import { IopTranslationService } from '../services/translation.service';

@Pipe({ name: 'localize' })
export class IopLocalizePipe implements PipeTransform {
  constructor(readonly translation: IopTranslationService) {}
  transform(value: string) {
    return this.translation.getTranslation(value);
  }
}
