/* PETATOE v9.4.4 — Enterprise Single Source Localization Enforcement.
 * This bridge contains no translations. Every compatibility API resolves through the canonical store.
 */
(function(){
  'use strict';
  var initialized=false;

  function initializeConsolidation(){
    if(initialized)return true;
    var center=window.PETATOE_LOCALIZATION_CENTER;
    var store=window.PETATOE_LOCALIZATION_CENTER_STORE;
    if(!center||!store)return false;
    initialized=true;

      function hasArabic(value){return /[\u0600-\u06FF]/.test(String(value==null?'':value));}
      function interpolate(value,params){var out=String(value==null?'':value);Object.keys(params||{}).forEach(function(k){out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});return out;}
      function language(target){return target||(center.getLanguage?center.getLanguage():(document.documentElement.lang||'ar'));}
      function normalizeText(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
      function hashText(value){var str=normalizeText(value),h=0x811c9dc5;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return 'h'+('00000000'+(h>>>0).toString(16)).slice(-8);}
      function canonicalRuntimePhrase(text,lang){
        if(lang!=='en')return '';
        var translated=store.getPath('en','runtimeSource.'+text);
        if(typeof translated==='string'&&translated)return translated;
        translated=store.getPath('en','globalUiSource.'+text);
        if(typeof translated==='string'&&translated)return translated;
        var hash=hashText(text);
        translated=store.getPath('en','runtimePhrases.'+hash);
        if(typeof translated==='string'&&translated)return translated;
        translated=store.getPath('en','autoPhrases.'+hash);
        return typeof translated==='string'&&translated?translated:'';
      }
      function runtimeValue(value,targetLang,params){
        if(value==null)return value;
        var text=String(value),lang=language(targetLang);
        if(lang!=='en')return interpolate(text,params);
        var translated=canonicalRuntimePhrase(text,'en');
        if(typeof translated==='string'&&translated&&hasArabic(translated))translated='';
        return interpolate(translated||text,params);
      }
    
      center.translateRuntime=runtimeValue;
      center.runtimeDictionary={source:'PETATOE_LOCALIZATION_CENTER_STORE',count:Object.keys(store.getPath('en','runtimeSource')||{}).length};
      center.__singleSourceEnforced=true;
    
      var legacy=window.PETATOE_I18N=window.PETATOE_I18N||{};
      legacy.translateRuntime=function(value,targetLang,params){return center.translateRuntime(value,targetLang,params);};
      legacy.translate=function(key,targetLang){return center.translate(key,key,targetLang);};
    
      /* Source adapters remain the single owner of module key lookup. Do not replace them with a second, lossy resolver. */
    
      window.dispatchEvent(new CustomEvent('petatoe:localization-single-source-enforced',{detail:{version:'9.4.4',storeVersion:store.version,runtimeEntries:center.runtimeDictionary.count}}));
    return true;
  }

  if(!initializeConsolidation()){
    var retry=function(){initializeConsolidation();};
    window.addEventListener('petatoe:localization-center-ready',retry,{once:true});
    window.addEventListener('petatoe:localization-ready',retry,{once:true});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retry,{once:true});
    else window.setTimeout(retry,0);
  }
})();
