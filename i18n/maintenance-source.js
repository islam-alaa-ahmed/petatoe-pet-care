/* PETATOE v9.4.4 — Maintenance localization compatibility adapter. */
(function(){
  'use strict';
  window.PETATOE_MAINTENANCE_I18N={
    version:'9.4.4-lockdown-adapter',
    t:function(key,params){var c=window.PETATOE_LOCALIZATION_CENTER,s=window.PETATOE_LOCALIZATION_CENTER_STORE,lang=(c&&c.getLanguage?c.getLanguage():(document.documentElement.lang||'ar')),value=c&&c.t?c.t('maintenanceSource.'+key,params,{fallback:'',allowKeyFallback:false}):'';if((value==null||value==='')&&s&&s.getPath)value=s.getPath(lang,'maintenanceSource.'+key);return typeof value==='string'&&value?value:String(key||'');},
    source:'PETATOE_LOCALIZATION_CENTER'
  };
})();
