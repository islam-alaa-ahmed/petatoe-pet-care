/* PETATOE v9 Enterprise Localization Center - Language Registry */
(function(){
  'use strict';
  var DEFAULT_LANGUAGE='ar';
  var STORAGE_KEY='petatoe.ui.language';
  var registry={
    ar:{code:'ar',name:'العربية',englishName:'Arabic',dir:'rtl',locale:'ar-SA',enabled:true,isDefault:true,sortOrder:10},
    en:{code:'en',name:'English',englishName:'English',dir:'ltr',locale:'en-SA',enabled:true,isDefault:false,sortOrder:20},
    fil:{code:'fil',name:'Filipino',englishName:'Filipino',dir:'ltr',locale:'fil-PH',enabled:false,isDefault:false,sortOrder:30}
  };
  function normalizeCode(code){return String(code||'').trim().toLowerCase().replace('_','-').split('-')[0];}
  function list(options){
    options=options||{};
    return Object.keys(registry).map(function(code){return registry[code];})
      .filter(function(item){return options.includeDisabled?true:item.enabled;})
      .sort(function(a,b){return (a.sortOrder||0)-(b.sortOrder||0);});
  }
  function upsert(language){
    if(!language||!language.code) return null;
    var code=normalizeCode(language.code);
    registry[code]=Object.assign({},registry[code]||{},language,{code:code});
    return registry[code];
  }
  function get(code){return registry[normalizeCode(code)]||null;}
  function isEnabled(code){var item=get(code);return !!(item&&item.enabled);}
  function enabledCodes(){return list().map(function(item){return item.code;});}
  function getStoredLanguage(){try{return normalizeCode(localStorage.getItem(STORAGE_KEY)||DEFAULT_LANGUAGE);}catch(_){return DEFAULT_LANGUAGE;}}
  window.PETATOE_LOCALIZATION_REGISTRY={
    defaultLanguage:DEFAULT_LANGUAGE,
    storageKey:STORAGE_KEY,
    normalizeCode:normalizeCode,
    list:list,
    upsert:upsert,
    get:get,
    isEnabled:isEnabled,
    enabledCodes:enabledCodes,
    getStoredLanguage:getStoredLanguage,
    raw:registry
  };
})();
