/* PETATOE v9 Enterprise i18n Engine
   Isolated translation runtime: no business data, no Supabase logic, no auth logic. */
(function(){
  'use strict';
  var STORAGE_KEY='petatoe.ui.language';
  var LOCALIZATION_REGISTRY=window.PETATOE_LOCALIZATION_REGISTRY||null;
  var DEFAULT_LANG=LOCALIZATION_REGISTRY?LOCALIZATION_REGISTRY.defaultLanguage:'ar';
  function supportedLanguages(){return LOCALIZATION_REGISTRY?LOCALIZATION_REGISTRY.enabledCodes():['ar','en'];}
  /* E5.2.19.4: no independent dictionary owner in the DOM engine. */

  function normalizeLang(lang){
    lang=String(lang||'').toLowerCase();
    var supported=supportedLanguages();
    return supported.indexOf(lang)>=0?lang:DEFAULT_LANG;
  }
  function getPath(obj,path){
    return String(path||'').split('.').reduce(function(acc,key){
      return acc&&Object.prototype.hasOwnProperty.call(acc,key)?acc[key]:undefined;
    },obj);
  }
  function safeStorageGet(){try{return localStorage.getItem(STORAGE_KEY);}catch(_){return null;}}
  function safeStorageSet(lang){try{localStorage.setItem(STORAGE_KEY,lang);}catch(_){}}
  function currentLang(){return normalizeLang(safeStorageGet()||window.__PETATOE_INITIAL_LANGUAGE__||document.documentElement.getAttribute('lang')||DEFAULT_LANG);}
  function canonicalStore(){return window.PETATOE_LOCALIZATION_CENTER_STORE||null;}
  function canonicalStoreValue(key,lang){
    try{var store=canonicalStore();if(store&&typeof store.getPath==='function'){var value=store.getPath(normalizeLang(lang||currentLang()),key);if(value!==undefined&&value!==null&&value!=='')return value;}}catch(_e){}
    return undefined;
  }
  function translate(key,lang){return canonicalStoreValue(key,normalizeLang(lang||currentLang()));}
  function normalizeTextValue(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function hashText(value){
    var str=normalizeTextValue(value);
    var h=0x811c9dc5;
    for(var i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);
    }
    return 'h'+('00000000'+(h>>>0).toString(16)).slice(-8);
  }
  function legacyHashText(value){
    /* SHA-1 keys generated at build time are exposed through a browser-safe lookup map below. */
    var str=normalizeTextValue(value);
    return window.PETATOE_I18N_SHA1_KEYS&&window.PETATOE_I18N_SHA1_KEYS[str];
  }
  function phraseKeyFor(value){return legacyHashText(value)||hashText(value);}
  function translatePhraseByKey(key,lang){return canonicalStoreValue('autoPhrases.'+key,normalizeLang(lang||currentLang()));}
  function interpolate(value,params){
    var out=String(value||'');
    params=params||{};
    Object.keys(params).forEach(function(k){out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});
    return out;
  }
  function translateRuntimeByKey(key,lang){return canonicalStoreValue('runtimePhrases.'+key,normalizeLang(lang||currentLang()));}
  function getRuntimeTemplates(lang){return canonicalStoreValue('runtimeTemplates',normalizeLang(lang||currentLang()))||{};}
  function translateRuntimeValue(value,lang){
    if(value===undefined||value===null)return value;
    lang=normalizeLang(lang||currentLang());var text=String(value);
    if(lang==='ar')return text; /* Arabic is authored source; never reverse-translate. */
    var key=phraseKeyFor(text),exact=translateRuntimeByKey(key,'en')||translatePhraseByKey(key,'en');
    if(typeof exact==='string'&&exact)return exact;
    try{var store=canonicalStore(),dict=store&&store.dictionaries&&store.dictionaries.en;var direct=(dict&&dict.runtimeSource&&dict.runtimeSource[text])||(dict&&dict.globalUiSource&&dict.globalUiSource[text]);if(typeof direct==='string'&&direct)return direct;}catch(_e){}
    var sourceTemplates=getRuntimeTemplates('ar'),targetTemplates=getRuntimeTemplates('en');
    for(var k in sourceTemplates){if(!Object.prototype.hasOwnProperty.call(sourceTemplates,k))continue;var source=sourceTemplates[k]&&sourceTemplates[k].source,mode=sourceTemplates[k]&&sourceTemplates[k].mode||'prefix';if(typeof source!=='string')continue;if((mode==='exact'&&text===source)||(mode!=='exact'&&text.indexOf(source)===0)){var target=targetTemplates&&targetTemplates[k]&&targetTemplates[k].target;if(typeof target==='string')return interpolate(target,{rest:mode==='exact'?'':text.slice(source.length)});}}
    return text;
  }
  function patchRuntimeTextAPIs(){
    if(!window.__PETATOE_I18N_ORIGINAL_ALERT__&&typeof window.alert==='function'){
      window.__PETATOE_I18N_ORIGINAL_ALERT__=window.alert;
      window.alert=function(message){return window.__PETATOE_I18N_ORIGINAL_ALERT__.call(window,translateRuntimeValue(message));};
    }
    if(!window.__PETATOE_I18N_ORIGINAL_CONFIRM__&&typeof window.confirm==='function'){
      window.__PETATOE_I18N_ORIGINAL_CONFIRM__=window.confirm;
      window.confirm=function(message){return window.__PETATOE_I18N_ORIGINAL_CONFIRM__.call(window,translateRuntimeValue(message));};
    }
    if(!window.__PETATOE_I18N_ORIGINAL_PROMPT__&&typeof window.prompt==='function'){
      window.__PETATOE_I18N_ORIGINAL_PROMPT__=window.prompt;
      window.prompt=function(message,def){return window.__PETATOE_I18N_ORIGINAL_PROMPT__.call(window,translateRuntimeValue(message),def);};
    }
    ['toast','toastSafe','notify'].forEach(function(name){
      var fn=window[name];
      if(typeof fn==='function'&&!fn.__petatoeI18nWrapped){
        var wrapped=function(message){
          var args=Array.prototype.slice.call(arguments);
          if(args.length) args[0]=translateRuntimeValue(args[0]);
          return fn.apply(this,args);
        };
        wrapped.__petatoeI18nWrapped=true;
        wrapped.__petatoeI18nOriginal=fn;
        try{window[name]=wrapped;}catch(_){}
      }
    });
  }
  var autoTextNodeKeys=new WeakMap();
  var autoTextNodeSources=new WeakMap();
  var autoAttrKeys=new WeakMap();
  var autoAttrSources=new WeakMap();
  var explicitTextSources=new WeakMap();
  var explicitAttrSources=new WeakMap();
  function rememberExplicitText(el){if(!explicitTextSources.has(el))explicitTextSources.set(el,String(el&&el.textContent||''));return explicitTextSources.get(el);}
  function rememberExplicitAttr(el,attr){var b=explicitAttrSources.get(el)||{};if(!Object.prototype.hasOwnProperty.call(b,attr)){b[attr]=String(el&&el.getAttribute&&el.getAttribute(attr)||'');explicitAttrSources.set(el,b);}return b[attr];}
  function isRawKeySource(source,key){source=normalizeTextValue(source);key=normalizeTextValue(key);return !source||source===key||/^[A-Za-z_$][\w$]*(?:[.-][A-Za-z_$][\w$]*)+$/.test(source);}
  function authoredArabicText(el,key){var source=rememberExplicitText(el);if(!isRawKeySource(source,key))return source;var fallback=canonicalStoreValue(key,'ar');return typeof fallback==='string'&&fallback?fallback:source;}
  function authoredArabicAttr(el,attr,key){var source=rememberExplicitAttr(el,attr);if(!isRawKeySource(source,key))return source;var fallback=canonicalStoreValue(key,'ar');return typeof fallback==='string'&&fallback?fallback:source;}
  function setElementText(el,key,lang){
    if(!el)return;lang=normalizeLang(lang||currentLang());
    var value=lang==='ar'?authoredArabicText(el,key):translate(key,'en');
    if(typeof value==='string'&&value!=='')el.textContent=value;
  }
  function setText(selector,key,lang){setElementText(document.querySelector(selector),key,lang);}
  function setElementTitle(el,key,lang){
    if(!el)return;lang=normalizeLang(lang||currentLang());
    var source=rememberExplicitAttr(el,'title')||rememberExplicitAttr(el,'aria-label');
    var value=lang==='ar'?(isRawKeySource(source,key)?canonicalStoreValue(key,'ar'):source):translate(key,'en');
    if(typeof value==='string'&&value!==''){el.setAttribute('title',value);el.setAttribute('aria-label',value);}
  }
  function setTitle(selector,key,lang){setElementTitle(document.querySelector(selector),key,lang);}
  function setElementPlaceholder(el,key,lang){
    if(!el)return;lang=normalizeLang(lang||currentLang());var value=lang==='ar'?authoredArabicAttr(el,'placeholder',key):translate(key,'en');
    if(typeof value==='string'&&value!=='')el.setAttribute('placeholder',value);
  }
  function setPlaceholder(selector,key,lang){setElementPlaceholder(document.querySelector(selector),key,lang);}
  function setHtml(selector,key,lang){setElementText(document.querySelector(selector),key,lang);}

  function shouldSkipAutoI18n(node){
    if(!node) return true;
    var el=node.nodeType===1?node:node.parentElement;
    if(!el) return true;
    return !!(el.closest('script,style,noscript,code,pre,#petLanguageSwitcher')||el.closest('[data-i18n-skip="true"]'));
  }
  function translateAutoTextNodes(lang,root){
    lang=normalizeLang(lang||currentLang());
    root=root&&root.nodeType?root:document.body;
    if(!root) return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      if(shouldSkipAutoI18n(node)) return NodeFilter.FILTER_REJECT;
      var txt=normalizeTextValue(node.nodeValue);
      if(!txt) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var source=autoTextNodeSources.get(node);if(source===undefined){source=node.nodeValue;autoTextNodeSources.set(node,source);}
      var key=autoTextNodeKeys.get(node)||phraseKeyFor(source);autoTextNodeKeys.set(node,key);
      if(lang==='ar'){if(node.nodeValue!==source)node.nodeValue=source;return;}
      var value=translatePhraseByKey(key,'en');if(typeof value==='string'&&value)node.nodeValue=source.replace(/\S[\s\S]*\S|\S/,value);
    });
  }
  function translateAutoAttributes(lang,root){
    lang=normalizeLang(lang||currentLang());
    root=root&&root.nodeType?root:document.body;
    if(!root) return;
    var attrs=['placeholder','title','aria-label','value'];
    var elements=[];
    if(root.nodeType===1&&root.matches&&root.matches('input,textarea,button,select,option,[title],[aria-label]')) elements.push(root);
    if(root.querySelectorAll) elements=elements.concat(Array.prototype.slice.call(root.querySelectorAll('input,textarea,button,select,option,[title],[aria-label]')));
    elements.forEach(function(el){
      if(shouldSkipAutoI18n(el)) return;
      attrs.forEach(function(attr){
        if(!el.hasAttribute||!el.hasAttribute(attr)) return;
        if(attr==='value'&&!(el.tagName==='INPUT'&&(el.type==='button'||el.type==='submit'||el.type==='reset'))) return;
        var current=el.getAttribute(attr),bucket=autoAttrKeys.get(el)||{},sources=autoAttrSources.get(el)||{};
        if(sources[attr]===undefined)sources[attr]=current;var source=sources[attr],key=bucket[attr]||phraseKeyFor(source);bucket[attr]=key;autoAttrKeys.set(el,bucket);autoAttrSources.set(el,sources);
        if(lang==='ar'){if(current!==source)el.setAttribute(attr,source);return;}
        var value=translatePhraseByKey(key,'en');if(typeof value==='string'&&value)el.setAttribute(attr,value);
      });
    });
  }
  function translateAutoStaticPhrases(lang,root){
    translateAutoAttributes(lang,root);
    translateAutoTextNodes(lang,root);
  }

  function selectWithin(root,selector){
    root=root&&root.nodeType?root:document;
    var out=[];
    if(root.nodeType===1&&root.matches&&root.matches(selector)) out.push(root);
    if(root.querySelectorAll) out=out.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
    return out;
  }
  function applyDataAttributes(lang,root){
    lang=normalizeLang(lang||currentLang());
    selectWithin(root,'[data-i18n]').forEach(function(el){
      var key=el.getAttribute('data-i18n');
      var value=lang==='ar'?authoredArabicText(el,key):translate(key,'en');
      if(typeof value==='string'&&value!=='')el.textContent=value;
    });
    selectWithin(root,'[data-i18n-title]').forEach(function(el){
      var key=el.getAttribute('data-i18n-title');
      var source=rememberExplicitAttr(el,'title')||rememberExplicitAttr(el,'aria-label');
      var value=lang==='ar'?(isRawKeySource(source,key)?canonicalStoreValue(key,'ar'):source):translate(key,'en');
      if(typeof value==='string'&&value!==''){el.setAttribute('title',value);el.setAttribute('aria-label',value);}
    });
    selectWithin(root,'[data-i18n-placeholder]').forEach(function(el){
      var key=el.getAttribute('data-i18n-placeholder');
      var value=lang==='ar'?authoredArabicAttr(el,'placeholder',key):translate(key,'en');
      if(typeof value==='string'&&value!=='')el.setAttribute('placeholder',value);
    });
  }
  function applyKnownStaticTexts(lang){
    setText('#sideLauncher .launch-text b','app.name',lang);
    setText('#sideLauncher .launch-text small','app.subtitle',lang);
    setTitle('#sideLauncher','topbar.launcherTitle',lang);
    setTitle('#topbarSearch','topbar.searchTitle',lang);
    setText('.pet-topbar-compact-actions .reports-btn:not(#headerPdfBtn)','topbar.reports',lang);
    setText('#headerPdfBtn','topbar.pdf',lang);
    setTitle('#topbarNotifBtn','topbar.notifications',lang);
    setText('#petLanguageCurrent','language.button',lang);
    setTitle('#petLanguageToggle','language.toggleTitle',lang);
    setText('.pet-language-option[data-pet-lang="ar"]','language.arabic',lang);
    setText('.pet-language-option[data-pet-lang="en"]','language.english',lang);
    setPlaceholder('#globalSearchInput','globalSearch.placeholder',lang);
    setText('#globalSearchShortcut','globalSearch.shortcut',lang);
    setText('#dashboard .section-head h2','dashboard.title',lang);
    setText('#dashboard .section-head p','dashboard.subtitle',lang);
    setText('#safeDashboardPdfBtn','actions.exportPagePdf',lang);
    var refresh=document.querySelector('#dashboard .section-head [data-pet-action="dashboard-refresh"]');
    if(refresh)setElementText(refresh,'actions.refresh',lang);
    var reset=document.querySelector('#dashboard [data-pet-action="dashboard-reset"]'); if(reset)setElementText(reset,'actions.reset',lang);
    var selects=[['#fYear','filters.allYears'],['#fMonth','filters.allMonths'],['#fVan','filters.allVehicles'],['#fPay','filters.allPayments']];
    selects.forEach(function(pair){var sel=document.querySelector(pair[0]);if(sel&&sel.options&&sel.options[0])setElementText(sel.options[0],pair[1],lang);});
    var homeCards=document.querySelectorAll('#dashboard .payroll-home-card');
    if(homeCards[0]){var b=homeCards[0].querySelector('b'), s=homeCards[0].querySelector('small');if(b)setElementText(b,'payroll.manage',lang);if(s)setElementText(s,'payroll.manageSub',lang);}
    if(homeCards[1]){var b2=homeCards[1].querySelector('b'), s2=homeCards[1].querySelector('small');if(b2)setElementText(b2,'payroll.slip',lang);if(s2)setElementText(s2,'payroll.slipSub',lang);}
    setText('#dashboard .monthly-wide-card .card-title b','dashboard.monthlySales',lang);
    setText('#dashboard .dashboard-services-card .card-title b','dashboard.topServices',lang);
    setText('#dashboard .dashboard-clients-card .card-title b','dashboard.topClients',lang);
    setText('#dashboard .payment-below-card .card-title b','dashboard.paymentSales',lang);
    var homeCards2=document.querySelectorAll('#dashboard .grid[style*="margin-top:16px"] .card-title b');
    if(homeCards2[1])setElementText(homeCards2[1],'dashboard.vansComparison',lang);
    setSidebarTexts(lang);
  }
  function setSidebarTexts(lang){
    var tabKeyMap={
      appointments:'sidebar.appointments',dashboard:'sidebar.home',childrenExpenses:'sidebar.children',
      entry:'sidebar.dataEntry',import:'sidebar.excelUpload',records:'sidebar.records',logs:'sidebar.auditLog',
      smart:'sidebar.smartReports',customer360:'sidebar.customer360',commissions:'sidebar.commissions',commissionStatement:'sidebar.commissionStatement',
      executive:'sidebar.executive',obligations:'sidebar.obligations',payroll:'sidebar.payroll',salarySlip:'sidebar.salarySlip',
      fleet:'sidebar.fleet',treasury:'sidebar.treasury',warehouses:'sidebar.warehouses',settings:'sidebar.settings'
    };
    document.querySelectorAll('#nav [data-tab]').forEach(function(el){
      if(el.hasAttribute('data-i18n')||el.querySelector('[data-i18n]')) return;
      var key=tabKeyMap[el.getAttribute('data-tab')];
      if(key)setElementText(el,key,lang);
    });
    var groupKeyMap={operationManagement:'sidebar.operations',operations:'sidebar.transactions',analytics:'sidebar.analytics',management:'sidebar.management',settings:'sidebar.system',system:'sidebar.system'};
    document.querySelectorAll('#nav [data-nav-group],#nav [data-v142-toggle]').forEach(function(el){
      var key=groupKeyMap[el.getAttribute('data-nav-group')||el.getAttribute('data-v142-toggle')];
      var target=el.querySelector('span')||el;
      if(key&&!target.hasAttribute('data-i18n'))setElementText(target,key,lang);
    });
  }
  function setMenuState(open){
    var switcher=document.getElementById('petLanguageSwitcher');
    var btn=document.getElementById('petLanguageToggle');
    if(switcher) switcher.classList.toggle('open',!!open);
    if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
  }
  var applying=false;
  var reapplyTimer=null;
  function localizationLoading(){var loader=window.PETATOE_LOCALIZATION_LOADER;return !!(loader&&loader.state&&loader.state.loading);}
  function isInsideI18nScope(node){
    var el=node&&node.nodeType===1?node:(node&&node.parentElement);
    if(!el||!el.closest) return false;
    return !!el.closest('[data-i18n],[data-i18n-title],[data-i18n-placeholder],#nav,#dashboard,.toast,#toast');
  }
  function reapplyLanguage(lang){
    lang=normalizeLang(lang||currentLang());
    if(localizationLoading()){scheduleReapply(lang,40);return false;}
    patchRuntimeTextAPIs();
    applying=true;
    try{
      // Performance: translate only the persistent shell and currently visible surfaces.
      // Hidden panels are localized lazily on petatoe:tabchange.
      applyKnownStaticTexts(lang);
      applyActiveSubtrees(lang);
    }finally{
      applying=false;
    }
  }
  function translateAddedSubtree(root,lang){
    if(!root||!root.nodeType||localizationLoading()) return;
    lang=normalizeLang(lang||currentLang());
    patchRuntimeTextAPIs();
    applying=true;
    try{
      applyDataAttributes(lang,root);
      translateAutoStaticPhrases(lang,root);
      if(root.nodeType===1&&(root.id==='nav'||root.closest&&root.closest('#nav'))) setSidebarTexts(lang);
    }finally{
      applying=false;
    }
  }

  function activeLocalizationRoots(){
    var roots=[];
    ['header','.topbar','.top-bar','#nav','.sidebar','.panel.active','main .active','#smartTabs','.smart-tab-section.active','.smart-modal-overlay.show','.contract-reason-modal-overlay.show'].forEach(function(selector){
      try{document.querySelectorAll(selector).forEach(function(el){if(roots.indexOf(el)===-1)roots.push(el);});}catch(_e){}
    });
    return roots.length?roots:[document.body||document.documentElement];
  }
  function applyActiveSubtrees(lang){
    activeLocalizationRoots().forEach(function(root){translateAddedSubtree(root,lang);});
  }

  function scheduleReapply(lang,delay){
    lang=normalizeLang(lang||currentLang());
    if(reapplyTimer) clearTimeout(reapplyTimer);
    reapplyTimer=setTimeout(function(){reapplyTimer=null;if(localizationLoading()){scheduleReapply(lang,40);return;}reapplyLanguage(lang);},typeof delay==='number'?delay:80);
  }
  function setNavigationReady(ready){
    document.documentElement.setAttribute('data-pet-i18n-nav-ready',ready?'true':'false');
  }
  function finishInitialPaint(){
    var boot=window.PETATOE_I18N_BOOT;
    if(boot&&typeof boot.reveal==='function'){
      boot.reveal('localization-engine-ready',false);
      return;
    }
    document.documentElement.removeAttribute('data-pet-i18n-booting');
    document.documentElement.setAttribute('data-pet-i18n-ready','true');
  }
  function applyLanguage(lang,options){
    lang=normalizeLang(lang);
    options=options||{};
    safeStorageSet(lang);
    setNavigationReady(false);
    applying=true;
    if(window.PETATOE_DIRECTION&&typeof window.PETATOE_DIRECTION.apply==='function'){
      window.PETATOE_DIRECTION.apply(lang,{silent:true});
    }else{
      var fallbackDir=lang==='ar'?'rtl':'ltr';
      document.documentElement.setAttribute('lang',lang);
      document.documentElement.setAttribute('dir',fallbackDir);
      document.documentElement.setAttribute('data-layout-dir',fallbackDir);
      if(document.body){document.body.setAttribute('dir',fallbackDir);document.body.setAttribute('data-layout-dir',fallbackDir);document.body.setAttribute('data-petatoe-lang',lang);}
    }
    document.querySelectorAll('.pet-language-option[data-pet-lang]').forEach(function(opt){
      var active=normalizeLang(opt.getAttribute('data-pet-lang'))===lang;
      opt.classList.toggle('active',active);
      opt.setAttribute('aria-selected',active?'true':'false');
    });
    setMenuState(false);
    applying=false;
    if(options.renderDashboard){try{ if(typeof window.renderDashboardAll==='function') window.renderDashboardAll(); }catch(_){}}
    try{
      reapplyLanguage(lang);
    }finally{
      setNavigationReady(true);
      finishInitialPaint();
    }
    window.dispatchEvent(new CustomEvent('petatoe:language-changed',{detail:{language:lang}}));
  }
  function bindLanguageOptions(){
    document.querySelectorAll('.pet-language-option[data-pet-lang]').forEach(function(opt){
      if(opt.dataset.petI18nOptionBound==='1') return;
      opt.dataset.petI18nOptionBound='1';
      opt.addEventListener('click',function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var lang=normalizeLang(opt.getAttribute('data-pet-lang'));
        if(lang===currentLang()){ setMenuState(false); return; }
        applyLanguage(lang,{renderDashboard:false});
      });
    });
  }
  function init(){
    var btn=document.getElementById('petLanguageToggle');
    if(btn&&!btn.dataset.petI18nBound){
      btn.dataset.petI18nBound='1';
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();var sw=document.getElementById('petLanguageSwitcher');setMenuState(!(sw&&sw.classList.contains('open')));});
    }
    bindLanguageOptions();
    if(!document.documentElement.dataset.petI18nOutsideBound){
      document.documentElement.dataset.petI18nOutsideBound='1';
      document.addEventListener('click',function(ev){var sw=document.getElementById('petLanguageSwitcher');if(sw&&!sw.contains(ev.target)) setMenuState(false);});
      document.addEventListener('keydown',function(ev){if(ev.key==='Escape') setMenuState(false);});
    }
    if(!document.documentElement.dataset.petI18nMutationBound){
      document.documentElement.dataset.petI18nMutationBound='1';
      try{
        var pendingRoots=new Set();
        var pendingFrame=0;
        function queueRoot(node){
          if(!node||node.nodeType!==1||node.closest('#petLanguageSwitcher')||node.closest('#smartReportsArea'))return;
          // Avoid processing both a parent subtree and its descendants in the same frame.
          var covered=false;
          pendingRoots.forEach(function(existing){
            if(existing===node||(existing.contains&&existing.contains(node)))covered=true;
            else if(node.contains&&node.contains(existing))pendingRoots.delete(existing);
          });
          if(!covered)pendingRoots.add(node);
        }
        function flushAddedRoots(){
          pendingFrame=0;
          if(applying||window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__||!pendingRoots.size) return;
          var roots=Array.from(pendingRoots);pendingRoots.clear();
          roots.forEach(function(root){
            if(root&&root.isConnected!==false) translateAddedSubtree(root,currentLang());
          });
        }
        var observer=new MutationObserver(function(mutations){
          if(applying||window.__PETATOE_LOCALIZATION_MUTATION_SUSPENDED__) return;
          mutations.forEach(function(mutation){
            Array.prototype.forEach.call(mutation.addedNodes||[],queueRoot);
          });
          if(pendingRoots.size&&!pendingFrame) pendingFrame=requestAnimationFrame(flushAddedRoots);
        });
        observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
      }catch(_){}
    }
    applyLanguage(currentLang(),{renderDashboard:false});
  }

  document.addEventListener('petatoe:navbuilt',function(){
    try{
      translateAddedSubtree(document.getElementById('nav')||document.body,currentLang());
    }finally{
      setNavigationReady(true);
    }
  });
  var tabTranslateFrame=0,lastTabTranslateToken=0;
  document.addEventListener('petatoe:tabchange',function(e){
    var token=e&&e.detail&&e.detail.routeToken||Date.now();
    lastTabTranslateToken=token;
    if(tabTranslateFrame){try{cancelAnimationFrame(tabTranslateFrame);}catch(_e){clearTimeout(tabTranslateFrame);}}
    var run=function(){tabTranslateFrame=0;if(token!==lastTabTranslateToken)return;applyActiveSubtrees(currentLang());};
    tabTranslateFrame=typeof requestAnimationFrame==='function'?requestAnimationFrame(run):setTimeout(run,0);
  });
  window.addEventListener('petatoe:localization-ready',function(){bindLanguageOptions();scheduleReapply(currentLang(),0);});
  window.addEventListener('petatoe:localization-loading',function(e){if(!(e&&e.detail&&e.detail.loading))scheduleReapply(currentLang(),0);});
  window.PETATOE_I18N={
    getLanguage:currentLang,
    setLanguage:applyLanguage,
    translate:translate,
    translateRuntime:translateRuntimeValue,
    t:function(key,params,lang){var v=translate(key,lang);return typeof v==='string'?interpolate(v,params):v;},
    dictionaries:(canonicalStore()&&canonicalStore().dictionaries)||window.PETATOE_I18N_DICTIONARIES||{},
    sourceLanguage:'ar',
    translationTarget:'en',
    arabicRenderPolicy:'authored-source-snapshot-first',
    englishCatalogOwner:'PETATOE_LOCALIZATION_CENTER_STORE.en',
    format:window.PETATOE_FORMATTER||null,
    direction:window.PETATOE_DIRECTION||null,
    reapply:function(){scheduleReapply(currentLang());},
    apply:applyLanguage,
    applySubtree:function(root){translateAddedSubtree(root,currentLang());},
    refreshLanguageOptions:bindLanguageOptions,
    supportedLanguages:supportedLanguages,
    registry:LOCALIZATION_REGISTRY
  };
  /* E5.2.20 canonical facade for non-i18n modules. Keeps PETATOE_I18N private to the localization layer. */
  window.PETATOE_LOCALIZATION_RUNTIME={
    getLanguage:currentLang,
    translateRuntime:translateRuntimeValue,
    applySubtree:function(root){translateAddedSubtree(root,currentLang());},
    reapply:function(){scheduleReapply(currentLang(),0);},
    sourceLanguage:'ar',translationTarget:'en',domOwner:'i18n/index.js'
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
