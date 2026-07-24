/** PETATOE Mobile Enterprise UI v10 — M1 App Shell */
(function(){
  'use strict';
  if (window.__PETATOE_MOBILE_V10_SHELL__) return;
  window.__PETATOE_MOBILE_V10_SHELL__ = true;

  var mq = window.matchMedia('(max-width: 760px)');
  var ICONS = {
    menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    chart:'<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>'
  };

  function t(key, fallback){
    var center=window.PETATOE_LOCALIZATION_CENTER;
    if(center&&typeof center.t==='function')return center.t('mobileV10.'+key,{}, {fallback:fallback||key});
    var store=window.PETATOE_LOCALIZATION_CENTER_STORE;
    var lang=(document.documentElement.lang||'ar').toLowerCase().indexOf('en')===0?'en':'ar';
    var value=store&&store.getPath?store.getPath(lang,'mobileV10.'+key):'';
    return value||fallback||key;
  }
  function el(tag, cls, html){ var n=document.createElement(tag); if(cls)n.className=cls; if(html!=null)n.innerHTML=html; return n; }
  function text(id, fallback){ var n=document.getElementById(id); return (n&&n.textContent||fallback||'').trim(); }
  function currentTab(){ var p=document.querySelector('.panel.active'); return p&&p.id || 'dashboard'; }
  function openTab(tab){
    if(!tab) return;
    if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab(tab);
    else { var source=document.querySelector('#nav [data-tab="'+CSS.escape(tab)+'"]'); if(source) source.click(); }
    closeDrawer(); syncActive(tab);
  }
  function openDrawer(){ if(!mq.matches)return; document.body.classList.add('pet-v10-drawer-open'); var d=document.querySelector('.pet-v10-drawer'); if(d)d.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ document.body.classList.remove('pet-v10-drawer-open'); var d=document.querySelector('.pet-v10-drawer'); if(d)d.setAttribute('aria-hidden','true'); }
  function screenLabel(tab){
    var source=document.querySelector('#nav [data-tab="'+CSS.escape(tab||'dashboard')+'"]');
    return cleanLabel(source&&source.textContent)||t(tab==='dashboard'?'home':'menu',tab||'PETATOE');
  }
  function syncActive(tab){
    document.querySelectorAll('.pet-v10-nav-btn[data-tab],.pet-v10-drawer-item[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
    var title=document.getElementById('petV10HeaderScreenTitle'); if(title)title.textContent=screenLabel(tab);
  }
  function iconFromLabel(label){ var m=(label||'').match(/[\p{Extended_Pictographic}\u2600-\u27BF]/u); return m?m[0]:'•'; }
  function cleanLabel(label){ return String(label||'').replace(/[\p{Extended_Pictographic}\u2600-\u27BF]/gu,'').replace(/\s+/g,' ').trim(); }

  function buildHeader(){
    var bar=document.querySelector('.topbar'); if(!bar||bar.querySelector('.pet-v10-header-brand'))return;
    var menu=el('button','pet-v10-header-menu',ICONS.menu); menu.type='button'; menu.setAttribute('aria-label',t('openMenu','Open menu')); menu.addEventListener('click',openDrawer);
    var brand=el('div','pet-v10-header-brand');
    var logo=el('img','pet-v10-header-logo'); logo.alt='PETATOE'; logo.src='assets/icons/apple-touch-icon.png';
    var copy=el('div','pet-v10-header-copy','<b>PETATOE</b><small id="petV10HeaderScreenTitle">'+t('home','Home')+'</small>');
    brand.append(logo,copy); brand.setAttribute('role','button'); brand.tabIndex=0; brand.addEventListener('click',function(){openTab('dashboard');});
    var actions=el('div','pet-v10-header-actions');
    var search=el('button','pet-v10-header-action',ICONS.search); search.type='button'; search.setAttribute('aria-label',t('search','Search')); search.addEventListener('click',function(){ if(typeof window.openGlobalSearch==='function')window.openGlobalSearch(); });
    var bell=el('button','pet-v10-header-action',ICONS.bell+'<span class="pet-v10-notification-badge" id="petV10NotificationBadge">0</span>'); bell.type='button'; bell.setAttribute('aria-label',t('notifications','Notifications')); bell.addEventListener('click',function(){ var n=document.getElementById('topbarNotifBtn'); if(n)n.click(); });
    actions.append(search,bell); bar.prepend(menu,brand,actions);
  }

  function buildBottomNav(){
    if(document.querySelector('.pet-v10-bottom-nav'))return;
    var nav=el('nav','pet-v10-bottom-nav'); nav.setAttribute('aria-label',t('mainNavigation','Main navigation'));
    [
      ['dashboard',t('home','Home'),ICONS.home],['appointments',t('appointments','Appointments'),ICONS.calendar],['smart',t('reports','Reports'),ICONS.chart],['settings',t('settings','Settings'),ICONS.settings]
    ].forEach(function(x){ var b=el('button','pet-v10-nav-btn',x[2]+'<span>'+x[1]+'</span>'); b.type='button'; b.dataset.tab=x[0]; b.addEventListener('click',function(){openTab(x[0]);}); nav.appendChild(b); });
    var more=el('button','pet-v10-nav-btn',ICONS.menu+'<span>'+t('menu','Menu')+'</span>'); more.type='button'; more.addEventListener('click',openDrawer); nav.appendChild(more);
    document.body.appendChild(nav); syncActive(currentTab());
  }

  function rebuildDrawerList(filter){
    var list=document.querySelector('.pet-v10-drawer-list'); var source=document.getElementById('nav'); if(!list||!source)return;
    list.textContent=''; var q=(filter||'').trim().toLowerCase(); var seen={};
    source.querySelectorAll('button[data-tab]').forEach(function(btn){
      var tab=btn.dataset.tab, label=cleanLabel(btn.textContent); if(!tab||!label||seen[tab])return; seen[tab]=1;
      var hidden=btn.hidden || btn.getAttribute('aria-hidden')==='true' || getComputedStyle(btn).display==='none'; if(hidden)return;
      if(q && label.toLowerCase().indexOf(q)<0)return;
      var item=el('button','pet-v10-drawer-item'); item.type='button'; item.dataset.tab=tab;
      item.innerHTML='<span class="pet-v10-menu-icon">'+iconFromLabel(btn.textContent)+'</span><span>'+label+'</span>';
      item.addEventListener('click',function(){openTab(tab);}); list.appendChild(item);
    });
    if(!list.children.length) list.appendChild(el('div','pet-v10-drawer-empty',t('noResults','No results found')));
    syncActive(currentTab());
  }

  function buildDrawer(){
    if(document.querySelector('.pet-v10-drawer'))return;
    var backdrop=el('div','pet-v10-drawer-backdrop'); backdrop.addEventListener('click',closeDrawer);
    var drawer=el('aside','pet-v10-drawer'); drawer.setAttribute('aria-hidden','true');
    var head=el('div','pet-v10-drawer-head');
    var user=el('div','pet-v10-drawer-user','<div class="pet-v10-drawer-avatar"><img src="assets/icons/apple-touch-icon.png" alt="PETATOE"></div><div class="pet-v10-drawer-user-copy"><b id="petV10DrawerName">'+text('topbarUserName','PETATOE')+'</b><small id="petV10DrawerRole">'+text('topbarUserRole','')+'</small></div>');
    var close=el('button','pet-v10-drawer-close','×'); close.type='button'; close.setAttribute('aria-label',t('close','Close')); close.addEventListener('click',closeDrawer); head.append(user,close);
    var searchWrap=el('div','pet-v10-drawer-search'); var input=el('input'); input.type='search'; input.placeholder=t('searchMenu','Search menu...'); input.addEventListener('input',function(){rebuildDrawerList(input.value);}); searchWrap.appendChild(input);
    var list=el('div','pet-v10-drawer-list'); drawer.append(head,searchWrap,list); document.body.append(backdrop,drawer); rebuildDrawerList('');
    var source=document.getElementById('nav'); if(source && window.MutationObserver){
      var rebuildQueued=false;
      new MutationObserver(function(){
        if(rebuildQueued)return;
        rebuildQueued=true;
        (window.requestAnimationFrame||window.setTimeout)(function(){rebuildQueued=false;rebuildDrawerList(input.value);});
      }).observe(source,{subtree:true,childList:true,attributes:true,attributeFilter:['style','hidden','class','aria-hidden']});
    }
  }

  function syncIdentity(){
    var name=text('topbarUserName','PETATOE'), role=text('topbarUserRole','');
    var drawerName=document.getElementById('petV10DrawerName'); if(drawerName)drawerName.textContent=name;
    var r=document.getElementById('petV10DrawerRole');if(r)r.textContent=role;
    var count=parseInt(text('topbarNotifCount','0'),10)||0;
    var badge=document.getElementById('petV10NotificationBadge');
    if(badge){badge.textContent=String(count>99?'99+':count);badge.classList.toggle('visible',count>0);}
  }
  function init(){ if(!mq.matches)return; document.body.classList.add('pet-v10-mobile-redesign-m1'); buildHeader();buildBottomNav();buildDrawer();syncIdentity();
    document.addEventListener('petatoe:tabchange',function(e){syncActive(e.detail&&e.detail.tabId||currentTab());});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrawer();});
    var u=document.getElementById('topbarUserBlock'); if(u&&window.MutationObserver){
      var identityQueued=false;
      new MutationObserver(function(){
        if(identityQueued)return;
        identityQueued=true;
        (window.requestAnimationFrame||window.setTimeout)(function(){identityQueued=false;syncIdentity();});
      }).observe(u,{subtree:true,childList:true,characterData:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  mq.addEventListener&&mq.addEventListener('change',function(e){if(e.matches)init();else {closeDrawer();document.body.classList.remove('pet-v10-mobile-redesign-m1');}});
  window.PETATOEMobileV10={openDrawer:openDrawer,closeDrawer:closeDrawer,openTab:openTab};
})();
