/* PETATOE v10.0.25 — E5.2.20.1 English remote localization audit adapter.
 * Arabic is authored source. Canonical English catalog is local runtime truth.
 * Remote localization may be inspected for drift but never mutates runtime dictionaries.
 */
(function(){
  'use strict';
  var REGISTRY=window.PETATOE_LOCALIZATION_REGISTRY;
  var state={ready:false,loading:false,lastError:null,loadedLanguages:[],loadedValues:0,source:'canonical-local',cacheHydrated:false,lastLoadedAt:null,sourceIndex:{},requestCount:0,lastDurationMs:0,rejectedValues:0,protectedValues:0,runtimeMutation:false,auditOnly:true,driftCount:0};
  function client(){return window.PETATOE_SUPABASE_CLIENT||window.supabase||null;}
  function canonical(){return window.PETATOE_LOCALIZATION_CENTER_STORE||null;}
  function hasArabic(value){return /[\u0600-\u06FF]/.test(String(value==null?'':value));}
  function flatten(obj,prefix,out){out=out||{};prefix=prefix||'';Object.keys(obj||{}).forEach(function(k){var v=obj[k],path=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,path,out);else out[path]=v;});return out;}
  function normalizeBundle(payload){if(Array.isArray(payload))payload=payload[0]||{};if(payload&&payload.bundle)payload=payload.bundle;return payload&&typeof payload==='object'?payload:{};}
  async function loadBundle(db){state.requestCount++;var result=await db.rpc('get_localization_bundle',{p_language_codes:['en']});if(result.error)throw result.error;return normalizeBundle(result.data);}
  function auditEnglish(bundle){
    var item=bundle&&bundle.en||{},remote=flatten(item.values||item),store=canonical(),local=flatten(store&&store.dictionaries&&store.dictionaries.en||{}),drift=0,accepted=0;
    Object.keys(remote).forEach(function(key){var value=remote[key];if(typeof value!=='string'||!value.trim()||hasArabic(value)){state.rejectedValues++;return;}accepted++;if(local[key]!==value)drift++;state.sourceIndex.en=state.sourceIndex.en||{};state.sourceIndex.en[key]='supabase-audit';});
    state.loadedLanguages=['en'];state.loadedValues=accepted;state.driftCount=drift;state.source='supabase-english-audit';state.lastLoadedAt=new Date().toISOString();return accepted;
  }
  function hydrateCache(){state.cacheHydrated=false;return 0;} // cache is not a runtime localization source
  function renderLanguageMenu(){
    if(!REGISTRY)return;var menu=document.getElementById('petLanguageMenu');if(!menu)return;var current=REGISTRY.getStoredLanguage();menu.innerHTML='';
    REGISTRY.list().forEach(function(language){var button=document.createElement('button');button.type='button';button.className='pet-language-option';button.setAttribute('data-pet-lang',language.code);button.setAttribute('role','option');button.setAttribute('aria-selected',language.code===current?'true':'false');button.textContent=language.name;menu.appendChild(button);});
    if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.refreshLanguageOptions==='function')window.PETATOE_I18N.refreshLanguageOptions();
  }
  async function load(){
    if(state.loading)return state;state.loading=true;state.lastError=null;window.dispatchEvent(new CustomEvent('petatoe:localization-loading',{detail:{loading:true}}));var started=(window.performance&&performance.now)?performance.now():Date.now();
    try{var db=client();if(!db||typeof db.rpc!=='function')throw new Error('Supabase client is not available');var bundle=await loadBundle(db);auditEnglish(bundle);state.ready=true;renderLanguageMenu();window.dispatchEvent(new CustomEvent('petatoe:localization-ready',{detail:Object.assign({},state)}));if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.reapply==='function')window.PETATOE_I18N.reapply();}
    catch(error){state.lastError=error&&error.message?error.message:String(error);state.ready=true;state.source='canonical-local';renderLanguageMenu();console.warn('[PETATOE ELC] English remote audit unavailable; canonical local catalog remains authoritative.',state.lastError);}
    finally{state.loading=false;window.dispatchEvent(new CustomEvent('petatoe:localization-loading',{detail:{loading:false}}));var ended=(window.performance&&performance.now)?performance.now():Date.now();state.lastDurationMs=Math.max(0,Math.round(ended-started));}
    return state;
  }
  window.PETATOE_LOCALIZATION_LOADER={load:load,state:state,renderLanguageMenu:renderLanguageMenu,hydrateCache:hydrateCache,getSource:function(){return 'canonical-local';},runtimeMutation:false,auditOnly:true};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(load,0);},{once:true});else setTimeout(load,0);
})();
