/* PETATOE v9 Enterprise Localization Center - Runtime facade */
(function(){
  'use strict';
  function getRegistry(){return window.PETATOE_LOCALIZATION_REGISTRY||null;}
  function listLanguages(options){var r=getRegistry();return r?r.list(options):[];}
  function reload(){var loader=window.PETATOE_LOCALIZATION_LOADER;return loader&&loader.load?loader.load():Promise.resolve(null);}
  function getStatus(){
    return {
      registry:listLanguages({includeDisabled:true}),
      loader:window.PETATOE_LOCALIZATION_LOADER?Object.assign({},window.PETATOE_LOCALIZATION_LOADER.state):null,
      currentLanguage:window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage?window.PETATOE_I18N.getLanguage():null
    };
  }
  window.PETATOE_LOCALIZATION_CENTER={
    version:'9.0.0-elc-phase1',
    listLanguages:listLanguages,
    reload:reload,
    getStatus:getStatus
  };
  window.petatoeLocalizationStatus=getStatus;
})();
