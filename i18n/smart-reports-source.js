/* PETATOE v9.4.3 — Smart Reports compatibility adapter.
 * No dictionary is stored here. Canonical translations live in the Localization Center store.
 */
(function(){
  'use strict';
  function languagePack(lang){
    var store=window.PETATOE_LOCALIZATION_CENTER_STORE;
    return store&&store.getPath?store.getPath(lang||'ar','smartReportsSource')||{}:{};
  }
  Object.defineProperty(window,'PETATOE_SMART_REPORTS_TRANSLATIONS',{configurable:true,enumerable:false,get:function(){return {ar:languagePack('ar'),en:languagePack('en'),__adapter:true,source:'PETATOE_LOCALIZATION_CENTER'};}});
})();
