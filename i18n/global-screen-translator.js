/* PETATOE v10.0.25 — E5.2.20.1 passive compatibility adapter.
 * source: canonical-adapter-only. DOM ownership belongs exclusively to i18n/index.js.
 * Smart Reports exclusion marker retained for compatibility: #smartReportsArea
 */
(function(){
  'use strict';
  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  function language(){try{return window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage?window.PETATOE_I18N.getLanguage():(document.documentElement.lang||'ar');}catch(_){return 'ar';}}
  function translate(value){
    if(value==null||language()!=='en')return value;
    var center=window.PETATOE_LOCALIZATION_CENTER;
    if(center&&typeof center.translateRuntime==='function')return center.translateRuntime(value,'en');
    var runtime=window.PETATOE_LOCALIZATION_RUNTIME;
    if(runtime&&typeof runtime.translateRuntime==='function')return runtime.translateRuntime(value,'en');
    return value;
  }
  function monthName(value){
    if(language()!=='en')return value;
    var center=window.PETATOE_LOCALIZATION_CENTER;
    if(center&&typeof center.monthName==='function')return center.monthName(value,'en');
    return translate(value);
  }
  function apply(){var runtime=window.PETATOE_LOCALIZATION_RUNTIME;if(runtime&&typeof runtime.reapply==='function')runtime.reapply();}
  function residuals(){
    if(language()!=='en'||!document.body)return [];
    var rows=[];document.querySelectorAll('body *').forEach(function(el){if(rows.length>=50)return;if(el.children.length)return;var text=String(el.textContent||'').trim();if(text&&ARABIC_RE.test(text))rows.push({tag:el.tagName,text:text.slice(0,180)});});return rows;
  }
  window.PETATOE_GLOBAL_SCREEN_TRANSLATOR={source:'canonical-adapter-only',translate:translate,monthName:monthName,scan:apply,rebuild:apply,hydrate:apply,remainingArabic:residuals,stats:function(){return{mode:'canonical-adapter-only',domOwner:'PETATOE_LOCALIZATION_RUNTIME'};},assertEnglishClean:function(){var rows=residuals();return{passed:rows.length===0,count:rows.length,items:rows};}};
})();
