/* PETATOE v9.4.20 — Smart Reports Translation Stability Runtime
   Applies the selected language synchronously to the visible Smart Reports tab,
   while deferring chart repaint only. It never rebuilds report data, clears
   calculation caches, or invokes a report renderer. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_TRANSLATION_STABILITY__) return;
  window.__PETATOE_SMART_TRANSLATION_STABILITY__=true;

  var textSources=new WeakMap();
  var attrSources=new WeakMap();
  var chartSources=new WeakMap();
  var revision=0;
  var chartFrame=0;

  function language(){
    try{
      var center=window.PETATOE_LOCALIZATION_CENTER;
      if(center&&typeof center.getLanguage==='function')return String(center.getLanguage()||document.documentElement.lang||'ar').toLowerCase();
      var api=translator();
      if(api&&typeof api.getLanguage==='function')return String(api.getLanguage()||document.documentElement.lang||'ar').toLowerCase();
      return String(document.documentElement.lang||'ar').toLowerCase();
    }catch(_){return 'ar';}
  }
  function translator(){return window.PETATOE_GLOBAL_SCREEN_TRANSLATOR||null;}
  function translate(value){
    var source=String(value==null?'':value);
    var api=translator();
    if(!api||typeof api.translate!=='function')return source;
    try{return api.translate(source);}catch(_){return source;}
  }
  function visibleRoot(){
    var area=document.getElementById('smartReportsArea');
    if(!area)return null;
    return area.querySelector('.smart-tab-section.active[data-smart-section]')||area;
  }
  function sourceText(node,lang){
    var saved=textSources.get(node);
    if(!saved){saved={ar:null,en:null};textSources.set(node,saved);}
    var current=String(node.nodeValue||'');
    if(lang==='ar')saved.ar=current;
    else if(saved.ar==null && /[\u0600-\u06FF]/.test(current))saved.ar=current;
    if(saved.ar==null)saved.ar=current;
    return saved.ar;
  }
  function translateTextNodes(root,lang){
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      if(!node.parentElement||node.parentElement.closest('script,style,noscript,code,pre,[data-i18n-skip="true"],[data-i18n-ignore]'))return NodeFilter.FILTER_REJECT;
      return String(node.nodeValue||'').trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    var node;
    while((node=walker.nextNode())){
      var source=sourceText(node,lang);
      var next=lang==='ar'?source:translate(source);
      if(next!==node.nodeValue)node.nodeValue=next;
    }
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
  function captureChartSource(chart){
    var source=chartSources.get(chart);
    if(source)return source;
    source={labels:Array.isArray(chart.data&&chart.data.labels)?chart.data.labels.slice():null,datasets:(chart.data&&chart.data.datasets||[]).map(function(ds){return {label:ds.label};})};
    chartSources.set(chart,source);
    return source;
  }
  function translateCharts(root,lang,token){
    if(token!==revision)return;
    Object.keys(window.charts||{}).forEach(function(key){
      var chart=window.charts[key];
      var canvas=chart&&chart.canvas;
      if(!chart||!canvas||!root.contains(canvas))return;
      var source=captureChartSource(chart);
      if(source.labels&&chart.data)chart.data.labels=source.labels.map(function(v){return translateChartValue(v,lang);});
      (chart.data&&chart.data.datasets||[]).forEach(function(ds,i){if(source.datasets[i])ds.label=translateChartValue(source.datasets[i].label,lang);});
      try{chart.update('none');}catch(_){ }
    });
  }
  function scheduleCharts(root,lang,token){
    if(chartFrame&&window.cancelAnimationFrame)window.cancelAnimationFrame(chartFrame);
    var run=function(){chartFrame=0;translateCharts(root,lang,token);};
    chartFrame=window.requestAnimationFrame?window.requestAnimationFrame(run):setTimeout(run,0);
  }
  function apply(reason){
    var token=++revision;
    var root=visibleRoot();
    if(!root)return false;
    var lang=language();
    root.setAttribute('data-smart-language-applying',lang);
    /* Text and attributes are updated in the same event turn, before the browser
       paints the newly rendered tab. This removes Arabic→English flashing. */
    translateTextNodes(root,lang);
    translateAttributes(root,lang);
    root.setAttribute('data-smart-language-stable',lang);
    root.removeAttribute('data-smart-language-applying');
    scheduleCharts(root,lang,token);
    return true;
  }

  window.PETATOE_SMART_LANGUAGE_RUNTIME={apply:apply,getLanguage:language,version:'9.4.20-translation-stability'};
  window.addEventListener('petatoe:language-changed',function(){apply('language-changed');});
  window.addEventListener('petatoe:smart-tab-rendered',function(){apply('tab-rendered');});
  document.addEventListener('DOMContentLoaded',function(){apply('dom-ready');});
})();
