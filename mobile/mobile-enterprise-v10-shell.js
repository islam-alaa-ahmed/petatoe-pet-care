/** PETATOE Mobile Enterprise UI v10 — M1 App Shell */
(function(){
  'use strict';
  function d35Mark(name,detail){try{if(window.PETATOEStartupDiagnostics&&window.PETATOEStartupDiagnostics.mark)window.PETATOEStartupDiagnostics.mark(name,detail);}catch(_e){}}
  d35Mark('mobile-shell-eval-start');
  if (window.__PETATOE_MOBILE_V10_SHELL__) return;
  window.__PETATOE_MOBILE_V10_SHELL__ = true;


  function accordionState(){
    if(window.PETATOENavigationAccordionState) return window.PETATOENavigationAccordionState;
    var values=Object.create(null), explicit=Object.create(null);
    function emit(id){try{document.dispatchEvent(new CustomEvent('petatoe:navigationaccordionchange',{detail:{groupId:id||'',openGroups:api.snapshot()}}));}catch(_e){}}
    var api={
      has:function(id){return Object.prototype.hasOwnProperty.call(values,String(id||''));},
      isOpen:function(id){return values[String(id||'')]===true;},
      isExplicit:function(id){return explicit[String(id||'')]===true;},
      set:function(id,open,options){id=String(id||'');if(!id)return false;values[id]=!!open;if(!options||options.explicit!==false)explicit[id]=true;emit(id);return values[id];},
      toggle:function(id){return api.set(id,!api.isOpen(id),{explicit:true});},
      ensureOpen:function(id){id=String(id||'');if(!id)return false;if(!api.has(id)){values[id]=true;emit(id);}return api.isOpen(id);},
      snapshot:function(){var out={};Object.keys(values).forEach(function(k){out[k]=values[k]===true;});return out;}
    };
    window.PETATOENavigationAccordionState=api;return api;
  }
  var navAccordion=accordionState();
  var mq = window.matchMedia('(max-width: 760px), (max-height: 600px) and (hover: none) and (pointer: coarse)');
  function isMobileDevice(){ return window.PETATOEDeviceProfile ? window.PETATOEDeviceProfile.isMobileDevice() : mq.matches; }
  var ICONS = {
    menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    chart:'<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
    theme:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.5A7 7 0 0 1 12 3Z"/></svg>'
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
  function mobileRoot(){
    var root=document.getElementById('petV10MobileRoot');
    if(root)return root;
    root=el('div','pet-v10-mobile-root');
    root.id='petV10MobileRoot';
    root.setAttribute('data-pet-mobile-presentation','v10');
    document.body.appendChild(root);
    return root;
  }
  function text(id, fallback){ var n=document.getElementById(id); return (n&&n.textContent||fallback||'').trim(); }
  function currentTab(){ var p=document.querySelector('.panel.active'); return p&&p.id || 'dashboard'; }
  function openTab(tab){
    if(!tab) return;
    if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab(tab);
    else { var source=document.querySelector('#nav [data-tab="'+CSS.escape(tab)+'"]'); if(source) source.click(); }
    closeDrawer(); syncActive(tab);
  }
  function clearLegacyNavigation(){
    document.body.classList.remove('sidebar-open');
    document.documentElement.classList.remove('sidebar-open');
    var legacy=document.getElementById('sidebar');
    if(legacy){
      legacy.classList.remove('open','show','active');
      legacy.setAttribute('aria-hidden','true');
      legacy.setAttribute('inert','');
      legacy.dataset.petV10MobileIsolated='true';
    }
    var overlay=document.getElementById('overlay');
    if(overlay){
      overlay.classList.remove('show','open','active');
      overlay.setAttribute('aria-hidden','true');
      overlay.setAttribute('inert','');
      overlay.dataset.petV10MobileIsolated='true';
    }
    var legacyNav=document.getElementById('nav');
    if(legacyNav){
      legacyNav.setAttribute('aria-hidden','true');
      legacyNav.setAttribute('inert','');
      legacyNav.dataset.petV10MobileIsolated='true';
    }
    var desktopHeader=document.querySelector('.topbar');
    if(desktopHeader){
      desktopHeader.setAttribute('aria-hidden','true');
      desktopHeader.setAttribute('inert','');
      desktopHeader.dataset.petV10MobileIsolated='true';
    }
  }
  function restoreLegacyNavigation(){
    [document.getElementById('sidebar'),document.getElementById('overlay'),document.getElementById('nav'),document.querySelector('.topbar')].forEach(function(node){
      if(!node||node.dataset.petV10MobileIsolated!=='true')return;
      node.removeAttribute('inert');
      node.removeAttribute('aria-hidden');
      delete node.dataset.petV10MobileIsolated;
    });
  }
  function suppressLegacyMobileChrome(){
    if(!isMobileDevice())return;
    clearLegacyNavigation();
  }

  function openDrawer(){ if(!isMobileDevice())return; suppressLegacyMobileChrome(); document.body.classList.add('pet-v10-drawer-open'); var d=document.querySelector('.pet-v10-drawer'); if(d)d.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ document.body.classList.remove('pet-v10-drawer-open'); var d=document.querySelector('.pet-v10-drawer'); if(d)d.setAttribute('aria-hidden','true'); }
  function screenLabel(tab){
    tab=tab||'dashboard';
    var api=window.PETATOENavigationSchema;
    var schema=api&&api.current;
    if(schema){
      var items=(schema.direct||[]).slice();
      (schema.groups||[]).forEach(function(group){items=items.concat(group.items||[]);});
      var match=items.find(function(item){return item&&item.attributes&&item.attributes['data-tab']===tab;});
      if(match&&match.title)return cleanLabel(match.title);
    }
    var source=document.querySelector('#nav [data-tab="'+CSS.escape(tab)+'"]');
    if(source){
      var titleNode=source.querySelector('[data-nav-title],.pet-v142-title,strong,b');
      var label=cleanLabel(titleNode&&titleNode.textContent);
      if(label)return label;
    }
    return t(tab==='dashboard'?'home':'menu',tab||'PETATOE');
  }
  function syncActive(tab){
    document.querySelectorAll('.pet-v10-nav-btn[data-tab],.pet-v10-drawer-item[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});
    var title=document.getElementById('petV10HeaderScreenTitle'); if(title)title.textContent=screenLabel(tab);
    var nav=document.querySelector('.pet-v10-bottom-nav'); if(nav&&!nav.classList.contains('pet-v10-nav-tracking'))window.requestAnimationFrame(function(){positionNavBubble(nav);});
  }
  function iconFromLabel(label){ var m=(label||'').match(/[\p{Extended_Pictographic}\u2600-\u27BF]/u); return m?m[0]:'•'; }
  function cleanLabel(label){ return String(label||'').replace(/[\p{Extended_Pictographic}\u2600-\u27BF]/gu,'').replace(/\s+/g,' ').trim(); }

  function clearFirstPaintShell(){
    var root=document.getElementById('petV10MobileRoot');
    if(!root)return;
    var shell=root.querySelector('.pet-v10-first-paint-shell');
    if(shell&&shell.parentNode)shell.parentNode.removeChild(shell);
    root.classList.remove('pet-v10-first-paint-root');
  }

  function buildHeader(){
    var root=mobileRoot();
    var header=root.querySelector('.pet-v10-mobile-header');
    if(header)return header;
    header=el('header','pet-v10-mobile-header');
    header.setAttribute('role','banner');
    var menu=el('button','pet-v10-header-menu',ICONS.menu); menu.type='button'; menu.setAttribute('aria-label',t('openMenu','Open menu')); menu.addEventListener('click',openDrawer);
    var brand=el('button','pet-v10-header-brand'); brand.type='button';
    var logo=el('img','pet-v10-header-logo'); logo.alt='PETATOE'; logo.src='assets/icons/apple-touch-icon.png';
    brand.appendChild(logo);
    var title=el('div','pet-v10-header-copy','<b>PETATOE</b><small id="petV10HeaderScreenTitle">'+t('home','Home')+'</small>');
    var theme=el('button','pet-v10-header-action pet-v10-theme-toggle',ICONS.theme); theme.type='button';
    var legacyTheme=document.querySelector('.top-right .toggle');
    theme.setAttribute('aria-label',(legacyTheme&&legacyTheme.getAttribute('title'))||t('theme','Theme'));
    theme.addEventListener('click',function(){ if(typeof window.toggleTheme==='function')window.toggleTheme(); });
    var logoTimer=0;
    brand.addEventListener('click',function(){
      if(logoTimer){ window.clearTimeout(logoTimer); logoTimer=0; window.scrollTo({top:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),behavior:'smooth'}); return; }
      logoTimer=window.setTimeout(function(){logoTimer=0;window.scrollTo({top:0,behavior:'smooth'});},230);
    });
    header.append(menu,brand,title,theme);
    root.prepend(header);
    return header;
  }

  function buildBottomNav(){
    if(document.querySelector('.pet-v10-bottom-nav'))return;
    var nav=el('nav','pet-v10-bottom-nav'); nav.setAttribute('aria-label',t('mainNavigation','Main navigation'));
    var bubble=el('span','pet-v10-nav-bubble'); bubble.setAttribute('aria-hidden','true'); nav.appendChild(bubble);
    var items=[
      ['dashboard',t('home','Home'),ICONS.home],['appointments',t('appointments','Appointments'),ICONS.calendar],['smart',t('reports','Reports'),ICONS.chart],['settings',t('settings','Settings'),ICONS.settings]
    ];
    items.forEach(function(x){ var b=el('button','pet-v10-nav-btn',x[2]+'<span>'+x[1]+'</span>'); b.type='button'; b.dataset.tab=x[0]; nav.appendChild(b); });
    var more=el('button','pet-v10-nav-btn',ICONS.menu+'<span>'+t('menu','Menu')+'</span>'); more.type='button'; more.dataset.action='menu'; nav.appendChild(more);
    mobileRoot().appendChild(nav); setupBottomNavGesture(nav); syncActive(currentTab()); positionNavBubble(nav);
  }

  function navButtons(nav){ return Array.prototype.slice.call(nav.querySelectorAll('.pet-v10-nav-btn')); }
  function positionNavBubble(nav,button,clientX){
    var bubble=nav&&nav.querySelector('.pet-v10-nav-bubble'); if(!bubble)return;
    var buttons=navButtons(nav); if(!buttons.length)return;
    var target=button||nav.querySelector('.pet-v10-nav-btn.active')||buttons[0];
    var navRect=nav.getBoundingClientRect(), buttonRect=target.getBoundingClientRect();
    var width=buttonRect.width, x=(clientX==null?buttonRect.left-navRect.left:clientX-navRect.left-width/2);
    x=Math.max(0,Math.min(navRect.width-width,x));
    bubble.style.width=width+'px'; bubble.style.transform='translate3d('+x+'px,0,0)';
  }
  function setupBottomNavGesture(nav){
    var state={active:false,pointerId:null,target:null,raf:0,x:0};
    function nearest(clientX){var buttons=navButtons(nav),best=null,distance=Infinity;buttons.forEach(function(button){var r=button.getBoundingClientRect(),d=Math.abs(clientX-(r.left+r.width/2));if(d<distance){distance=d;best=button;}});return best;}
    function render(){state.raf=0;if(!state.active)return;state.target=nearest(state.x);navButtons(nav).forEach(function(b){b.classList.toggle('pet-v10-nav-preview',b===state.target);});positionNavBubble(nav,state.target,state.x);}
    function queue(clientX){state.x=clientX;if(!state.raf)state.raf=window.requestAnimationFrame(render);}
    nav.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;var button=e.target.closest('.pet-v10-nav-btn');if(!button)return;state.active=true;state.pointerId=e.pointerId;state.target=button;nav.classList.add('pet-v10-nav-tracking');nav.setPointerCapture&&nav.setPointerCapture(e.pointerId);queue(e.clientX);e.preventDefault();});
    nav.addEventListener('pointermove',function(e){if(!state.active||e.pointerId!==state.pointerId)return;queue(e.clientX);e.preventDefault();});
    function finish(e,cancelled){if(!state.active||e.pointerId!==state.pointerId)return;if(state.raf){window.cancelAnimationFrame(state.raf);state.raf=0;render();}var target=state.target;state.active=false;nav.classList.remove('pet-v10-nav-tracking');navButtons(nav).forEach(function(b){b.classList.remove('pet-v10-nav-preview');});if(!cancelled&&target){if(target.dataset.action==='menu')openDrawer();else openTab(target.dataset.tab);}window.requestAnimationFrame(function(){positionNavBubble(nav);});}
    nav.addEventListener('pointerup',function(e){finish(e,false);}); nav.addEventListener('pointercancel',function(e){finish(e,true);});
    window.addEventListener('resize',function(){window.requestAnimationFrame(function(){positionNavBubble(nav);});},{passive:true});
  }

  function setupDynamicChrome(){
    if(window.__PETATOE_V10_DYNAMIC_CHROME__)return; window.__PETATOE_V10_DYNAMIC_CHROME__=true;
    var lastY=Math.max(0,window.scrollY||0),queued=false;
    function paint(){queued=false;var y=Math.max(0,window.scrollY||0),delta=y-lastY;if(Math.abs(delta)>=5){if(y>72&&delta>0)document.body.classList.add('pet-v10-nav-compact');else if(delta<0||y<36)document.body.classList.remove('pet-v10-nav-compact');lastY=y;}}
    window.addEventListener('scroll',function(){if(!queued){queued=true;window.requestAnimationFrame(paint);}},{passive:true});
  }

  var CANONICAL_ROUTE_ATTRIBUTES=['data-tab','data-settings-main','data-settings-sub','data-settings-action','data-appointments-subtab','data-smart-open'];
  function canonicalButtonVisible(button){
    if(!button)return false;
    if(button.classList.contains('pet-nav-hidden-by-permission'))return false;
    if(button.getAttribute('aria-hidden')==='true')return false;
    if(button.hidden||button.style.display==='none')return false;
    var group=button.closest('.pet-v142-group');
    if(group&&(group.classList.contains('pet-nav-hidden-by-permission')||group.getAttribute('aria-hidden')==='true'||group.hidden||group.style.display==='none'))return false;
    return true;
  }
  function canonicalRouteKeyFromButton(button){
    return CANONICAL_ROUTE_ATTRIBUTES.map(function(name){return button&&button.getAttribute(name)||'';}).join('|');
  }
  function canonicalButtonCopy(button){
    var titleNode=button.querySelector('[data-nav-title],.pet-v142-title,strong,b');
    var subtitleNode=button.querySelector('[data-nav-subtitle],.pet-v142-subtitle,small');
    var rawTitle=(titleNode&&titleNode.textContent)||button.getAttribute('aria-label')||button.textContent||'';
    return {
      routeKey:canonicalRouteKeyFromButton(button),
      tab:button.getAttribute('data-tab')||'',
      title:String(rawTitle||'').trim(),
      subtitle:String(subtitleNode&&subtitleNode.textContent||'').trim()
    };
  }
  function canonicalNavigationModel(){
    var nav=document.getElementById('nav');
    var model={direct:[],groups:[]};
    if(!nav)return model;
    Array.prototype.forEach.call(nav.children,function(node){
      if(node.matches&&node.matches('button.pet-v142-direct')){
        if(canonicalButtonVisible(node))model.direct.push(canonicalButtonCopy(node));
        return;
      }
      if(!node.matches||!node.matches('.pet-v142-group'))return;
      if(node.classList.contains('pet-nav-hidden-by-permission')||node.getAttribute('aria-hidden')==='true'||node.hidden||node.style.display==='none')return;
      var toggle=node.querySelector(':scope > .pet-v142-toggle');
      var titleNode=toggle&&toggle.querySelector('[data-nav-title],.pet-v142-title,strong,b');
      var group={id:node.getAttribute('data-group')||'',title:String(titleNode&&titleNode.textContent||toggle&&toggle.textContent||'').trim(),items:[]};
      node.querySelectorAll(':scope > .pet-v142-items > button').forEach(function(button){if(canonicalButtonVisible(button))group.items.push(canonicalButtonCopy(button));});
      if(group.items.length)model.groups.push(group);
    });
    return model;
  }
  function findCanonicalButton(routeKey){
    var nav=document.getElementById('nav');
    if(!nav)return null;
    var buttons=nav.querySelectorAll('button');
    for(var i=0;i<buttons.length;i++)if(canonicalRouteKeyFromButton(buttons[i])===routeKey&&canonicalButtonVisible(buttons[i]))return buttons[i];
    return null;
  }
  function activateCanonicalButton(routeKey){
    var source=findCanonicalButton(routeKey);
    if(!source)return false;
    /* The canonical desktop button owns routing, guards, sub-route intent and analytics.
       Mobile only mirrors its presentation and delegates the action back to that same node. */
    source.click();
    return true;
  }
  function itemIcon(item){return iconFromLabel((item&&item.title)||'');}
  function buildDrawerItem(item){
    var label=cleanLabel(item&&item.title), button=el('button','pet-v10-drawer-item');
    button.type='button'; button.dataset.routeKey=item.routeKey||'';
    if(item&&item.tab)button.dataset.tab=item.tab;
    button.innerHTML='<span class="pet-v10-menu-icon">'+itemIcon(item)+'</span><span class="pet-v10-menu-copy"><span class="pet-v10-menu-label">'+label+'</span>'+(item&&item.subtitle?'<small>'+cleanLabel(item.subtitle)+'</small>':'')+'</span><span class="pet-v10-menu-chevron" aria-hidden="true">›</span>';
    button.addEventListener('click',function(){
      if(activateCanonicalButton(item.routeKey)){closeDrawer();syncActive(currentTab());}
    });
    return button;
  }
  function setSectionOpen(section,open,options){
    section.classList.toggle('open',!!open);
    var toggle=section.querySelector('.pet-v10-drawer-section-toggle');
    if(toggle)toggle.setAttribute('aria-expanded',open?'true':'false');
    var id=section&&section.dataset&&section.dataset.group||'';
    if(id&&options&&options.persist) navAccordion.set(id,!!open,{explicit:true});
  }
  function desiredSectionOpen(groupId,active,queryActive){
    if(queryActive)return true;
    if(navAccordion.has(groupId))return navAccordion.isOpen(groupId);
    if(active){navAccordion.ensureOpen(groupId);return true;}
    return false;
  }
  function renderDrawerList(filter){
    var list=document.querySelector('.pet-v10-drawer-list');
    if(!list)return;
    var model=canonicalNavigationModel(), q=cleanLabel(filter).toLowerCase(), visibleCount=0;
    list.textContent='';

    var extraDirect=(model.direct||[]).filter(function(item){
      if(item.tab==='dashboard')return false;
      var hay=(cleanLabel(item.title)+' '+cleanLabel(item.subtitle)).toLowerCase();
      return !q||hay.indexOf(q)>=0;
    });
    if(extraDirect.length){
      var extraSection=el('section','pet-v10-drawer-section pet-v10-drawer-section-extra'); extraSection.dataset.group='mobileDirect';
      var extraToggle=el('button','pet-v10-drawer-section-toggle');
      extraToggle.type='button'; extraToggle.setAttribute('aria-expanded',q?'true':'false');
      extraToggle.innerHTML='<span class="pet-v10-section-icon">'+ICONS.menu+'</span><b>'+t('menu','Menu')+'</b><span class="pet-v10-section-chevron" aria-hidden="true">⌄</span>';
      var extraBody=el('div','pet-v10-drawer-section-body');
      extraDirect.forEach(function(item){extraBody.appendChild(buildDrawerItem(item));visibleCount+=1;});
      extraToggle.addEventListener('click',function(){setSectionOpen(extraSection,!extraSection.classList.contains('open'),{persist:true});});
      extraSection.append(extraToggle,extraBody);list.appendChild(extraSection);setSectionOpen(extraSection,desiredSectionOpen('mobileDirect',false,!!q));
    }

    model.groups.forEach(function(group){
      var matches=group.items.filter(function(item){
        var hay=(cleanLabel(item.title)+' '+cleanLabel(item.subtitle)).toLowerCase();
        return !q||hay.indexOf(q)>=0||cleanLabel(group.title).toLowerCase().indexOf(q)>=0;
      });
      if(!matches.length)return;
      var section=el('section','pet-v10-drawer-section'); section.dataset.group=group.id;
      var toggle=el('button','pet-v10-drawer-section-toggle'); toggle.type='button'; toggle.setAttribute('aria-expanded',q?'true':'false');
      toggle.innerHTML='<span class="pet-v10-section-icon">'+iconFromLabel(group.title)+'</span><b>'+cleanLabel(group.title)+'</b><span class="pet-v10-section-chevron" aria-hidden="true">⌄</span>';
      var body=el('div','pet-v10-drawer-section-body');
      matches.forEach(function(item){body.appendChild(buildDrawerItem(item));visibleCount+=1;});
      toggle.addEventListener('click',function(){setSectionOpen(section,!section.classList.contains('open'),{persist:true});});
      section.append(toggle,body); list.appendChild(section);
      var active=matches.some(function(item){return item.tab&&item.tab===currentTab();});
      setSectionOpen(section,desiredSectionOpen(group.id,active,!!q));
    });
    if(!visibleCount)list.appendChild(el('div','pet-v10-drawer-empty',t('noResults','No results found')));
    syncActive(currentTab());
  }

  function buildDrawer(){
    if(document.querySelector('.pet-v10-drawer'))return;
    var backdrop=el('div','pet-v10-drawer-backdrop'); backdrop.addEventListener('click',closeDrawer);
    var drawer=el('aside','pet-v10-drawer'); drawer.setAttribute('aria-hidden','true');
    var head=el('div','pet-v10-drawer-head');
    var user=el('div','pet-v10-drawer-user','<div class="pet-v10-drawer-avatar"><img src="assets/icons/apple-touch-icon.png" alt="PETATOE"></div><div class="pet-v10-drawer-user-copy"><b id="petV10DrawerName">'+text('topbarUserName','PETATOE')+'</b><small id="petV10DrawerRole">'+text('topbarUserRole','')+'</small></div>');
    var close=el('button','pet-v10-drawer-close','×'); close.type='button'; close.setAttribute('aria-label',t('close','Close')); close.addEventListener('click',closeDrawer); head.append(user,close);
    var searchWrap=el('div','pet-v10-drawer-search'); var input=el('input'); input.type='search'; input.placeholder=t('searchMenu','Search menu...'); input.addEventListener('input',function(){renderDrawerList(input.value);}); searchWrap.appendChild(input);
    var list=el('div','pet-v10-drawer-list'); drawer.append(head,searchWrap,list); mobileRoot().append(backdrop,drawer); renderDrawerList('');
    document.addEventListener('petatoe:permissionsready',function(){renderDrawerList(input.value);});
    document.addEventListener('petatoe:navigationpermissionsready',function(){renderDrawerList(input.value);});
    document.addEventListener('petatoe:navigationaccordionchange',function(){
      document.querySelectorAll('.pet-v10-drawer-section[data-group]').forEach(function(section){
        if(input.value)return;
        setSectionOpen(section,navAccordion.isOpen(section.dataset.group));
      });
    });
  }

  function syncIdentity(){
    var name=text('topbarUserName','PETATOE'), role=text('topbarUserRole','');
    var drawerName=document.getElementById('petV10DrawerName'); if(drawerName)drawerName.textContent=name;
    var r=document.getElementById('petV10DrawerRole');if(r)r.textContent=role;
    var count=parseInt(text('topbarNotifCount','0'),10)||0;
    var badge=document.getElementById('petV10NotificationBadge');
    if(badge){badge.textContent=String(count>99?'99+':count);badge.classList.toggle('visible',count>0);}
  }
  var lifecycleBound=false;
  function initFirstPaint(){
    d35Mark('mobile-shell-first-paint-start');
    if(!isMobileDevice()||!document.body){d35Mark('mobile-shell-first-paint-end',{result:'skipped'});return;}
    document.body.classList.add('pet-v10-mobile','pet-v10-mobile-redesign-m1');
    mobileRoot().removeAttribute('aria-hidden');
    buildHeader();
    buildBottomNav();
    clearFirstPaintShell();
    d35Mark('mobile-shell-first-paint-end',{result:'rendered'});
    try{window.requestAnimationFrame(function(){d35Mark('interactive-first-frame');});}catch(_e){}
  }
  function init(){ d35Mark('mobile-shell-init-start'); if(!isMobileDevice()){d35Mark('mobile-shell-init-end',{result:'skipped'});return;} initFirstPaint(); clearLegacyNavigation(); suppressLegacyMobileChrome();buildDrawer();setupDynamicChrome();syncIdentity();
    if(!lifecycleBound){
      lifecycleBound=true;
      document.addEventListener('petatoe:tabchange',function(e){clearLegacyNavigation();syncActive(e.detail&&e.detail.tabId||currentTab());});
      document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrawer();});
      document.addEventListener('petatoe:navbuilt',function(){if(isMobileDevice()){clearLegacyNavigation();renderDrawerList('');}});
    }
    var u=document.getElementById('topbarUserBlock');
    var coordinator=window.PETATOEMobileRuntimeCoordinator;
    if(u&&coordinator){
      coordinator.observeTarget(u,{subtree:true,childList:true,characterData:true});
      var identityQueued=false;
      coordinator.subscribe(function(records){
        var relevant=records.some(function(record){return record.target===u||u.contains(record.target);});
        if(!relevant||identityQueued)return;
        identityQueued=true;
        (window.requestAnimationFrame||window.setTimeout)(function(){identityQueued=false;syncIdentity();});
      });
    }
    d35Mark('mobile-shell-init-end',{result:'ready'});
  }
  d35Mark('mobile-shell-eval-end');
  initFirstPaint();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  window.addEventListener('petatoe:device-profile-change',function(e){
    if(e.detail&&e.detail.mobile)init();
    else {closeDrawer();restoreLegacyNavigation();document.body.classList.remove('pet-v10-mobile','pet-v10-mobile-redesign-m1');var root=document.getElementById('petV10MobileRoot');if(root)root.setAttribute('aria-hidden','true');}
  });
  window.PETATOEMobileV10={version:'10.0.25-single-navigation-data-source-e5-2-17-1',openDrawer:openDrawer,closeDrawer:closeDrawer,openTab:openTab};
})();
