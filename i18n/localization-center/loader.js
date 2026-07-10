/* PETATOE v9 Enterprise Localization Center - Approved translations loader */
(function(){
  'use strict';
  var REGISTRY=window.PETATOE_LOCALIZATION_REGISTRY;
  var state={ready:false,loading:false,lastError:null,loadedLanguages:[],loadedValues:0};
  function client(){return window.PETATOE_SUPABASE_CLIENT||window.supabase||null;}
  function setPath(target,path,value){
    if(!target||!path) return;
    var parts=String(path).split('.');
    var cursor=target;
    for(var i=0;i<parts.length-1;i++){
      var key=parts[i];
      if(!cursor[key]||typeof cursor[key]!=='object') cursor[key]={};
      cursor=cursor[key];
    }
    cursor[parts[parts.length-1]]=value;
  }
  function mergeLanguageRows(rows){
    var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};
    (rows||[]).forEach(function(row){
      if(!row||!row.language_code||!row.translation_key) return;
      var code=REGISTRY?REGISTRY.normalizeCode(row.language_code):String(row.language_code).toLowerCase();
      dictionaries[code]=dictionaries[code]||{};
      setPath(dictionaries[code],row.translation_key,row.translated_text);
    });
  }
  async function loadLanguages(db){
    var result=await db.from('localization_languages').select('code,name,english_name,direction,locale,is_enabled,is_default,sort_order').order('sort_order',{ascending:true});
    if(result.error) throw result.error;
    (result.data||[]).forEach(function(row){
      if(REGISTRY) REGISTRY.upsert({
        code:row.code,
        name:row.name,
        englishName:row.english_name,
        dir:row.direction,
        locale:row.locale,
        enabled:row.is_enabled,
        isDefault:row.is_default,
        sortOrder:row.sort_order
      });
    });
    return result.data||[];
  }
  async function loadApprovedValues(db,codes){
    if(!codes.length) return [];
    var result=await db.from('localization_approved_values')
      .select('translation_key,language_code,translated_text')
      .in('language_code',codes);
    if(result.error) throw result.error;
    return result.data||[];
  }
  function renderLanguageMenu(){
    if(!REGISTRY) return;
    var menu=document.getElementById('petLanguageMenu');
    if(!menu) return;
    var current=REGISTRY.getStoredLanguage();
    menu.innerHTML='';
    REGISTRY.list().forEach(function(language){
      var button=document.createElement('button');
      button.type='button';
      button.className='pet-language-option';
      button.setAttribute('data-pet-lang',language.code);
      button.setAttribute('role','option');
      button.setAttribute('aria-selected',language.code===current?'true':'false');
      button.textContent=language.name;
      menu.appendChild(button);
    });
    if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.refreshLanguageOptions==='function') window.PETATOE_I18N.refreshLanguageOptions();
  }
  async function load(){
    if(state.loading) return state;
    state.loading=true;
    state.lastError=null;
    try{
      var db=client();
      if(!db||typeof db.from!=='function') throw new Error('Supabase client is not available');
      await loadLanguages(db);
      var codes=REGISTRY?REGISTRY.enabledCodes():['ar','en'];
      var rows=await loadApprovedValues(db,codes);
      mergeLanguageRows(rows);
      renderLanguageMenu();
      state.loadedLanguages=codes.slice();
      state.loadedValues=rows.length;
      state.ready=true;
      window.dispatchEvent(new CustomEvent('petatoe:localization-ready',{detail:Object.assign({},state)}));
      if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.reapply==='function') window.PETATOE_I18N.reapply();
    }catch(error){
      state.lastError=error&&error.message?error.message:String(error);
      state.ready=false;
      console.warn('[PETATOE ELC] Database localization fallback is unavailable; local dictionaries remain active.',state.lastError);
      renderLanguageMenu();
    }finally{
      state.loading=false;
    }
    return state;
  }
  window.PETATOE_LOCALIZATION_LOADER={load:load,state:state,renderLanguageMenu:renderLanguageMenu,mergeLanguageRows:mergeLanguageRows};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(load,0);},{once:true}); else setTimeout(load,0);
})();
