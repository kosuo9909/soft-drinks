/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { loadTranslations } from '@angular/localize';
import { registerLocaleData } from '@angular/common';

import { getLocale, importLocale, setLocale } from '../src/locale/i18n';

const locale = getLocale();
setLocale(locale, sessionStorage);

const cacheBuster = Date.now();

Promise.all([
  fetch(`/assets/i18n/${locale}.json?v=${cacheBuster}`),
  importLocale(locale),
])
  .then((responses) => {
    if (!responses[0].ok) {
      throw new Error(`HTTP error ${responses[0].status}`);
    }

    const moduleLocale = responses[1].default[0];

    registerLocaleData(responses[1].default, moduleLocale);

    return responses[0].json();
  })
  .then((result) => {
    loadTranslations(result.translations);

    bootstrapApplication(AppComponent, appConfig).catch((err) =>
      console.error(err)
    );
  });
