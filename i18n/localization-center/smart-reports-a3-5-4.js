/* PETATOE v9.4.23 — Phase A3.5.4 Smart Reports recommendation/export chrome catalog. */
(function(){
  'use strict';
  var ar={smartReportsSource:{recommendationChrome:{
    ceoTitle:'PETATOE CEO Briefing',
    ceoDescription:'ملخص تنفيذي سريع مبني على بيانات العملاء والخدمات والإيرادات والتوقعات، بدون تغيير أي حسابات في التقارير القديمة.',
    aiDecisionSupport:'دعم القرار بالذكاء التحليلي',
    topDecisionToday:'أهم قرار اليوم',
    biggestGrowthOpportunity:'أكبر فرصة نمو',
    biggestFollowupPoint:'أكبر نقطة متابعة',
    expectedImpact:'الأثر المتوقع',
    confidenceScore:'درجة الثقة',
    showReason:'عرض السبب',
    openReport:'فتح التقرير',
    quickExecutionPlan:'خطة التنفيذ السريعة:',
    excel:'Excel',
    pdf:'PDF'
  }}};
  var en={smartReportsSource:{recommendationChrome:{
    ceoTitle:'PETATOE CEO Briefing',
    ceoDescription:'A concise executive summary based on customer, service, revenue, and forecast data without changing any existing report calculations.',
    aiDecisionSupport:'AI Decision Support',
    topDecisionToday:'Top Decision Today',
    biggestGrowthOpportunity:'Biggest Growth Opportunity',
    biggestFollowupPoint:'Main Follow-up Point',
    expectedImpact:'Expected Impact',
    confidenceScore:'Confidence Score',
    showReason:'Show Rationale',
    openReport:'Open Report',
    quickExecutionPlan:'Quick Execution Plan:',
    excel:'Excel',
    pdf:'PDF'
  }}};
  function merge(target,source){Object.keys(source||{}).forEach(function(k){var v=source[k];if(v&&typeof v==='object'&&!Array.isArray(v)){target[k]=target[k]&&typeof target[k]==='object'?target[k]:{};merge(target[k],v);}else target[k]=v;});return target;}
  function install(){var store=window.PETATOE_LOCALIZATION_CENTER_STORE;if(store&&store.dictionaries){merge(store.dictionaries.ar||{},ar);merge(store.dictionaries.en||{},en);return true;}var dictionaries=window.PETATOE_I18N_DICTIONARIES=window.PETATOE_I18N_DICTIONARIES||{};dictionaries.ar=merge(dictionaries.ar||{},ar);dictionaries.en=merge(dictionaries.en||{},en);return false;}
  if(!install())window.addEventListener('petatoe:localization-center-store-ready',install,{once:true});
})();
