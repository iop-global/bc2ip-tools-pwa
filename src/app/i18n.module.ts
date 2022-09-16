import { registerLocaleData } from '@angular/common';
import { APP_INITIALIZER, Injectable, LOCALE_ID } from '@angular/core';
import { loadTranslations } from '@angular/localize';

@Injectable({
  providedIn: 'root',
})
class I18n {
  locale =
    localStorage.getItem('locale') ??
    (navigator.language.slice(0, 2) === 'de' ? 'de' : 'en');

  async setLocale() {
    // Use web pack magic string to only include required locale data
    const localeModule = await import(
      /* webpackInclude: /(de|en)\.mjs$/ */
      `node_modules/@angular/common/locales/${this.locale}.mjs`
    );

    // Set locale for built in pipes, etc.
    registerLocaleData(localeModule.default);

    if (this.locale !== 'en') {
      await import(`src/assets/locales/${this.locale}/messages.json`).then(
        (m) => loadTranslations(m.default)
      );
    }
  }
}

// Load locale data at app start-up
function setLocale() {
  return {
    provide: APP_INITIALIZER,
    useFactory: (i18n: I18n) => () => i18n.setLocale(),
    deps: [I18n],
    multi: true,
  };
}

// Set the runtime locale for the app
function setLocaleId() {
  return {
    provide: LOCALE_ID,
    useFactory: (i18n: I18n) => i18n.locale,
    deps: [I18n],
  };
}

export const I18nModule = {
  setLocale: setLocale,
  setLocaleId: setLocaleId,
};
