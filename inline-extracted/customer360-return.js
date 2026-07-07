/* === PETATOE v2.9 - Customer 360 Back Navigation Safe Patch === */
(function(){
  function block_4352_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function activePanelId(){var p=document.querySelector('.panel.active');return p?p.id:''}
  function activeSmartTab(){var b=document.querySelector('#smartTabs .smart-pill.active');var s=document.querySelector('.smart-tab-section.active[data-smart-section]');return (b&&b.dataset.smartTab)||(s&&s.dataset.smartSection)||''}
  function activeSmartText(){var b=document.querySelector('#smartTabs .smart-pill.active');return b?b.textContent.trim():''}
  function clearNode(el){while(el&&el.firstChild){el.removeChild(el.firstChild)}}
  function makeSpan(id,text){var s=document.createElement('span'); if(id)s.id=id; if(text!=null)s.textContent=String(text); return s}
  function panelTitle(id){
    if(id==='smart'){var t=activeSmartText();return t?'التقارير الذكية / '+t:'التقارير الذكية'}
    if(id==='executive')return 'Executive Dashboard';
    if(id==='dashboard')return 'الرئيسية';
    if(id==='records')return 'السجلات';
    if(id==='sales')return 'Sales Analytics';
    if(id==='vans')return 'Vans Performance';
    if(id==='services')return 'Services Analysis';
    return id||'التقرير السابق';
  }
  function captureContext(){
    var id=activePanelId();
    if(!id || id==='customer360')return null;
    return {panel:id, smart:activeSmartTab(), label:panelTitle(id), y:window.scrollY||0, t:Date.now()};
  }
  const RETURN_SESSION_KEY='petatoe_ui_customer360_return';
  function sessionStore(){try{return window.sessionStorage||null}catch(_e){return null}}
  function setContext(ctx){
    if(!ctx)return;
    window.__petCustomer360Return=ctx;
    try{var ss=sessionStore(); if(ss)ss.setItem(RETURN_SESSION_KEY, JSON.stringify(ctx));}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/customer360-return.js",e);}
  }
  function getContext(){
    if(window.__petCustomer360Return)return window.__petCustomer360Return;
    try{var ss=sessionStore(); var raw=ss?ss.getItem(RETURN_SESSION_KEY):''; return raw?JSON.parse(raw):null}catch(e){return null}
  }
  function clearContext(){
    window.__petCustomer360Return=null;
    try{var ss=sessionStore(); if(ss)ss.removeItem(RETURN_SESSION_KEY);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/customer360-return.js",e);}
  }
  function ensureBackControls(){
    var sec=document.getElementById('customer360'); if(!sec)return;
    var actions=sec.querySelector('.section-head > div:last-child');
    if(actions && !document.getElementById('cust360BackBtn')){
      var btn=document.createElement('button');
      btn.id='cust360BackBtn';
      btn.className='cust360-back-btn';
      btn.type='button';
      btn.setAttribute('data-cust360-back','1');
      actions.insertBefore(btn,actions.firstChild);
    }
    var card=sec.querySelector('.card');
    if(card && !document.getElementById('cust360ReturnNote')){
      var note=document.createElement('div');
      note.id='cust360ReturnNote';
      note.className='cust360-return-note';
      clearNode(note);
      note.appendChild(makeSpan('cust360ReturnText'));
      var noteBtn=document.createElement('button');
      noteBtn.className='cust360-back-btn show';
      noteBtn.type='button';
      noteBtn.setAttribute('data-cust360-back','1');
      noteBtn.textContent='↩ رجوع للتقرير';
      note.appendChild(noteBtn);
      card.insertBefore(note,card.firstChild);
    }
    refreshBackControls();
  }
  var backControlsTimer=0;
  function scheduleBackControls(delay,ensure){
    if(backControlsTimer)clearTimeout(backControlsTimer);
    backControlsTimer=setTimeout(function(){
      backControlsTimer=0;
      if(ensure)ensureBackControls();else refreshBackControls();
    },delay||0);
  }
  function refreshBackControls(){
    var ctx=getContext();
    var visible=!!(ctx&&activePanelId()==='customer360');
    var btn=document.getElementById('cust360BackBtn');
    var note=document.getElementById('cust360ReturnNote');
    var txt=document.getElementById('cust360ReturnText');
    if(btn){btn.classList.toggle('show',visible);btn.textContent=visible?'↩ رجوع إلى '+String(ctx.label||'التقرير السابق'):'↩ رجوع';}
    if(note){note.classList.toggle('show',visible)}
    if(txt&&visible){clearNode(txt);txt.appendChild(document.createTextNode('أنت فتحت Customer 360 من '));var b=document.createElement('b');b.textContent=String(ctx.label||'التقرير السابق');txt.appendChild(b);txt.appendChild(document.createTextNode(' — تقدر ترجع لنفس المكان بنفس التبويب.'));}
  }

  if(!document.__petatoeCust360BackDelegationBound){
    document.__petatoeCust360BackDelegationBound=true;
    document.addEventListener('click',function(e){
      var b=e.target&&e.target.closest&&e.target.closest('[data-cust360-back="1"]');
      if(!b)return;
      e.preventDefault();
      window.petBackFromCustomer360();
    });
  }
  window.petBackFromCustomer360=function(){
    var ctx=getContext();
    if(!ctx){ if(window.PETATOERouter)PETATOERouter.openTab('smart','business'); return; }
    if(ctx.panel==='smart'){
      if(window.PETATOERouter)PETATOERouter.openTab('smart');
      setTimeout(function(){try{if(ctx.smart && typeof setSmartTab==='function')setSmartTab(ctx.smart)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/customer360-return.js",e);}},160);
    }else{
      if(window.PETATOERouter)PETATOERouter.openTab(ctx.panel);
    }
    setTimeout(function(){try{window.scrollTo({top:ctx.y||0,behavior:'smooth'})}catch(e){window.scrollTo(0,ctx.y||0)}},260);
    clearContext();
  };
  window.openPetClient360=function(name){
    var ctx=captureContext();
    if(ctx)setContext(ctx);
    try{if(typeof closePetDrillModal==='function')closePetDrillModal()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/customer360-return.js",e);}
    if(typeof window.PETATOEOpenPetClient360Core==='function'){
      window.PETATOEOpenPetClient360Core(name);
    }else{
      if(window.PETATOERouter)PETATOERouter.openTab('customer360');
      setTimeout(function(){
        var s=document.getElementById('customer360Search');
        if(s)s.value=name||'';
        if(typeof renderCustomer360Panel==='function')renderCustomer360Panel(name||'');
        if(typeof showCustomer360==='function')showCustomer360(name||'');
      },50);
    }
    scheduleBackControls(120,true);
  };
  document.addEventListener('petatoe:tabchange',function(e){var name=e.detail&&e.detail.tabId;scheduleBackControls(80,name==='customer360')});
  document.addEventListener('DOMContentLoaded',ensureBackControls);
  scheduleBackControls(900,true);
})();