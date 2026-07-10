/* PETATOE v9 Enterprise i18n Certification Diagnostics
   Read-only audit utility. It does not change business data, Supabase, auth, or UI state. */
(function(){
  'use strict';

  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  var SKIP_SELECTOR='script,style,noscript,code,pre,[data-i18n-skip="true"],#petLanguageSwitcher';

  function flatten(obj,prefix,out){
    out=out||{};
    prefix=prefix||'';
    Object.keys(obj||{}).forEach(function(key){
      var path=prefix?prefix+'.'+key:key;
      var value=obj[key];
      if(value&&typeof value==='object'&&!Array.isArray(value)) flatten(value,path,out);
      else out[path]=value;
    });
    return out;
  }

  function getPath(obj,path){
    return String(path||'').split('.').reduce(function(acc,key){
      return acc&&Object.prototype.hasOwnProperty.call(acc,key)?acc[key]:undefined;
    },obj);
  }

  function visibleTextNodes(root){
    var result=[];
    if(!root||!document.createTreeWalker) return result;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var parent=node.parentElement;
      if(!parent||parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      var text=String(node.nodeValue||'').replace(/\s+/g,' ').trim();
      if(!text) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    while(walker.nextNode()) result.push(walker.currentNode);
    return result;
  }

  function describeElement(el){
    if(!el) return '';
    var value=el.tagName?el.tagName.toLowerCase():'node';
    if(el.id) value+='#'+el.id;
    if(el.classList&&el.classList.length) value+='.'+Array.prototype.slice.call(el.classList,0,3).join('.');
    return value;
  }

  function audit(options){
    options=options||{};
    var dictionaries=window.PETATOE_I18N_DICTIONARIES||{};
    var ar=dictionaries.ar||{};
    var en=dictionaries.en||{};
    var flatAr=flatten(ar);
    var flatEn=flatten(en);
    var issues=[];

    Object.keys(flatAr).forEach(function(key){
      /* Runtime-template source strings intentionally exist only in the Arabic source dictionary. */
      if(/\.source$/.test(key)&&key.indexOf('runtimeTemplates.')===0) return;
      if(!Object.prototype.hasOwnProperty.call(flatEn,key)) issues.push({type:'missing-english-key',key:key});
    });
    Object.keys(flatEn).forEach(function(key){
      if(!Object.prototype.hasOwnProperty.call(flatAr,key)) issues.push({type:'missing-arabic-key',key:key});
      if(ARABIC_RE.test(String(flatEn[key]||''))) issues.push({type:'arabic-text-in-english-dictionary',key:key,value:flatEn[key]});
    });

    document.querySelectorAll('[data-i18n],[data-i18n-title],[data-i18n-placeholder]').forEach(function(el){
      ['data-i18n','data-i18n-title','data-i18n-placeholder'].forEach(function(attr){
        if(!el.hasAttribute(attr)) return;
        var key=el.getAttribute(attr);
        if(typeof getPath(ar,key)!=='string') issues.push({type:'missing-arabic-dom-key',key:key,element:describeElement(el)});
        if(typeof getPath(en,key)!=='string') issues.push({type:'missing-english-dom-key',key:key,element:describeElement(el)});
      });
    });

    var duplicateIds={};
    document.querySelectorAll('[id]').forEach(function(el){
      duplicateIds[el.id]=(duplicateIds[el.id]||0)+1;
    });
    Object.keys(duplicateIds).forEach(function(id){
      if(duplicateIds[id]>1) issues.push({type:'duplicate-dom-id',id:id,count:duplicateIds[id]});
    });

    var language=(window.PETATOEI18N&&window.PETATOEI18N.getLanguage?window.PETATOEI18N.getLanguage():document.documentElement.lang)||'ar';
    if(language==='en'){
      visibleTextNodes(document.body).forEach(function(node){
        var text=String(node.nodeValue||'').replace(/\s+/g,' ').trim();
        if(ARABIC_RE.test(text)) issues.push({type:'arabic-visible-in-english-mode',text:text.slice(0,180),element:describeElement(node.parentElement)});
      });
      document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function(el){
        if(el.closest(SKIP_SELECTOR)) return;
        ['placeholder','title','aria-label'].forEach(function(attr){
          var value=el.getAttribute(attr);
          if(value&&ARABIC_RE.test(value)) issues.push({type:'arabic-attribute-in-english-mode',attribute:attr,value:value.slice(0,180),element:describeElement(el)});
        });
      });
    }

    var counts={};
    issues.forEach(function(item){counts[item.type]=(counts[item.type]||0)+1;});
    var report={
      timestamp:new Date().toISOString(),
      language:language,
      dictionaryKeys:{arabic:Object.keys(flatAr).length,english:Object.keys(flatEn).length},
      passed:issues.length===0,
      issueCount:issues.length,
      counts:counts,
      issues:issues
    };

    if(options.log!==false&&window.console){
      var method=report.passed?'info':'warn';
      console[method]('[PETATOE i18n Audit]',report);
      if(!report.passed&&console.table) console.table(issues);
    }
    window.__PETATOE_I18N_LAST_AUDIT__=report;
    document.dispatchEvent(new CustomEvent('petatoe:i18n-audit-complete',{detail:report}));
    return report;
  }

  window.PETATOEI18NAudit={run:audit,containsArabic:function(value){return ARABIC_RE.test(String(value||''));}};
  window.petatoeI18nAudit=function(options){return audit(options);};

  try{
    var params=new URLSearchParams(location.search);
    if(params.get('i18nAudit')==='1'){
      var schedule=window.requestIdleCallback||function(fn){return setTimeout(fn,800);};
      schedule(function(){audit({log:true});});
    }
  }catch(_){}
})();
