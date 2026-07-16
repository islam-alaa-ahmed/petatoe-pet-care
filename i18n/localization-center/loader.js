/* PETATOE v9 Enterprise Localization Center - Secure runtime database loader */
(function(){
  'use strict';
  var REGISTRY=window.PETATOE_LOCALIZATION_REGISTRY;
  var CACHE=window.PETATOE_LOCALIZATION_CACHE;
  var state={ready:false,loading:false,lastError:null,loadedLanguages:[],loadedValues:0,source:'local-files',cacheHydrated:false,lastLoadedAt:null,sourceIndex:{},requestCount:0,lastDurationMs:0};
  function client(){return window.PETATOE_SUPABASE_CLIENT||window.supabase||null;}
  function setPath(target,path,value){
    if(!target||!path) return;
    var parts=String(path).split('.'),cursor=target;
    for(var i=0;i<parts.length-1;i++){var key=parts[i];if(!cursor[key]||typeof cursor[key]!=='object')cursor[key]={};cursor=cursor[key];}
    cursor[parts[parts.length-1]]=value;
  }
  function markSources(code,values,source){
    state.sourceIndex[code]=state.sourceIndex[code]||{};
    Object.keys(values||{}).forEach(function(key){state.sourceIndex[code][key]=source;});
  }
  function mergeLanguageMap(code,values,source){
    if(!code||!values||typeof values!=='object') return 0;
    var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};
    code=REGISTRY?REGISTRY.normalizeCode(code):String(code).toLowerCase();
    dictionaries[code]=dictionaries[code]||{};
    var count=0;
    Object.keys(values).forEach(function(key){setPath(dictionaries[code],key,values[key]);count++;});
    markSources(code,values,source||'runtime');
    return count;
  }
  function hydrateCache(){
    if(!CACHE||!REGISTRY) return 0;
    var total=0,codes=REGISTRY.enabledCodes(),records=CACHE.readEnabled(codes);
    Object.keys(records).forEach(function(code){total+=mergeLanguageMap(code,records[code].values,'cache');});
    if(total){state.cacheHydrated=true;state.source='cache';state.loadedValues=total;state.loadedLanguages=Object.keys(records);}
    return total;
  }
  function normalizeBundle(payload){
    if(Array.isArray(payload)) payload=payload[0]||{};
    if(payload&&payload.bundle) payload=payload.bundle;
    return payload&&typeof payload==='object'?payload:{};
  }
  async function loadBundle(db,codes){
    state.requestCount++;
    var result=await db.rpc('get_localization_bundle',{p_language_codes:codes});
    if(result.error) throw result.error;
    return normalizeBundle(result.data);
  }
  function persistAndMerge(bundle){
    var total=0,languages=[];
    Object.keys(bundle||{}).forEach(function(code){
      var item=bundle[code]||{},values=item.values||item;
      if(!values||typeof values!=='object') return;
      total+=mergeLanguageMap(code,values,'supabase');languages.push(code);
      if(CACHE) CACHE.writeLanguage(code,values,item.version||1);
    });
    state.loadedLanguages=languages;state.loadedValues=total;state.source='supabase';state.lastLoadedAt=new Date().toISOString();
    return total;
  }
  function renderLanguageMenu(){
    if(!REGISTRY) return;
    var menu=document.getElementById('petLanguageMenu');if(!menu)return;
    var current=REGISTRY.getStoredLanguage();menu.innerHTML='';
    REGISTRY.list().forEach(function(language){
      var button=document.createElement('button');button.type='button';button.className='pet-language-option';button.setAttribute('data-pet-lang',language.code);button.setAttribute('role','option');button.setAttribute('aria-selected',language.code===current?'true':'false');button.textContent=language.name;menu.appendChild(button);
    });
    if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.refreshLanguageOptions==='function')window.PETATOE_I18N.refreshLanguageOptions();
  }
  async function load(options){
    options=options||{};
    if(state.loading) return state;
    state.loading=true;state.lastError=null;var started=(window.performance&&performance.now)?performance.now():Date.now();
    try{
      var db=client();if(!db||typeof db.rpc!=='function')throw new Error('Supabase client is not available');
      var codes=REGISTRY?REGISTRY.enabledCodes():['ar','en'];
      var bundle=await loadBundle(db,codes);
      persistAndMerge(bundle);state.ready=true;renderLanguageMenu();
      window.dispatchEvent(new CustomEvent('petatoe:localization-ready',{detail:Object.assign({},state)}));
      if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.reapply==='function')window.PETATOE_I18N.reapply();
    }catch(error){
      state.lastError=error&&error.message?error.message:String(error);state.ready=state.cacheHydrated;renderLanguageMenu();
      console.warn('[PETATOE ELC] Approved database bundle unavailable; cached/local dictionaries remain active.',state.lastError);
    }finally{state.loading=false;var ended=(window.performance&&performance.now)?performance.now():Date.now();state.lastDurationMs=Math.max(0,Math.round(ended-started));}
    return state;
  }
  hydrateCache();
  window.PETATOE_LOCALIZATION_LOADER={load:load,state:state,renderLanguageMenu:renderLanguageMenu,hydrateCache:hydrateCache,getSource:function(code,key){return state.sourceIndex[code]&&state.sourceIndex[code][key]||'local-file';}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(load,0);},{once:true});else setTimeout(load,0);
})();
