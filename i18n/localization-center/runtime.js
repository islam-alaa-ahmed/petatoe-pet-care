/* PETATOE v9 Enterprise Localization Center - Runtime facade */
(function(){
  'use strict';
  function getRegistry(){return window.PETATOE_LOCALIZATION_REGISTRY||null;}
  function listLanguages(options){var r=getRegistry();return r?r.list(options):[];}
  function reload(){var loader=window.PETATOE_LOCALIZATION_LOADER;return loader&&loader.load?loader.load({force:true}):Promise.resolve(null);}
  function clearCache(){var cache=window.PETATOE_LOCALIZATION_CACHE;if(cache&&cache.clear)cache.clear();return reload();}
  function getStatus(){return {registry:listLanguages({includeDisabled:true}),loader:window.PETATOE_LOCALIZATION_LOADER?Object.assign({},window.PETATOE_LOCALIZATION_LOADER.state):null,currentLanguage:window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage?window.PETATOE_I18N.getLanguage():null};}
  window.PETATOE_LOCALIZATION_CENTER={version:'9.0.0-elc-phase5.2',listLanguages:listLanguages,reload:reload,clearCache:clearCache,getStatus:getStatus};
  window.petatoeLocalizationStatus=getStatus;
  window.petatoeLocalizationReload=reload;
})();
