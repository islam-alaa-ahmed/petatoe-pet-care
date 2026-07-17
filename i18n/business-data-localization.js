/* PETATOE v9.4.3 — Business data localization compatibility adapter.
 * Translation data and resolution logic live inside the Localization Center.
 */
(function(){
  'use strict';
  function engine(){return window.PETATOE_LOCALIZATION_CENTER_BUSINESS||{};}
  function call(name,args,fallback){var e=engine(),fn=e[name];return typeof fn==='function'?fn.apply(e,args):fallback;}
  window.PETATOE_BUSINESS_DATA_I18N={
    version:'9.4.3-center-adapter',source:'PETATOE_LOCALIZATION_CENTER',
    resolve:function(type,value,lang){return call('resolve',arguments,value);},
    canonical:function(type,value){return call('canonical',arguments,value);},
    localizeRecord:function(record,lang){return call('localizeRecord',arguments,record);},
    render:function(type,value,lang){return call('render',arguments,value);},
    renderRecord:function(record,lang){return call('renderRecord',arguments,record);},
    renderList:function(type,values,lang){return call('renderList',arguments,Array.isArray(values)?values:[]);},
    translateServiceName:function(value,lang){return call('translateServiceName',arguments,value);},
    invalidate:function(){return call('invalidate',arguments,true);},
    getLanguage:function(){var c=window.PETATOE_LOCALIZATION_CENTER;return c&&c.getLanguage?c.getLanguage():(document.documentElement.lang||'ar');}
  };
})();
