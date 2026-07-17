/* PETATOE v9.4.3 — Operations localization compatibility adapter.
 * Canonical translations live only in localization-center/dictionary-store.js.
 */
(function(){
  'use strict';
  function center(){return window.PETATOE_LOCALIZATION_CENTER;}
  function t(key,params){var c=center();return c&&c.t?c.t('operationsSource.'+key,params,{fallback:key}):key;}
  window.PETATOE_OPERATIONS_I18N={version:'9.4.3-center-adapter',t:t,dictionaries:null,source:'PETATOE_LOCALIZATION_CENTER'};
})();
