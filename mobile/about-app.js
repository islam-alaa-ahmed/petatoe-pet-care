/* PETATOE v10.0.6 — Mobile About & Update Center */
(function(){
  'use strict';
  if(window.__PETATOE_ABOUT_APP_BOOTED__) return;
  window.__PETATOE_ABOUT_APP_BOOTED__=true;

  var BUILD_NUMBER='10006';
  var RELEASE_DATE='2026-07-24';
  var lastCheckAt=null;
  var currentStatus='idle';
  var statusDetail='';

  function isMobile(){return !!(window.matchMedia&&window.matchMedia('(max-width: 900px)').matches)}
  function center(){return window.PETATOE_LOCALIZATION_CENTER||null}
  function t(key,fallback){try{var c=center();return c&&typeof c.t==='function'?c.t('aboutApp.'+key,{}, {fallback:fallback,allowKeyFallback:true}):fallback}catch(_){return fallback}}
  function esc(value){return String(value==null?'':value).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]})}
  function version(){return String(window.PETATOE_RELEASE_VERSION||'v10.0.6')}
  function releaseName(){return String(window.PETATOE_RELEASE_NAME||'PETATOE_V10_0_6_MOBILE_ABOUT_UPDATE_CENTER')}
  function formatDate(value){
    if(!value)return t('never','لم يتم الفحص بعد');
    try{return new Intl.DateTimeFormat(document.documentElement.lang&&document.documentElement.lang.indexOf('en')===0?'en-US':'ar-EG',{dateStyle:'medium',timeStyle:'short',calendar:'gregory'}).format(value)}catch(_){return value.toLocaleString()}
  }
  function statusCopy(){
    if(currentStatus==='checking')return {badge:t('checking','جارٍ الفحص'),title:t('checkingTitle','جارٍ التحقق من الإصدار'),message:t('checkingMessage','يتم الآن الاتصال بخدمة التحديث والتحقق من أحدث نسخة منشورة.'),tone:'checking'};
    if(currentStatus==='available')return {badge:t('updateAvailable','تحديث متاح'),title:t('newVersionTitle','يوجد إصدار أحدث'),message:t('newVersionMessage','يمكنك تثبيت أحدث نسخة منشورة الآن دون فقد الجلسة أو إعدادات التطبيق.'),tone:'available'};
    if(currentStatus==='updating')return {badge:t('updating','جارٍ التحديث'),title:t('updatingTitle','يتم تثبيت التحديث'),message:t('updatingMessage','سيُعاد فتح التطبيق تلقائيًا عند اكتمال تثبيت النسخة الجديدة.'),tone:'checking'};
    if(currentStatus==='error')return {badge:t('checkFailed','تعذر الفحص'),title:t('checkFailedTitle','لم يكتمل فحص التحديث'),message:statusDetail||t('checkFailedMessage','تحقق من اتصال الإنترنت ثم أعد المحاولة.'),tone:'error'};
    return {badge:t('updated','محدّث'),title:t('latestVersion','لديك أحدث إصدار'),message:t('latestVersionMessage','نسخة البرنامج الحالية هي أحدث نسخة منشورة.'),tone:'updated'};
  }
  function renderInto(mount){
    if(!mount||!isMobile())return;
    var copy=statusCopy();
    mount.innerHTML='<section class="pet-about" aria-labelledby="petAboutTitle">'+
      '<header class="pet-about__header"><div><h2 id="petAboutTitle">'+esc(t('title','حول التطبيق'))+'</h2><p>'+esc(t('subtitle','معلومات إصدار PETATOE وحالة التحديثات.'))+'</p></div><button type="button" class="pet-about__check" data-pet-about-action="check" '+(currentStatus==='checking'||currentStatus==='updating'?'disabled':'')+'>'+esc(t('checkUpdates','التحقق من وجود تحديثات'))+'</button></header>'+
      '<article class="pet-about__identity"><img src="assets/icons/apple-touch-icon.png" alt="PETATOE"><div><strong>PETATOE</strong><span>'+esc(t('edition','Enterprise Edition'))+'</span><b>'+esc(t('production','Production'))+'</b></div></article>'+
      '<article class="pet-about__details">'+
        '<div><span>'+esc(t('currentVersion','الإصدار الحالي'))+'</span><strong>'+esc(version())+'</strong></div>'+
        '<div><span>'+esc(t('buildNumber','رقم البناء'))+'</span><strong>'+esc(BUILD_NUMBER)+'</strong></div>'+
        '<div><span>'+esc(t('releaseDate','تاريخ الإصدار'))+'</span><strong>'+esc(RELEASE_DATE)+'</strong></div>'+
        '<div><span>'+esc(t('lastCheck','آخر فحص للتحديثات'))+'</span><strong>'+esc(formatDate(lastCheckAt))+'</strong></div>'+
      '</article>'+
      '<article class="pet-about__status pet-about__status--'+esc(copy.tone)+'"><div class="pet-about__status-head"><span>'+esc(copy.badge)+'</span><strong>'+esc(copy.title)+'</strong></div><p>'+esc(copy.message)+'</p>'+
        (currentStatus==='available'?'<button type="button" class="pet-about__update" data-pet-about-action="update">'+esc(t('updateNow','تحديث الآن'))+'</button>':'')+
      '</article>'+
      '<small class="pet-about__release">'+esc(releaseName())+'</small>'+
    '</section>';
  }
  function activeMount(){return document.getElementById('petatoeAboutAppMount')}
  function rerender(){var mount=activeMount();if(mount)renderInto(mount)}
  async function check(){
    currentStatus='checking';statusDetail='';rerender();
    try{
      var api=window.PETATOEPWAUpdate;
      if(!api||typeof api.check!=='function')throw new Error(t('updateUnavailable','خدمة التحديث غير متاحة في هذا المتصفح.'));
      var result=await api.check(true);
      lastCheckAt=new Date();
      currentStatus=result&&result.updateAvailable?'available':'updated';
    }catch(error){lastCheckAt=new Date();currentStatus='error';statusDetail=(error&&error.message)||t('checkFailedMessage','تحقق من اتصال الإنترنت ثم أعد المحاولة.');}
    rerender();
  }
  function update(){
    var api=window.PETATOEPWAUpdate;
    if(!api||typeof api.apply!=='function'){currentStatus='error';statusDetail=t('updateUnavailable','خدمة التحديث غير متاحة في هذا المتصفح.');rerender();return;}
    currentStatus='updating';rerender();api.apply();
  }
  document.addEventListener('click',function(event){var button=event.target&&event.target.closest&&event.target.closest('[data-pet-about-action]');if(!button)return;var action=button.getAttribute('data-pet-about-action');if(action==='check')check();if(action==='update')update();});
  window.addEventListener('petatoe:pwa-update-status',function(event){var detail=event.detail||{};if(detail.status==='available')currentStatus='available';else if(detail.status==='updating')currentStatus='updating';else if(detail.status==='updated')currentStatus='updated';else if(detail.status==='error'){currentStatus='error';statusDetail=detail.message||'';}if(detail.checkedAt)lastCheckAt=new Date(detail.checkedAt);rerender();});
  window.addEventListener('petatoe:language-changed',rerender);
  window.PETATOEAboutApp={renderInto:renderInto,checkForUpdates:check,version:version,buildNumber:BUILD_NUMBER,releaseDate:RELEASE_DATE};
})();
