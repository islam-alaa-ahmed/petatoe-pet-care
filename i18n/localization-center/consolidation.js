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
      var reverseRuntimeIndex=null;
      function buildReverseRuntimeIndex(){
        var out={ar:Object.create(null),en:Object.create(null)},langs=['ar','en'];
        function pairPath(path){
          var ar=store.getPath('ar',path),en=store.getPath('en',path);
          if(typeof ar!=='string'||typeof en!=='string'||!ar||!en)return;
          out.ar[normalizeText(en)]=ar;
          out.en[normalizeText(ar)]=en;
        }
        function walk(obj,path){
          Object.keys(obj||{}).forEach(function(key){
            var next=path?path+'.'+key:key,value=obj[key];
            if(value&&typeof value==='object'&&!Array.isArray(value))walk(value,next);
            else if(typeof value==='string')pairPath(next);
          });
        }
        var dictionaries=store.dictionaries||{};walk(dictionaries.ar||{},'');
        return out;
      }
      function canonicalRuntimePhrase(text,lang){
        var translated=store.getPath(lang,'runtimeSource.'+text);
        if(typeof translated==='string'&&translated)return translated;
        translated=store.getPath(lang,'globalUiSource.'+text);
        if(typeof translated==='string'&&translated)return translated;
        var hash=hashText(text);
        translated=store.getPath(lang,'runtimePhrases.'+hash);
        if(typeof translated==='string'&&translated)return translated;
        translated=store.getPath(lang,'autoPhrases.'+hash);
        if(typeof translated==='string'&&translated)return translated;
        if(!reverseRuntimeIndex)reverseRuntimeIndex=buildReverseRuntimeIndex();
        translated=reverseRuntimeIndex[lang]&&reverseRuntimeIndex[lang][normalizeText(text)];
        return typeof translated==='string'&&translated?translated:'';
      }
      function runtimeValue(value,targetLang,params){
        if(value==null)return value;
        var text=String(value),lang=language(targetLang),translated=canonicalRuntimePhrase(text,lang);
        if(typeof translated==='string'&&translated){
          if(lang==='en'&&hasArabic(translated))translated='';
          if(lang==='ar'&&!hasArabic(translated)&&/[A-Za-z]/.test(translated)&&translated!==text)translated='';
        }
        return interpolate(translated||text,params);
      }
    
      window.addEventListener('petatoe:localization-ready',function(){reverseRuntimeIndex=null;});
      window.addEventListener('petatoe:localization-center-store-ready',function(){reverseRuntimeIndex=null;});
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
