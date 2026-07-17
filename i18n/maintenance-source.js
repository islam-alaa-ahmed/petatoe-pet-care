/* PETATOE v9.4.3 — Maintenance localization compatibility adapter. */
(function(){
  'use strict';
  window.PETATOE_MAINTENANCE_I18N={
    version:'9.4.3-center-adapter',
    t:function(key,params){var c=window.PETATOE_LOCALIZATION_CENTER;return c&&c.t?c.t('maintenanceSource.'+key,params,{fallback:key}):key;},
    source:'PETATOE_LOCALIZATION_CENTER'
  };
})();
