/* PETATOE v9 Enterprise i18n Runtime Coverage Guard
   Read-only diagnostics for untranslated runtime UI. No business data writes. */
(function(){
  'use strict';

  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  var SKIP_SELECTOR='script,style,noscript,code,pre,[data-i18n-skip="true"],#petLanguageSwitcher';
  var lastReport=null;

  function language(){
    try{
      if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.getLanguage==='function') return window.PETATOE_I18N.getLanguage();
    }catch(_){}
    return document.documentElement.getAttribute('lang')||'ar';
  }

  function normalize(value){return String(value||'').replace(/\s+/g,' ').trim();}

  function isVisible(el){
    if(!el||!el.isConnected) return false;
    try{
      var style=window.getComputedStyle(el);
      if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0) return false;
      return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);
    }catch(_){return true;}
  }

  function describe(el){
    if(!el) return 'unknown';
    var out=(el.tagName||'node').toLowerCase();
    if(el.id) out+='#'+el.id;
    if(el.classList&&el.classList.length) out+='.'+Array.prototype.slice.call(el.classList,0,3).join('.');
    return out;
  }

  function activeScreen(){
    var active=document.querySelector('section.active,[data-page].active,.page.active,.tab-page.active');
    if(active) return active.id||active.getAttribute('data-page')||describe(active);
    var nav=document.querySelector('#nav [data-tab].active,#nav [aria-current="page"]');
    return nav?(nav.getAttribute('data-tab')||normalize(nav.textContent)):'unknown';
  }

  function collect(root){
    root=root||document.body;
    var issues=[];
    if(!root) return issues;

    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var el=node.parentElement;
      if(!el||el.closest(SKIP_SELECTOR)||!isVisible(el)) return NodeFilter.FILTER_REJECT;
      var text=normalize(node.nodeValue);
      return text&&ARABIC_RE.test(text)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    while(walker.nextNode()){
      var node=walker.currentNode;
      issues.push({kind:'text',text:normalize(node.nodeValue).slice(0,240),element:describe(node.parentElement)});
    }

    root.querySelectorAll('[placeholder],[title],[aria-label],input[type="button"],input[type="submit"],input[type="reset"]').forEach(function(el){
      if(el.closest(SKIP_SELECTOR)||!isVisible(el)) return;
      ['placeholder','title','aria-label','value'].forEach(function(attr){
        if(!el.hasAttribute(attr)) return;
        if(attr==='value'&&!(el.tagName==='INPUT'&&/^(button|submit|reset)$/i.test(el.type))) return;
        var value=normalize(el.getAttribute(attr));
        if(value&&ARABIC_RE.test(value)) issues.push({kind:'attribute',attribute:attr,text:value.slice(0,240),element:describe(el)});
      });
    });
    return issues;
  }

  function dedupe(items){
    var seen=new Set();
    return items.filter(function(item){
      var key=[item.kind,item.attribute||'',item.text,item.element].join('|');
      if(seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function run(options){
    options=options||{};
    var lang=language();
    var issues=lang==='en'?dedupe(collect(options.root||document.body)):[];
    var report={
      timestamp:new Date().toISOString(),
      language:lang,
      screen:activeScreen(),
      passed:issues.length===0,
      issueCount:issues.length,
      issues:issues
    };
    lastReport=report;
    window.__PETATOE_I18N_LAST_COVERAGE__=report;
    if(options.log!==false&&window.console){
      console[report.passed?'info':'warn']('[PETATOE i18n Runtime Coverage]',report);
      if(!report.passed&&console.table) console.table(issues);
    }
    document.dispatchEvent(new CustomEvent('petatoe:i18n-coverage-complete',{detail:report}));
    return report;
  }

  function download(report){
    report=report||lastReport||run({log:false});
    try{
      var blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url; a.download='petatoe-i18n-coverage-'+Date.now()+'.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){URL.revokeObjectURL(url);},1000);
      return true;
    }catch(_){return false;}
  }

  window.PETATOEI18NCoverage={run:run,download:download,getLastReport:function(){return lastReport;}};
  window.petatoeI18nCoverage=function(options){return run(options);};
  window.petatoeI18nCoverageDownload=function(){return download();};

  try{
    var params=new URLSearchParams(location.search);
    if(params.get('i18nCoverage')==='1'){
      var schedule=window.requestIdleCallback||function(fn){return setTimeout(fn,1000);};
      schedule(function(){run({log:true});});
    }
  }catch(_){}
})();
