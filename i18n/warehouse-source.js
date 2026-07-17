/* PETATOE v9.4.2 — Warehouse localization compatibility adapter.
 * Canonical translations live only in localization-center/dictionary-store.js.
 */
(function(){
  'use strict';
  function center(){return window.PETATOE_LOCALIZATION_CENTER;}
  function t(key,params){var c=center();return c&&c.t?c.t('warehouseSource.'+key,params,{fallback:key}):key;}
  function locale(){var c=center(),l=c&&c.getLanguage?c.getLanguage():(document.documentElement.lang||'ar');return l==='en'?'en-GB':'ar-EG';}
  window.PETATOE_WAREHOUSE_I18N={version:'9.4.2-center-adapter',t:t,locale:locale,dictionaries:null,source:'PETATOE_LOCALIZATION_CENTER'};
})();
