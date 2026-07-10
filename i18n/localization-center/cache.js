/* PETATOE v9 Enterprise Localization Center - Local approved bundle cache */
(function(){
  'use strict';
  var PREFIX='petatoe.elc.bundle.';
  var META_KEY='petatoe.elc.meta';
  var MAX_AGE_MS=24*60*60*1000;
  function readJson(key){try{var raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;}catch(_){return null;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function normalize(code){return String(code||'').trim().toLowerCase().replace('_','-').split('-')[0];}
  function readLanguage(code){
    code=normalize(code);
    var record=readJson(PREFIX+code);
    if(!record||!record.values||typeof record.values!=='object') return null;
    return record;
  }
  function writeLanguage(code,values,version){
    code=normalize(code);
    if(!code||!values||typeof values!=='object') return false;
    return writeJson(PREFIX+code,{language:code,values:values,version:Number(version||1),savedAt:Date.now()});
  }
  function readEnabled(codes){
    var out={};
    (codes||[]).forEach(function(code){var record=readLanguage(code);if(record) out[normalize(code)]=record;});
    return out;
  }
  function isFresh(record){return !!(record&&record.savedAt&&(Date.now()-record.savedAt)<=MAX_AGE_MS);}
  function clear(){
    try{Object.keys(localStorage).forEach(function(key){if(key.indexOf(PREFIX)===0||key===META_KEY)localStorage.removeItem(key);});}catch(_){}
  }
  window.PETATOE_LOCALIZATION_CACHE={readLanguage:readLanguage,writeLanguage:writeLanguage,readEnabled:readEnabled,isFresh:isFresh,clear:clear,maxAgeMs:MAX_AGE_MS};
})();
