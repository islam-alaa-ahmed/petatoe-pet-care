/* PETATOE Enterprise Translation Service — public runtime configuration.
   Never place provider API keys in this file or any GitHub Pages asset. */
(function(){
  'use strict';
  window.PETATOE_TRANSLATION_CONFIG = Object.freeze({
    enabled: false,
    remoteEnabled: false,
    functionName: 'petatoe-translate',
    sourceLanguage: 'ar',
    supportedLanguages: ['ar','en'],
    requestTimeoutMs: 12000,
    maxTextLength: 1200,
    cacheVersion: 'ets-v1',
    autoTranslateSelectors: [],
    excludedSelectors: [
      '[data-i18n-skip="true"]','[data-translation-skip="true"]',
      'input[type="email"]','input[type="tel"]','input[type="number"]',
      'code','pre','script','style','noscript'
    ]
  });
})();
