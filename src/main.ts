/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { loadTranslations } from '@angular/localize';
import { registerLocaleData } from '@angular/common';

import {
  getLocale,
  importLocale,
  importTranslation,
  setLocale,
} from '../src/locale/i18n';

const locale = getLocale();
setLocale(locale, sessionStorage);

Promise.all([importTranslation(locale), importLocale(locale)])
  .then((responses) => {
    const moduleLocale = responses[1].default[0];

    registerLocaleData(responses[1].default, moduleLocale);

    return responses[0];
  })
  .then((result) => {
    loadTranslations(result.translations);

    bootstrapApplication(AppComponent, appConfig).catch((err) =>
      console.error(err)
    );
  })
  .catch((error) => {
    console.error(error);
    bootstrapApplication(AppComponent, appConfig).catch((err) =>
      console.error(err)
    );
  });
