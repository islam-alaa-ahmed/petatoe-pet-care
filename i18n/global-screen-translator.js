/* PETATOE v9.3.3 - Final Bulk Source Migration
   Batches DOM mutations, avoids recursive observer loops and caches translations. */
(function(){
  'use strict';

  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  var ATTRS=['title','aria-label','aria-description','placeholder','data-label','data-title','data-tooltip','data-original-title','alt'];
  var UI_GLOSSARY={}; // v9.4.2: canonical phrases are read from Localization Center only.
  var MONTHS={jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December',
    '01':'January','02':'February','03':'March','04':'April','05':'May','06':'June','07':'July','08':'August','09':'September','10':'October','11':'November','12':'December'};

  var phrasePairs=[];
  var phraseMap=Object.create(null);
  var translationCache=new Map();
  var observer=null;
  var observerTarget=null;
  var mutationQueue=[];
  var queuedNodes=new Set();
  var flushHandle=0;
  var fullScanHandle=0;
  var processing=false;
  var MAX_CACHE=3000;
  var MAX_NODES_PER_SLICE=180;

  function language(){
    try{
      if(window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage)return window.PETATOE_I18N.getLanguage();
      var stored='';
      try{stored=window.localStorage&&localStorage.getItem('petatoe.ui.language')||'';}catch(_storage){}
      return stored||window.__PETATOE_INITIAL_LANGUAGE__||document.documentElement.lang||'ar';
    }catch(_){return document.documentElement.lang||'ar';}
  }
  function isAuthenticated(){
    try{
      if(document.documentElement.classList.contains('pet-authenticated')) return true;
      if(document.body&&document.body.classList.contains('pet-authenticated')) return true;
      if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'){
        var u=window.PETATOEAuth.currentUser();
        return !!(u&&(u.id||u.username));
      }
    }catch(_e){}
    return false;
  }
  function runtimeEnabled(){ return language()==='en'; }
  function normalize(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function hasArabic(v){return ARABIC_RE.test(String(v||''));}
  function flatten(obj,prefix,out){
    out=out||{};prefix=prefix||'';
    if(!obj||typeof obj!=='object')return out;
    Object.keys(obj).forEach(function(k){
      var v=obj[k],path=prefix?prefix+'.'+k:k;
      if(typeof v==='string')out[path]=v;
      else if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,path,out);
    });
    return out;
  }
  function addPair(source,target){
    source=normalize(source);target=normalize(target);
    if(!source||!target||source===target||!hasArabic(source)||hasArabic(target))return;
    if(!phraseMap[source]||target.length>phraseMap[source].length)phraseMap[source]=target;
  }
  function buildIndex(){
    phraseMap=Object.create(null);
    translationCache.clear();
    try{
      var store=window.PETATOE_LOCALIZATION_CENTER_STORE||{};
      var dictionaries=store.dictionaries||{};
      var ar=flatten(dictionaries.ar||{}),en=flatten(dictionaries.en||{});
      Object.keys(ar).forEach(function(k){if(typeof en[k]==='string')addPair(ar[k],en[k]);});
    }catch(_){}
    Object.keys(UI_GLOSSARY).forEach(function(k){addPair(k,UI_GLOSSARY[k]);});
    phrasePairs=Object.keys(phraseMap).map(function(source){return{source:source,target:phraseMap[source]};})
      .sort(function(a,b){return b.source.length-a.source.length;});
  }
  function replaceLiteral(text,source,target){return text.split(source).join(target);}
  function setCache(key,value){
    /* Never persist partial Arabic/English output. */
    if(hasArabic(value))return false;
    if(translationCache.size>=MAX_CACHE)translationCache.clear();
    translationCache.set(key,value);return true;
  }
  function translateMixed(value){
    if(language()!=='en'||value==null)return value;
    var original=String(value);
    if(!hasArabic(original))return original;
    if(translationCache.has(original))return translationCache.get(original);
    var exact=original;
    try{
      exact=window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?
        window.PETATOE_LOCALIZATION_CENTER.translateRuntime(original,'en'):original;
    }catch(_){}
    if(typeof exact==='string'&&exact!==original&&!hasArabic(exact)){
      setCache(original,exact);return exact;
    }
    var out=original;
    for(var i=0;i<phrasePairs.length&&hasArabic(out);i++){
      var pair=phrasePairs[i];
      if(out.indexOf(pair.source)!==-1)out=replaceLiteral(out,pair.source,pair.target);
    }
    if(!hasArabic(out))setCache(original,out);
    return hasArabic(out)?original:out;
  }
  function englishMonth(value){
    var key=String(value==null?'':value).trim().toLowerCase();
    if(language()!=='en')return value;
    return MONTHS[key]||translateMixed(value);
  }
  function skip(el){
    if(!el||el.nodeType!==1)return true;
    if(el.closest&&el.closest('script,style,noscript,code,pre,#petLanguageSwitcher,[data-i18n-skip="true"],[data-i18n-ignore]'))return true;
    if(el.isContentEditable||el.matches&&el.matches('textarea'))return true;
    return false;
  }
  function translateTextNode(node){
    if(!node||node.nodeType!==3||!node.parentElement||skip(node.parentElement)||!hasArabic(node.nodeValue))return;
    var translated=translateMixed(node.nodeValue);
    if(translated!==node.nodeValue)node.nodeValue=translated;
  }
  function translateAttributes(el){
    if(!el||el.nodeType!==1||skip(el))return;
    ATTRS.forEach(function(name){
      if(!el.hasAttribute(name))return;
      var value=el.getAttribute(name);
      if(!hasArabic(value))return;
      var translated=translateMixed(value);
      if(translated!==value)el.setAttribute(name,translated);
    });
    if(el.matches&&el.matches('input[type="button"],input[type="submit"],input[type="reset"],option')){
      var value=el.tagName==='OPTION'?el.textContent:el.value;
      if(hasArabic(value)){
        var translated=translateMixed(value);
        if(el.tagName==='OPTION')el.textContent=translated;else el.value=translated;
      }
    }
  }
  function processNode(root){
    if(!runtimeEnabled()||!root)return;
    if(root.nodeType===3){translateTextNode(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1&&skip(root))return;
    if(root.nodeType===1)translateAttributes(root);
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
      acceptNode:function(node){
        if(node.nodeType===1&&skip(node))return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while((node=walker.nextNode())){
      if(node.nodeType===3)translateTextNode(node);
      else{
        translateAttributes(node);
        if(node.shadowRoot)enqueue(node.shadowRoot);
      }
    }
  }
  function pauseObserver(){if(observer)observer.disconnect();}
  function resumeObserver(){
    if(!observer||!observerTarget||!runtimeEnabled())return;
    observer.observe(observerTarget,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['value'])});
  }
  function runIdle(callback){
    if(window.requestIdleCallback)return window.requestIdleCallback(callback,{timeout:180});
    return window.setTimeout(function(){callback({timeRemaining:function(){return 8;},didTimeout:true});},16);
  }
  function cancelIdle(handle){
    if(!handle)return;
    if(window.cancelIdleCallback)window.cancelIdleCallback(handle);else clearTimeout(handle);
  }
  function enqueue(node){
    if(!node||!runtimeEnabled()||queuedNodes.has(node))return;
    queuedNodes.add(node);mutationQueue.push(node);
    if(!flushHandle)flushHandle=runIdle(flushQueue);
  }
  function flushQueue(deadline){
    flushHandle=0;
    if(processing||!runtimeEnabled()){mutationQueue.length=0;queuedNodes.clear();return;}
    processing=true;pauseObserver();
    var processed=0;
    try{
      while(mutationQueue.length&&processed<MAX_NODES_PER_SLICE&&(deadline.didTimeout||deadline.timeRemaining()>2)){
        var node=mutationQueue.shift();queuedNodes.delete(node);processNode(node);processed++;
      }
    }finally{
      processing=false;resumeObserver();
    }
    if(mutationQueue.length&&!flushHandle)flushHandle=runIdle(flushQueue);
  }
  function requestFullScan(delay){
    if(!runtimeEnabled())return;
    cancelIdle(fullScanHandle);
    fullScanHandle=setTimeout(function(){
      fullScanHandle=0;
      if(!runtimeEnabled()) return;
      var roots=[];
      ['header','.topbar','.top-bar','#nav','.sidebar','.panel.active','main .active','#smartTabs','.smart-tab-section.active','.contract-reason-modal-overlay.show','.new-cust-tier-tooltip','.smart-modal-overlay.show'].forEach(function(selector){
        try{ document.querySelectorAll(selector).forEach(function(el){ if(roots.indexOf(el)===-1) roots.push(el); }); }catch(_e){}
      });
      if(!roots.length) roots.push(document.body||document.documentElement);
      roots.forEach(enqueue);
    },typeof delay==='number'?delay:120);
  }
  function installObserver(){
    if(observer||!window.MutationObserver)return;
    observerTarget=document.body||document.documentElement;
    observer=new MutationObserver(function(records){
      if(processing||!runtimeEnabled())return;
      records.forEach(function(record){
        if(record.type==='characterData')enqueue(record.target);
        else if(record.type==='attributes')enqueue(record.target);
        else Array.prototype.forEach.call(record.addedNodes||[],enqueue);
      });
    });
    resumeObserver();
  }

  function patchNativeDialogs(){
    try{
      if(window.__PETATOE_LOCALIZED_DIALOGS__)return;
      ['alert','confirm','prompt'].forEach(function(name){
        var original=window[name];
        if(typeof original!=='function')return;
        window[name]=function(message){
          var args=Array.prototype.slice.call(arguments);
          if(runtimeEnabled()&&hasArabic(message))args[0]=translateMixed(message);
          return original.apply(window,args);
        };
      });
      window.__PETATOE_LOCALIZED_DIALOGS__=true;
    }catch(_e){}
  }



  var patchedMessageFunctions=Object.create(null);
  function localizeMessageArgument(args){
    if(!runtimeEnabled()||!args||!args.length)return args;
    if(hasArabic(args[0]))args[0]=translateMixed(args[0]);
    return args;
  }
  function patchMessageFunction(name){
    try{
      var current=window[name];
      if(typeof current!=='function'||current.__petatoeLocalizedMessageWrapper)return false;
      var original=current;
      var wrapped=function(){
        var args=localizeMessageArgument(Array.prototype.slice.call(arguments));
        return original.apply(this,args);
      };
      try{Object.defineProperty(wrapped,'name',{value:original.name||name,configurable:true});}catch(_nameError){}
      wrapped.__petatoeLocalizedMessageWrapper=true;
      wrapped.__petatoeLocalizedOriginal=original;
      window[name]=wrapped;
      patchedMessageFunctions[name]=wrapped;
      return true;
    }catch(_e){return false;}
  }
  function patchRuntimeMessageApis(){
    ['toast','toastSafe','showToast','notify','showNotification','petatoeToast'].forEach(patchMessageFunction);
  }

  function patchCanvas(){
    try{
      var proto=window.CanvasRenderingContext2D&&window.CanvasRenderingContext2D.prototype;
      if(!proto||proto.__petatoeI18nPatched)return;
      ['fillText','strokeText'].forEach(function(name){
        var original=proto[name];if(typeof original!=='function')return;
        proto[name]=function(text){
          var args=Array.prototype.slice.call(arguments);
          if(runtimeEnabled()&&hasArabic(text))args[0]=translateMixed(text);
          return original.apply(this,args);
        };
      });
      proto.__petatoeI18nPatched=true;
    }catch(_){}
  }

  // FINAL9: initial English hydration coordinator.
  // Some report builders finish after the saved language is restored. Manual language toggling
  // used to fix those surfaces because it reran the full language application lifecycle.
  // This coordinator performs the same lifecycle once, silently, after auth/data/render readiness.
  var hydrationTimer=0;
  var hydrationRunning=false;
  var lastHydrationAt=0;
  var lastDictionarySignature='';

  function dictionarySignature(){
    try{
      var store=window.PETATOE_LOCALIZATION_CENTER_STORE||{};
      var d=store.dictionaries||{};
      return [store.version||'',Object.keys(d.ar||{}).length,Object.keys(d.en||{}).length,!!window.PETATOE_LOCALIZATION_CENTER].join('|');
    }catch(_e){ return ''; }
  }
  function ensureIndexFresh(force){
    var sig=dictionarySignature();
    if(force||!phrasePairs.length||sig!==lastDictionarySignature){
      buildIndex();
      lastDictionarySignature=sig;
    }
  }
  function activeEnglishRoots(){
    var roots=[];
    ['header','.topbar','.top-bar','#nav','.sidebar','.panel.active','main .active','#smartTabs','.smart-tab-section.active','.contract-reason-modal-overlay.show','.new-cust-tier-tooltip','.smart-modal-overlay.show'].forEach(function(selector){
      try{document.querySelectorAll(selector).forEach(function(el){if(roots.indexOf(el)===-1)roots.push(el);});}catch(_e){}
    });
    return roots.length?roots:[document.body||document.documentElement];
  }
  function activeSurfaceHasArabic(){
    var roots=activeEnglishRoots();
    for(var r=0;r<roots.length;r++){
      var root=roots[r];
      if(!root)continue;
      try{
        var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()){
          var node=walker.currentNode;
          if(node.parentElement&&!skip(node.parentElement)&&hasArabic(node.nodeValue))return true;
        }
      }catch(_e){}
    }
    return false;
  }
  function runInitialEnglishHydration(reason){
    hydrationTimer=0;
    if(hydrationRunning||!runtimeEnabled())return;
    ensureIndexFresh(false);
    // Avoid needless work after the active surface is already clean.
    if(!activeSurfaceHasArabic()){requestFullScan(0);return;}
    var now=Date.now();
    if(now-lastHydrationAt<700)return;
    lastHydrationAt=now;
    hydrationRunning=true;
    try{
      if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.apply==='function'){
        window.PETATOE_I18N.apply('en',{renderDashboard:false,source:'initial-hydration',silent:true});
      }
    }catch(_e){}
    finally{
      hydrationRunning=false;
      ensureIndexFresh(false);
      requestFullScan(20);
      try{window.dispatchEvent(new CustomEvent('petatoe:english-hydrated',{detail:{reason:reason||'unknown'}}));}catch(_e2){}
    }
  }
  function scheduleInitialEnglishHydration(reason,delay){
    if(!runtimeEnabled())return;
    clearTimeout(hydrationTimer);
    hydrationTimer=setTimeout(function(){runInitialEnglishHydration(reason);},typeof delay==='number'?delay:180);
  }


  var residualRetryTimer=0;
  var residualRetryCount=0;
  function scheduleResidualCleanup(reason,delay){
    if(!runtimeEnabled())return;
    clearTimeout(residualRetryTimer);
    residualRetryTimer=setTimeout(function run(){
      residualRetryTimer=0;
      patchRuntimeMessageApis();
      ensureIndexFresh(false);
      requestFullScan(0);
      if(activeSurfaceHasArabic()&&residualRetryCount<3){
        residualRetryCount++;
        residualRetryTimer=setTimeout(run,120*(residualRetryCount+1));
      }else{
        residualRetryCount=0;
      }
    },typeof delay==='number'?delay:60);
  }

  function residuals(){
    var rows=[];if(!document.body)return rows;
    function inspect(root){
      var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        var node=walker.currentNode;
        if(node.parentElement&&!skip(node.parentElement)&&hasArabic(node.nodeValue))rows.push({text:normalize(node.nodeValue),element:node.parentElement.tagName,id:node.parentElement.id||'',className:String(node.parentElement.className||'')});
      }
      if(root.querySelectorAll)root.querySelectorAll('*').forEach(function(el){
        ATTRS.forEach(function(name){
          var value=el.getAttribute&&el.getAttribute(name);
          if(hasArabic(value))rows.push({text:normalize(value),attribute:name,element:el.tagName,id:el.id||'',className:String(el.className||'')});
        });
        if(el.shadowRoot)inspect(el.shadowRoot);
      });
    }
    inspect(document.body);return rows;
  }

  var sourceSetterBridgeInstalled=false;
  function translateAssignedValue(owner,value){
    if(!runtimeEnabled()||value==null||!hasArabic(value))return value;
    try{
      if(owner&&owner.nodeType===1&&skip(owner))return value;
      return translateMixed(value);
    }catch(_){return value;}
  }
  function patchPropertySetter(proto,name){
    if(!proto)return false;
    var descriptor;
    try{descriptor=Object.getOwnPropertyDescriptor(proto,name);}catch(_){return false;}
    if(!descriptor||typeof descriptor.set!=='function'||descriptor.set.__petatoeI18nBridge)return false;
    var originalSet=descriptor.set;
    var wrappedSet=function(value){return originalSet.call(this,translateAssignedValue(this,value));};
    wrappedSet.__petatoeI18nBridge=true;
    wrappedSet.__petatoeI18nOriginal=originalSet;
    try{
      Object.defineProperty(proto,name,{configurable:descriptor.configurable,enumerable:descriptor.enumerable,get:descriptor.get,set:wrappedSet});
      return true;
    }catch(_){return false;}
  }
  function installSourceSetterBridge(){
    if(sourceSetterBridgeInstalled)return;
    sourceSetterBridgeInstalled=true;
    patchPropertySetter(window.Node&&Node.prototype,'textContent');
    patchPropertySetter(window.Element&&Element.prototype,'innerHTML');
    patchPropertySetter(window.Element&&Element.prototype,'outerHTML');
    if(window.Element&&Element.prototype&&typeof Element.prototype.insertAdjacentHTML==='function'&&!Element.prototype.insertAdjacentHTML.__petatoeI18nBridge){
      var originalInsertAdjacentHTML=Element.prototype.insertAdjacentHTML;
      var wrappedInsertAdjacentHTML=function(position,html){return originalInsertAdjacentHTML.call(this,position,translateAssignedValue(this,html));};
      wrappedInsertAdjacentHTML.__petatoeI18nBridge=true;
      wrappedInsertAdjacentHTML.__petatoeI18nOriginal=originalInsertAdjacentHTML;
      try{Element.prototype.insertAdjacentHTML=wrappedInsertAdjacentHTML;}catch(_){ }
    }
    if(window.Element&&Element.prototype&&typeof Element.prototype.setAttribute==='function'&&!Element.prototype.setAttribute.__petatoeI18nBridge){
      var originalSetAttribute=Element.prototype.setAttribute;
      var wrappedSetAttribute=function(name,value){
        var attr=String(name||'').toLowerCase();
        if(ATTRS.indexOf(attr)!==-1||attr==='value')value=translateAssignedValue(this,value);
        return originalSetAttribute.call(this,name,value);
      };
      wrappedSetAttribute.__petatoeI18nBridge=true;
      wrappedSetAttribute.__petatoeI18nOriginal=originalSetAttribute;
      try{Element.prototype.setAttribute=wrappedSetAttribute;}catch(_){ }
    }
  }

  function init(){installSourceSetterBridge();patchCanvas();patchNativeDialogs();patchRuntimeMessageApis();installObserver();if(runtimeEnabled()){buildIndex();resumeObserver();requestFullScan(0);}}


  window.PETATOE_GLOBAL_SCREEN_TRANSLATOR={
    translate:translateMixed,
    monthName:englishMonth,
    scan:function(){requestFullScan(0);},
    rebuild:function(){ensureIndexFresh(true);requestFullScan(0);},
    hydrate:function(){scheduleInitialEnglishHydration('manual-api',0);},
    remainingArabic:residuals,
    stats:function(){return{mode:'final-residual-source-cleanup',observerActive:!!observer&&runtimeEnabled(),authenticated:isAuthenticated(),runtimeEnabled:runtimeEnabled(),queuedNodes:mutationQueue.length,cacheSize:translationCache.size,phrases:phrasePairs.length,processing:processing,patchedMessageApis:Object.keys(patchedMessageFunctions).length};},
    assertEnglishClean:function(){
      var rows=residuals();
      if(rows.length)console.error('[PETATOE i18n] Arabic remains in English UI',rows);
      else console.info('[PETATOE i18n] English UI is clean');
      return{passed:rows.length===0,count:rows.length,items:rows};
    }
  };

  window.addEventListener('petatoe:language-changed',function(){
    if(runtimeEnabled()){patchRuntimeMessageApis();patchRuntimeMessageApis();ensureIndexFresh(true);installObserver();resumeObserver();requestFullScan(0);scheduleInitialEnglishHydration('language-changed',40);scheduleResidualCleanup('language-changed',80);}else{pauseObserver();mutationQueue.length=0;queuedNodes.clear();}
  });
  document.addEventListener('petatoe:userchanged',function(e){
    var user=e&&e.detail&&e.detail.user;
    if(user&&(user.id||user.username)){
      ensureIndexFresh(true);installObserver();resumeObserver();requestFullScan(0);
    }else{
      pauseObserver();cancelIdle(flushHandle);cancelIdle(fullScanHandle);flushHandle=0;fullScanHandle=0;
      mutationQueue.length=0;queuedNodes.clear();processing=false;
    }
  });
  document.addEventListener('petatoe:tabchange',function(){ensureIndexFresh(false);});
  document.addEventListener('click',function(){},true);
  window.addEventListener('petatoe:records-changed',function(){ensureIndexFresh(false);});
  document.addEventListener('petatoe:navbuilt',function(){ensureIndexFresh(false);});
  window.addEventListener('petatoe:localization-ready',function(){if(runtimeEnabled()){ensureIndexFresh(true);requestFullScan(50);scheduleInitialEnglishHydration('localization-ready',140);}});
  ['petatoe:dashboard-rendered','petatoe:reports-rendered','petatoe:smart-rendered','petatoe:operations-rendered','petatoe:payroll-rendered','petatoe:warehouse-rendered','petatoe:treasury-rendered','petatoe:modal-opened'].forEach(function(evt){window.addEventListener(evt,function(){scheduleResidualCleanup(evt,30);});});
  document.addEventListener('petatoe:tabchange',function(){scheduleResidualCleanup('tabchange',40);});
  window.addEventListener('load',function(){if(runtimeEnabled()){ensureIndexFresh(true);requestFullScan(180);scheduleInitialEnglishHydration('window-load',420);}});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
