/* PETATOE v9.4.23 — Phase A3.5.2 Smart Reports forecasting/recommendations source catalog. */
(function(){
  'use strict';
  var ar={smartReports:{
    ai:{predictiveEngineBadge:'محرك تنبؤ تحليلي',actualSeries:'الفعلي',forecastSeries:'المتوقع'},
    customers:{analysisTabsAria:'تبويبات تحليل العملاء'}
  },smartReportsSource:{interactions:{pinIcon:'📌',backIcon:'↩️'}}};
  var en={smartReports:{
    ai:{predictiveEngineBadge:'AI-like Predictive Engine',actualSeries:'Actual',forecastSeries:'Forecast'},
    customers:{analysisTabsAria:'Customer analysis tabs'}
  },smartReportsSource:{interactions:{pinIcon:'📌',backIcon:'↩️'}}};
  function merge(target,source){Object.keys(source||{}).forEach(function(k){var v=source[k];if(v&&typeof v==='object'&&!Array.isArray(v)){target[k]=target[k]&&typeof target[k]==='object'?target[k]:{};merge(target[k],v);}else target[k]=v;});return target;}
  function install(){var store=window.PETATOE_LOCALIZATION_CENTER_STORE;if(store&&store.dictionaries){merge(store.dictionaries.ar||{},ar);merge(store.dictionaries.en||{},en);return true;}var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};dictionaries.ar=merge(dictionaries.ar||{},ar);dictionaries.en=merge(dictionaries.en||{},en);return false;}
  if(!install())window.addEventListener('petatoe:localization-center-store-ready',install,{once:true});
})();
