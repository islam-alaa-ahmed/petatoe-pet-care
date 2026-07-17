/* PETATOE v9.4.2 — Enterprise Single Source Localization Enforcement.
 * This bridge contains no translations. Every compatibility API resolves through the canonical store.
 */
(function(){
  'use strict';
  var center=window.PETATOE_LOCALIZATION_CENTER;
  var store=window.PETATOE_LOCALIZATION_CENTER_STORE;
  if(!center||!store)throw new Error('PETATOE Localization Center must load before consolidation');

  function hasArabic(value){return /[\u0600-\u06FF]/.test(String(value==null?'':value));}
  function interpolate(value,params){var out=String(value==null?'':value);Object.keys(params||{}).forEach(function(k){out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});return out;}
  function language(target){return target||(center.getLanguage?center.getLanguage():(document.documentElement.lang||'ar'));}
  function runtimeValue(value,targetLang,params){
    if(value==null)return value;
    var text=String(value),lang=language(targetLang);
    if(lang==='ar')return interpolate(text,params);
    var translated=store.getPath(lang,'runtimeSource.'+text);
    if(typeof translated!=='string'||!translated||hasArabic(translated))translated=store.getPath(lang,'globalUiSource.'+text);
    return interpolate(typeof translated==='string'&&translated&&!hasArabic(translated)?translated:text,params);
  }

  center.translateRuntime=runtimeValue;
  center.runtimeDictionary={source:'PETATOE_LOCALIZATION_CENTER_STORE',count:Object.keys(store.getPath('en','runtimeSource')||{}).length};
  center.__singleSourceEnforced=true;

  var legacy=window.PETATOE_I18N=window.PETATOE_I18N||{};
  legacy.translateRuntime=function(value,targetLang,params){return center.translateRuntime(value,targetLang,params);};
  legacy.translate=function(key,targetLang){return center.translate(key,key,targetLang);};

  if(window.PETATOE_OPERATIONS_I18N)window.PETATOE_OPERATIONS_I18N.t=function(key,params){return center.t('operationsSource.'+key,params,{fallback:key});};
  if(window.PETATOE_WAREHOUSE_I18N)window.PETATOE_WAREHOUSE_I18N.t=function(key,params){return center.t('warehouseSource.'+key,params,{fallback:key});};

  window.dispatchEvent(new CustomEvent('petatoe:localization-single-source-enforced',{detail:{version:'9.4.2',storeVersion:store.version,runtimeEntries:center.runtimeDictionary.count}}));
})();
