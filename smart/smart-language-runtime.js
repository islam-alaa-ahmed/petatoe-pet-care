/* PETATOE E5.2.20 — Smart Reports canonical localization adapter.
 * i18n/index.js is the only DOM text/attribute translator.
 * This adapter only preserves chart source labels and delegates visible DOM to the canonical localization runtime.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_DYNAMIC_LOCALIZATION__)return;
  window.__PETATOE_SMART_DYNAMIC_LOCALIZATION__=true;
  var chartSources=new WeakMap(),revision=0,chartFrame=0;
  function language(){try{return window.PETATOE_LOCALIZATION_RUNTIME&&window.PETATOE_LOCALIZATION_RUNTIME.getLanguage?String(window.PETATOE_LOCALIZATION_RUNTIME.getLanguage()||'ar').toLowerCase():String(document.documentElement.lang||'ar').toLowerCase();}catch(_){return 'ar';}}
  function canonicalTranslate(source,lang){if(lang!=='en')return source;try{return window.PETATOE_LOCALIZATION_RUNTIME&&window.PETATOE_LOCALIZATION_RUNTIME.translateRuntime?window.PETATOE_LOCALIZATION_RUNTIME.translateRuntime(source,'en'):source;}catch(_){return source;}}
  function smartArea(){return document.getElementById('smartReportsArea');}
  function visibleRoot(){var area=smartArea();return area&&(area.querySelector('.smart-tab-section.active[data-smart-section]')||area);}
  function captureChartSource(chart){var source=chartSources.get(chart);if(source)return source;source={labels:Array.isArray(chart.data&&chart.data.labels)?chart.data.labels.slice():null,datasets:(chart.data&&chart.data.datasets||[]).map(function(ds){return{label:ds.label};})};chartSources.set(chart,source);return source;}
  function chartValue(value,lang){if(Array.isArray(value))return value.map(function(v){return chartValue(v,lang);});if(typeof value!=='string')return value;return lang==='ar'?value:canonicalTranslate(value,'en');}
  function translateCharts(root,lang,token){if(token!==revision||!root)return;Object.keys(window.charts||{}).forEach(function(key){var chart=window.charts[key],canvas=chart&&chart.canvas;if(!chart||!canvas||!root.contains(canvas))return;var source=captureChartSource(chart);if(source.labels&&chart.data)chart.data.labels=source.labels.map(function(v){return chartValue(v,lang);});(chart.data&&chart.data.datasets||[]).forEach(function(ds,i){if(source.datasets[i])ds.label=chartValue(source.datasets[i].label,lang);});try{chart.update('none');}catch(_){}});}
  function scheduleCharts(root,lang,token){if(chartFrame&&window.cancelAnimationFrame)window.cancelAnimationFrame(chartFrame);var run=function(){chartFrame=0;translateCharts(root,lang,token);};chartFrame=window.requestAnimationFrame?window.requestAnimationFrame(run):setTimeout(run,0);}
  function apply(reason){var token=++revision,root=visibleRoot();if(!root)return false;var lang=language();try{if(window.PETATOE_LOCALIZATION_RUNTIME&&typeof window.PETATOE_LOCALIZATION_RUNTIME.applySubtree==='function')window.PETATOE_LOCALIZATION_RUNTIME.applySubtree(root);}catch(_){ }scheduleCharts(root,lang,token);return true;}
  window.PETATOE_SMART_LANGUAGE_RUNTIME={apply:apply,getLanguage:language,translate:function(v){return canonicalTranslate(v,language());},version:'9.4.23-smart-reports-canonical-dom-adapter',domOwner:'PETATOE_LOCALIZATION_RUNTIME',chartOwner:'PETATOE_SMART_LANGUAGE_RUNTIME'};
  window.addEventListener('petatoe:language-changed',function(){apply('language-changed');});
  window.addEventListener('petatoe:smart-tab-rendered',function(){apply('tab-rendered');});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){apply('dom-ready');},{once:true});else setTimeout(function(){apply('dom-ready');},0);
})();
