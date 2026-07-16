/* PETATOE v9 Enterprise Localization Center - Runtime facade */
(function(){
  'use strict';
  function getRegistry(){return window.PETATOE_LOCALIZATION_REGISTRY||null;}
  function listLanguages(options){var r=getRegistry();return r?r.list(options):[];}
  function reload(){var loader=window.PETATOE_LOCALIZATION_LOADER;return loader&&loader.load?loader.load({force:true}):Promise.resolve(null);}
  function clearCache(){var cache=window.PETATOE_LOCALIZATION_CACHE;if(cache&&cache.clear)cache.clear();return reload();}
  function resolve(key,fallback,lang){var api=window.PETATOE_I18N;var code=lang||(api&&api.getLanguage?api.getLanguage():'ar');var value=api&&api.translate?api.translate(key,code):null;var loader=window.PETATOE_LOCALIZATION_LOADER;return {key:key,value:(typeof value==='string'&&value)?value:fallback,source:loader&&loader.getSource?loader.getSource(code,key):'local-file',language:code};}
  function translate(key,fallback,lang){return resolve(key,fallback,lang).value;}
  function getStatus(){var loader=window.PETATOE_LOCALIZATION_LOADER;var snapshot=loader?Object.assign({},loader.state):null;if(snapshot&&snapshot.sourceIndex)delete snapshot.sourceIndex;return {registry:listLanguages({includeDisabled:true}),loader:snapshot,currentLanguage:window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage?window.PETATOE_I18N.getLanguage():null};}
  window.PETATOE_LOCALIZATION_CENTER={version:'9.0.0-elc-phase7a',listLanguages:listLanguages,reload:reload,clearCache:clearCache,getStatus:getStatus,translate:translate,resolve:resolve};
  window.petatoeLocalizationStatus=getStatus;
  window.petatoeLocalizationReload=reload;
  if(typeof window.localize!=='function')window.localize=function(key,fallback,lang){return translate(key,fallback,lang);};
})();
