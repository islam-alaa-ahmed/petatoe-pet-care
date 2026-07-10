/* PETATOE Enterprise Translation Service client.
   Resolution order: approved local dictionary -> PETATOE glossary -> browser cache -> secure Supabase Edge Function. */
(function(){
  'use strict';
  var inflight=new Map();
  function cfg(){return window.PETATOE_TRANSLATION_CONFIG||{};}
  function normalizeLanguage(lang){lang=String(lang||'').toLowerCase();return (cfg().supportedLanguages||['ar','en']).indexOf(lang)>=0?lang:'ar';}
  function normalizeText(text){return String(text==null?'':text).replace(/\s+/g,' ').trim();}
  function hasArabic(text){return /[\u0600-\u06FF]/.test(String(text||''));}
  function detectLanguage(text){return hasArabic(text)?'ar':'en';}
  function dictionaryLookup(text,source,target){
    var engine=window.PETATOE_I18N;
    if(!engine||!engine.dictionaries) return null;
    var sourceDict=engine.dictionaries[source]||{}, targetDict=engine.dictionaries[target]||{};
    function walk(a,b){
      if(!a||!b||typeof a!=='object'||typeof b!=='object') return null;
      var keys=Object.keys(a);
      for(var i=0;i<keys.length;i++){
        var k=keys[i], av=a[k], bv=b[k];
        if(typeof av==='string'&&av===text&&typeof bv==='string') return bv;
        if(av&&bv&&typeof av==='object'&&typeof bv==='object'){var nested=walk(av,bv);if(nested)return nested;}
      }
      return null;
    }
    return walk(sourceDict,targetDict);
  }
  function getSupabaseConfig(){return window.PETATOE_SUPABASE_CONFIG||null;}
  function endpoint(){
    var sc=getSupabaseConfig();
    if(!sc||!sc.url) return null;
    return String(sc.url).replace(/\/+$/,'')+'/functions/v1/'+encodeURIComponent(cfg().functionName||'petatoe-translate');
  }
  function currentUserMeta(){
    var user=null;
    try{if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function')user=window.PETATOEAuth.currentUser();}catch(_){}
    user=user||window.__PETATOE_ACTIVE_USER__||window.currentUser||{};
    return {id:String(user.id||user.userId||user.uid||''),username:String(user.username||user.login||''),role:String(user.role||'')};
  }
  async function remoteTranslate(text,source,target,options){
    var sc=getSupabaseConfig(), url=endpoint();
    if(!url||!sc||!sc.publishableKey) throw new Error('Translation service is not configured');
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},Number(cfg().requestTimeoutMs)||12000);
    try{
      var response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':sc.publishableKey,'Authorization':'Bearer '+sc.publishableKey},body:JSON.stringify({text:text,sourceLanguage:source,targetLanguage:target,context:(options&&options.context)||'petatoe-ui',user:currentUserMeta()}),signal:controller.signal});
      var payload=await response.json().catch(function(){return {};});
      if(!response.ok) throw new Error(payload.error||payload.message||('Translation request failed: '+response.status));
      if(!payload||typeof payload.translation!=='string'||!payload.translation.trim()) throw new Error('Translation service returned an empty result');
      return {translation:payload.translation.trim(),provider:payload.provider||'remote',cached:!!payload.cached};
    }finally{clearTimeout(timer);}
  }
  async function translate(text,targetLanguage,options){
    options=options||{};
    var value=normalizeText(text);
    if(!value) return {translation:value,source:'empty'};
    if(value.length>(Number(cfg().maxTextLength)||1200)) throw new Error('Text exceeds translation length limit');
    var source=normalizeLanguage(options.sourceLanguage||detectLanguage(value));
    var target=normalizeLanguage(targetLanguage||((source==='ar')?'en':'ar'));
    if(source===target) return {translation:value,source:'same-language'};
    var local=dictionaryLookup(value,source,target);
    if(local) return {translation:local,source:'dictionary'};
    var glossary=window.PETATOE_TRANSLATION_GLOSSARY&&window.PETATOE_TRANSLATION_GLOSSARY.lookup(value,source,target);
    if(glossary) return {translation:glossary,source:'glossary'};
    var cache=window.PETATOE_TRANSLATION_CACHE;
    var cached=cache&&cache.get(value,source,target);
    if(cached) return {translation:cached,source:'browser-cache'};
    if(!cfg().enabled||!cfg().remoteEnabled||options.remote===false) return {translation:value,source:'fallback',missing:true};
    var requestKey=source+'|'+target+'|'+value;
    if(inflight.has(requestKey)) return inflight.get(requestKey);
    var promise=remoteTranslate(value,source,target,options).then(function(result){if(cache)cache.set(value,source,target,result.translation,{provider:result.provider});return {translation:result.translation,source:result.cached?'server-cache':'remote',provider:result.provider};}).finally(function(){inflight.delete(requestKey);});
    inflight.set(requestKey,promise);
    return promise;
  }
  window.PETATOE_TRANSLATION_SERVICE=Object.freeze({translate:translate,detectLanguage:detectLanguage,isEnabled:function(){return !!cfg().enabled;},clearCache:function(){if(window.PETATOE_TRANSLATION_CACHE)window.PETATOE_TRANSLATION_CACHE.clear();}});
})();
