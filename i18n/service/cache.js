/* PETATOE Enterprise Translation Cache — browser-side, non-sensitive values only. */
(function(){
  'use strict';
  var PREFIX='petatoe.translation.cache.';
  var MAX_ENTRIES=1500;
  function config(){ return window.PETATOE_TRANSLATION_CONFIG||{}; }
  function normalize(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function hash(value){
    var str=normalize(value), h=2166136261;
    for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
    return ('00000000'+(h>>>0).toString(16)).slice(-8);
  }
  function key(text,source,target){ return PREFIX+(config().cacheVersion||'ets-v1')+'.'+source+'.'+target+'.'+hash(text); }
  function get(text,source,target){
    try{
      var raw=localStorage.getItem(key(text,source,target));
      if(!raw) return null;
      var item=JSON.parse(raw);
      if(!item||item.source!==normalize(text)||typeof item.translation!=='string') return null;
      item.lastAccessedAt=Date.now();
      localStorage.setItem(key(text,source,target),JSON.stringify(item));
      return item.translation;
    }catch(_){ return null; }
  }
  function set(text,source,target,translation,meta){
    try{
      var item={source:normalize(text),sourceLanguage:source,targetLanguage:target,translation:String(translation||''),provider:(meta&&meta.provider)||'unknown',createdAt:Date.now(),lastAccessedAt:Date.now()};
      localStorage.setItem(key(text,source,target),JSON.stringify(item));
      prune();
      return true;
    }catch(_){ return false; }
  }
  function entries(){
    var list=[];
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k&&k.indexOf(PREFIX)===0){
          try{ var v=JSON.parse(localStorage.getItem(k)); if(v) list.push({key:k,value:v}); }catch(_){}
        }
      }
    }catch(_){}
    return list;
  }
  function prune(){
    var list=entries();
    if(list.length<=MAX_ENTRIES) return;
    list.sort(function(a,b){return Number(a.value.lastAccessedAt||0)-Number(b.value.lastAccessedAt||0);});
    list.slice(0,list.length-MAX_ENTRIES).forEach(function(x){try{localStorage.removeItem(x.key);}catch(_){}});
  }
  function clear(){ entries().forEach(function(x){try{localStorage.removeItem(x.key);}catch(_){}}); }
  window.PETATOE_TRANSLATION_CACHE=Object.freeze({get:get,set:set,clear:clear,entries:entries,hash:hash});
})();
