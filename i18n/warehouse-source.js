/* PETATOE v9.4.4 — Warehouse localization compatibility adapter.
 * Canonical translations live only in localization-center/dictionary-store.js.
 */
(function(){
  'use strict';
  function center(){return window.PETATOE_LOCALIZATION_CENTER;}
  function t(key,params){var c=center(),s=window.PETATOE_LOCALIZATION_CENTER_STORE,lang=(c&&c.getLanguage?c.getLanguage():(document.documentElement.lang||'ar')),value=c&&c.t?c.t('warehouseSource.'+key,params,{fallback:'',allowKeyFallback:false}):'';if((value==null||value==='')&&s&&s.getPath)value=s.getPath(lang,'warehouseSource.'+key);return typeof value==='string'&&value?value:String(key||'');}
  function locale(){var c=center(),l=c&&c.getLanguage?c.getLanguage():(document.documentElement.lang||'ar');return l==='en'?'en-GB':'ar-EG';}
  window.PETATOE_WAREHOUSE_I18N={version:'9.4.4-lockdown-adapter',t:t,locale:locale,dictionaries:null,source:'PETATOE_LOCALIZATION_CENTER'};
})();
