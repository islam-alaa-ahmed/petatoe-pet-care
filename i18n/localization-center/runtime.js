/* PETATOE v9.1 - Unified Enterprise Localization Center v2.0 */
(function(){
  'use strict';
  var VERSION='9.1.0-unified-center-v2';
  var ready=false;
  var listeners=[];
  function api(){return window.PETATOE_I18N||null;}
  function registry(){return window.PETATOE_LOCALIZATION_REGISTRY||null;}
  function currentLanguage(){var a=api();return a&&a.getLanguage?a.getLanguage():(document.documentElement.lang||'ar');}
  function hasArabic(v){return /[\u0600-\u06FF]/.test(String(v==null?'':v));}
  function interpolate(v,p){var out=String(v==null?'':v);Object.keys(p||{}).forEach(function(k){out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(p[k]));});return out;}
  function smartPackValue(key,lang){var p=window.PETATOE_SMART_REPORTS_TRANSLATIONS;return p&&p[lang]&&p[lang][key];}
  function resolveValue(key,options){
    options=options||{};var lang=options.lang||currentLanguage(),value;
    var a=api();
    if(a&&a.translate)value=a.translate(key,lang);
    if((value===undefined||value===null||value==='')&&key.indexOf('smartReportsSource.')===0){value=smartPackValue(key.slice(19),lang);}
    if(typeof value==='string')value=interpolate(value,options.params);
    if(lang==='en'&&typeof value==='string'&&hasArabic(value))value='';
    if((value===undefined||value===null||value==='')&&options.fallback!=null){
      var fb=String(options.fallback);
      if(lang==='en'&&hasArabic(fb)){
        if(a&&a.translateRuntime){var rt=a.translateRuntime(fb,'en');if(typeof rt==='string'&&!hasArabic(rt)&&rt!==fb)value=rt;}
        if(!value)value=options.allowKeyFallback===false?'':key;
      }else value=fb;
    }
    return interpolate(value==null?'':value,options.params);
  }
  function t(key,params,options){options=options||{};options.params=params||{};return resolveValue(key,options);}
  function smart(key,fallback,params){return resolveValue('smartReportsSource.'+key,{fallback:fallback,params:params||{},allowKeyFallback:true});}
  function translate(key,fallback,lang){return resolveValue(key,{fallback:fallback,lang:lang});}
  function setLanguage(lang,options){var a=api();return a&&a.setLanguage?a.setLanguage(lang,options):lang;}
  function apply(root){var a=api();if(a&&a.applySubtree)a.applySubtree(root||document);}
  function business(type,value,lang){var b=window.PETATOE_BUSINESS_DATA_I18N;return b&&b.resolve?b.resolve(type,value,lang):value;}
  function monthName(month,lang){
    var code=String(month||'');var idx=Number(month);
    if(!Number.isNaN(idx)&&idx>=1&&idx<=12)code=['January','February','March','April','May','June','July','August','September','October','November','December'][idx-1];
    code=code.charAt(0).toUpperCase()+code.slice(1).toLowerCase();
    return resolveValue('smartReportsSource.calendar.months.'+code,{lang:lang,fallback:code});
  }
  function formatDate(value,options,lang){try{return new Intl.DateTimeFormat((lang||currentLanguage())==='en'?'en-GB':'ar-SA',options||{day:'2-digit',month:'long',year:'numeric'}).format(new Date(value));}catch(_){return String(value||'');}}
  function reload(){var l=window.PETATOE_LOCALIZATION_LOADER;return l&&l.load?l.load({force:true}).then(function(x){markReady('reload');return x;}):Promise.resolve(null);}
  function markReady(source){if(ready)return;ready=true;window.dispatchEvent(new CustomEvent('petatoe:localization-center-ready',{detail:{version:VERSION,source:source||'runtime'}}));listeners.splice(0).forEach(function(fn){try{fn();}catch(_){}});}
  function whenReady(fn){if(ready){fn();return;}listeners.push(fn);}
  function getStatus(){return {version:VERSION,ready:ready,currentLanguage:currentLanguage(),registry:registry()&&registry().list?registry().list({includeDisabled:true}):[],smartPackReady:!!window.PETATOE_SMART_REPORTS_TRANSLATIONS,businessReady:!!window.PETATOE_BUSINESS_DATA_I18N};}
  var center={version:VERSION,t:t,smart:smart,translate:translate,resolve:function(key,fallback,lang){return {key:key,value:translate(key,fallback,lang),language:lang||currentLanguage(),source:'unified-center'};},getLanguage:currentLanguage,setLanguage:setLanguage,apply:apply,business:business,monthName:monthName,formatDate:formatDate,reload:reload,whenReady:whenReady,getStatus:getStatus,listLanguages:function(o){var r=registry();return r&&r.list?r.list(o):[];},clearCache:function(){var c=window.PETATOE_LOCALIZATION_CACHE;if(c&&c.clear)c.clear();return reload();}};
  window.PETATOE_LOCALIZATION_CENTER=center;
  window.localize=function(key,fallback,lang){return center.translate(key,fallback,lang);};
  window.petatoeLocalizationStatus=getStatus;
  window.petatoeLocalizationReload=reload;
  ['petatoe:localization-ready','petatoe:smart-translations-ready','DOMContentLoaded'].forEach(function(evt){window.addEventListener(evt,function(){if(api()&&window.PETATOE_SMART_REPORTS_TRANSLATIONS)markReady(evt);},{once:evt==='DOMContentLoaded'});});
  if(api()&&window.PETATOE_SMART_REPORTS_TRANSLATIONS)markReady('immediate');
})();
