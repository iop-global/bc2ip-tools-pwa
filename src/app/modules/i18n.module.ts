import { APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { I18nService } from '../services/i18n.service';

// Load locale data at app start-up
function setLocale() {
  return {
    provide: APP_INITIALIZER,
    useFactory: (i18n: I18nService) => () => i18n.loadTranslation(),
    deps: [I18nService],
    multi: true,
  };
}

// Set the runtime locale for the app
function setLocaleId() {
  return {
    provide: LOCALE_ID,
    useFactory: (i18n: I18nService) => i18n.locale,
    deps: [I18nService],
  };
}

export const I18nModule = {
  setLocale: setLocale,
  setLocaleId: setLocaleId,
};
