/* PETATOE v9.4.19 — Smart Reports Atomic Language Runtime
   Translates only the visible Smart Reports surface without rebuilding data,
   clearing calculation caches, or invoking a second report renderer. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_ATOMIC_LANGUAGE__) return;
  window.__PETATOE_SMART_ATOMIC_LANGUAGE__=true;

  var textSources=new WeakMap();
  var attrSources=new WeakMap();
  var chartSources=new WeakMap();
  var revision=0;

  function language(){
    try{
      var center=window.PETATOE_LOCALIZATION_CENTER;
      if(center&&typeof center.getLanguage==='function')return String(center.getLanguage()||document.documentElement.lang||'ar').toLowerCase();
      var api=translator();
      if(api&&typeof api.getLanguage==='function')return String(api.getLanguage()||document.documentElement.lang||'ar').toLowerCase();
      return String(document.documentElement.lang||'ar').toLowerCase();
    }catch(_){return 'ar';}
  }
  function translator(){return window.PETATOE_GLOBAL_SCREEN_TRANSLATOR;}
  function translate(value){
    var api=translator();
    if(!api||typeof api.translate!=='function')return String(value==null?'':value);
    try{return api.translate(String(value==null?'':value));}catch(_){return String(value==null?'':value);}
  }
  function visibleRoot(){
    var area=document.getElementById('smartReportsArea');
    if(!area)return null;
    return area.querySelector('.smart-tab-section.active[data-smart-section]')||area;
  }
  function translateTextNodes(root,lang){
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      if(!node.parentElement||node.parentElement.closest('script,style,noscript,code,pre,[data-i18n-skip="true"],[data-i18n-ignore]'))return NodeFilter.FILTER_REJECT;
      return String(node.nodeValue||'').trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    var nodes=[],node; while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(function(n){
      if(!textSources.has(n))textSources.set(n,n.nodeValue);
      var source=textSources.get(n);
      var next=lang==='ar'?source:translate(source);
      if(next!==n.nodeValue)n.nodeValue=next;
    });
  }
  function translateAttributes(root,lang){
    root.querySelectorAll('[placeholder],[title],[aria-label],[data-placeholder]').forEach(function(el){
      var saved=attrSources.get(el)||{};
      ['placeholder','title','aria-label','data-placeholder'].forEach(function(attr){
        if(!el.hasAttribute(attr))return;
        if(!Object.prototype.hasOwnProperty.call(saved,attr))saved[attr]=el.getAttribute(attr);
        var source=saved[attr];
        var next=lang==='ar'?source:translate(source);
        if(next!==el.getAttribute(attr))el.setAttribute(attr,next);
      });
      attrSources.set(el,saved);
    });
  }
  function translateChartValue(value,lang){
    if(Array.isArray(value))return value.map(function(v){return translateChartValue(v,lang);});
    if(typeof value!=='string')return value;
    return lang==='ar'?value:translate(value);
  }
  function translateCharts(root,lang){
    Object.keys(window.charts||{}).forEach(function(key){
      var chart=window.charts[key];
      var canvas=chart&&chart.canvas;
      if(!chart||!canvas||!root.contains(canvas))return;
      var source=chartSources.get(chart);
      if(!source){
        source={labels:Array.isArray(chart.data&&chart.data.labels)?chart.data.labels.slice():null,datasets:(chart.data&&chart.data.datasets||[]).map(function(ds){return {label:ds.label};})};
        chartSources.set(chart,source);
      }
      if(source.labels&&chart.data)chart.data.labels=source.labels.map(function(v){return translateChartValue(v,lang);});
      (chart.data&&chart.data.datasets||[]).forEach(function(ds,i){if(source.datasets[i])ds.label=translateChartValue(source.datasets[i].label,lang);});
      try{chart.update('none');}catch(_){ }
    });
  }
  function apply(reason){
    var token=++revision;
    var run=function(){
      if(token!==revision)return;
      var root=visibleRoot(); if(!root)return;
      var lang=language();
      translateTextNodes(root,lang);
      translateAttributes(root,lang);
      translateCharts(root,lang);
      try{root.setAttribute('data-smart-language-stable',lang);}catch(_){ }
    };
    if(window.requestAnimationFrame)requestAnimationFrame(run);else setTimeout(run,0);
  }

  window.PETATOE_SMART_LANGUAGE_RUNTIME={apply:apply,version:'9.4.19-atomic-ci-certified'};
  window.addEventListener('petatoe:language-changed',function(){apply('language-changed');});
  window.addEventListener('petatoe:smart-tab-rendered',function(){apply('tab-rendered');});
  document.addEventListener('DOMContentLoaded',function(){apply('dom-ready');});
})();
