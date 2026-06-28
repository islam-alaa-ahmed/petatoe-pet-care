/* PETATOE v6.6.18 - Topbar Notifications Final Stabilization
 * Scope: Activate existing bell pill as a dropdown notification center.
 * Data source: current appointments storage only; no architecture changes.
 */
(function(){
  'use strict';
  if(window.__PETATOE_TOPBAR_NOTIFICATIONS_V6618__) return;
  window.__PETATOE_TOPBAR_NOTIFICATIONS_V6618__ = true;

  var VERSION = '6.6.18';
  var refreshTimer = 0;

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function todayKey(){
    var d = new Date();
    function p(n){ return String(n).padStart(2,'0'); }
    return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate());
  }
  function appointmentDateTime(row){
    var d = String((row && row.date) || '');
    if(!d) return null;
    var t = String((row && (row.start || row.time)) || '00:00');
    var dt = new Date(d + 'T' + (t || '00:00'));
    return isNaN(dt.getTime()) ? null : dt;
  }
  function normalizeStatus(v){
    v = String(v || '').trim();
    if(v === 'تم') return 'تمت الجلسة';
    return v || 'مجدول';
  }
  function isClosedStatus(status){
    status = normalizeStatus(status);
    return status === 'تمت الجلسة' || status === 'تم التحصيل' || status === 'ملغي' || status === 'مغلق';
  }
  function money(n){
    var x = Number(n || 0);
    try{return x.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2}) + ' SAR';}
    catch(_){return String(x) + ' SAR';}
  }
  function calcFinancials(row){
    row = row || {};
    if(window.PETATOEOperationsContext && typeof window.PETATOEOperationsContext.calcFinancials === 'function'){
      try{return window.PETATOEOperationsContext.calcFinancials(row);}
      catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
    }
    var price = Number(row.sessionPrice || row.totalAmount || 0);
    var discount = Number(row.discount || 0);
    var paid = Number(row.paidAmount || 0);
    var total = Math.max(0, price - discount);
    var remaining = Math.max(0, total - paid);
    var out = Object.assign({}, row);
    out.totalAmount = total;
    out.remainingAmount = Number(row.remainingAmount || remaining || 0);
    return out;
  }
  function readAppointments(){
    try{
      if(window.PETATOEOperationsStorage && typeof window.PETATOEOperationsStorage.readAppointments === 'function'){
        var a = window.PETATOEOperationsStorage.readAppointments();
        return Array.isArray(a) ? a : [];
      }
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
    try{
      if(window.PETATOEStorage && typeof window.PETATOEStorage.readJSON === 'function'){
        var b = window.PETATOEStorage.readJSON('appointments', []);
        return Array.isArray(b) ? b : [];
      }
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
    try{
      var raw = localStorage.getItem('petatoe_appointments_v1') || localStorage.getItem('appointments');
      var c = raw ? JSON.parse(raw) : [];
      return Array.isArray(c) ? c : [];
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
    return [];
  }
  function findConflicts(row, rows){
    var conflicts = [];
    if(!row || !row.date || !row.start || !row.end) return conflicts;
    var startA = String(row.start || ''), endA = String(row.end || '');
    (rows || []).forEach(function(other){
      if(!other || other === row || String(other.id || '') === String(row.id || '') || String(other.date || '') !== String(row.date || '')) return;
      if(!other.start || !other.end) return;
      var overlap = startA < String(other.end || '') && String(other.start || '') < endA;
      if(!overlap) return;
      if(row.vehicle && other.vehicle && String(row.vehicle) === String(other.vehicle)) conflicts.push('السيارة');
      else if(row.groomer && other.groomer && String(row.groomer) === String(other.groomer)) conflicts.push('الجرومر');
      else if(row.driver && other.driver && String(row.driver) === String(other.driver)) conflicts.push('السائق');
    });
    return conflicts;
  }
  function buildAlerts(rows){
    rows = (rows || []).map(calcFinancials);
    var now = new Date();
    var today = todayKey();
    var in60 = new Date(now.getTime() + 60 * 60000);
    var alerts = [];
    rows.forEach(function(r){
      var st = normalizeStatus(r.status);
      var dt = appointmentDateTime(r);
      if(dt && dt >= now && dt <= in60 && !isClosedStatus(st)){
        alerts.push({level:'warning', icon:'⏰', title:'موعد خلال ساعة', text:(r.client || 'عميل غير محدد') + ' — ' + (r.start || '--:--') + ' — ' + ([r.service,r.petName].filter(Boolean).join(' / ') || 'جلسة'), date:r.date, time:r.start, sort:dt.getTime()});
      }
      if(String(r.date || '') === today && !isClosedStatus(st)){
        alerts.push({level:'info', icon:'📅', title:'موعد اليوم', text:(r.client || 'عميل غير محدد') + ' — ' + (r.start || '--:--') + ' — الحالة: ' + st, date:r.date, time:r.start, sort:(dt ? dt.getTime() : Date.now()+999999)});
      }
      if(String(r.date || '') < today && !isClosedStatus(st) && st !== 'مؤجل'){
        alerts.push({level:'danger', icon:'⚠️', title:'موعد سابق لم يتم إغلاقه', text:(r.client || 'عميل غير محدد') + ' — ' + (r.date || '-') + ' — الحالة: ' + st, date:r.date, time:r.start, sort:0});
      }
      if(st === 'مؤجل'){
        alerts.push({level:'warning', icon:'⏳', title:'موعد مؤجل يحتاج متابعة', text:(r.client || 'عميل غير محدد') + ' — ' + (r.date || '-') + ' — ' + (r.service || 'جلسة'), date:r.date, time:r.start, sort:(dt ? dt.getTime() : Date.now()+1000000)});
      }
      if(Number(r.remainingAmount || 0) > 0 && String(r.date || '') <= today){
        alerts.push({level:'danger', icon:'💳', title:'تحصيل متبقي', text:(r.client || 'عميل غير محدد') + ' — المتبقي: ' + money(r.remainingAmount), date:r.date, time:r.start, sort:(dt ? dt.getTime() : Date.now()+2000000)});
      }
    });
    rows.forEach(function(r){
      findConflicts(r, rows).forEach(function(reason){
        alerts.push({level:'danger', icon:'🚧', title:'تعارض في الموارد', text:'تعارض في ' + reason + ' — ' + (r.client || 'عميل غير محدد') + ' — ' + (r.start || '?') + ' إلى ' + (r.end || '?'), date:r.date, time:r.start, sort:(appointmentDateTime(r) ? appointmentDateTime(r).getTime() : Date.now()+3000000)});
      });
    });
    var seen = Object.create(null);
    return alerts.sort(function(a,b){return (a.sort||0)-(b.sort||0);}).filter(function(a){
      var k = [a.level,a.title,a.text,a.date,a.time].join('|');
      if(seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }
  function ensureStyles(){
    if(document.getElementById('petTopbarNotificationsStyles')) return;
    var st = document.createElement('style');
    st.id = 'petTopbarNotificationsStyles';
    st.textContent = ''+
      '.pet-notification-shell{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:64px;cursor:pointer;user-select:none;pointer-events:auto!important;z-index:1000000}'+
      '.pet-notification-shell .pet-notification-count{color:#fff!important;background:rgba(239,68,68,.92);border:1px solid rgba(248,113,113,.55);min-width:20px;height:20px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:950;margin-inline-start:6px;box-shadow:0 0 14px rgba(239,68,68,.32)}'+
      '.pet-notification-shell.no-alerts .pet-notification-count{background:rgba(148,163,184,.24);border-color:rgba(148,163,184,.28);box-shadow:none;color:var(--muted)!important}'+
      '.pet-notification-dropdown{position:absolute;top:calc(100% + 12px);left:0;pointer-events:auto!important;width:min(390px,calc(100vw - 24px));max-height:min(68vh,520px);overflow:hidden;display:none;z-index:999999;direction:rtl;text-align:right;border-radius:22px;border:1px solid rgba(148,163,184,.30);background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(30,41,59,.96));box-shadow:0 24px 70px rgba(0,0,0,.48),0 0 24px rgba(34,211,238,.14);backdrop-filter:blur(18px);color:#f8fafc}'+
      '.pet-notification-shell.open .pet-notification-dropdown{display:flex;flex-direction:column}'+
      '.pet-notification-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,.18)}'+
      '.pet-notification-head b{font-size:15px;font-weight:950}.pet-notification-head small{display:block;color:#94a3b8;font-weight:800;margin-top:3px}'+
      '.pet-notification-list{overflow:auto;padding:8px;display:grid;gap:8px}'+
      '.pet-notification-item{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:start;padding:10px;border-radius:16px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.52);cursor:pointer;transition:.16s ease}'+
      '.pet-notification-item:hover{transform:translateY(-1px);border-color:rgba(34,211,238,.45);background:rgba(30,41,59,.72)}'+
      '.pet-notification-icon{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.24)}'+
      '.pet-notification-item.danger .pet-notification-icon{background:rgba(239,68,68,.16);border-color:rgba(239,68,68,.30)}'+
      '.pet-notification-item.warning .pet-notification-icon{background:rgba(245,158,11,.16);border-color:rgba(245,158,11,.30)}'+
      '.pet-notification-item.info .pet-notification-icon{background:rgba(34,211,238,.13);border-color:rgba(34,211,238,.28)}'+
      '.pet-notification-body b{display:block;font-size:13px;font-weight:950;color:#fff;margin-bottom:3px}.pet-notification-body p{margin:0;color:#cbd5e1;font-size:12px;font-weight:800;line-height:1.55}.pet-notification-body small{display:block;margin-top:5px;color:#94a3b8;font-size:11px;font-weight:800}'+
      '.pet-notification-foot{padding:10px 12px;border-top:1px solid rgba(148,163,184,.18);display:flex;gap:8px}.pet-notification-foot button{width:100%;height:38px;border-radius:14px;border:1px solid rgba(34,211,238,.35);background:rgba(34,211,238,.12);color:#e0f2fe;font:900 12px Cairo;cursor:pointer}'+
      '.pet-notification-empty{padding:22px;text-align:center;color:#cbd5e1;font-weight:900}'+
      'html[data-theme="light"] .pet-notification-dropdown{background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(241,245,249,.96));color:#0f172a;box-shadow:0 24px 70px rgba(15,23,42,.18)}'+
      'html[data-theme="light"] .pet-notification-body b{color:#0f172a}html[data-theme="light"] .pet-notification-body p{color:#334155}html[data-theme="light"] .pet-notification-item{background:rgba(255,255,255,.78)}'+
      '@media(max-width:760px){.pet-notification-dropdown{left:auto;right:-120px;width:calc(100vw - 18px)}}';
    document.head.appendChild(st);
  }
  function isNotificationLike(el){
    if(!el || !el.textContent) return false;
    var txt = String(el.textContent || '');
    return /🔔/.test(txt) && !el.closest('.pet-notification-dropdown');
  }
  function wireShell(shell){
    if(!shell) return shell;
    if(shell.__petNotifyWired) return shell;
    shell.__petNotifyWired = true;
    shell.setAttribute('onclick', 'return window.petatoeToggleTopbarNotifications(event);');
    shell.addEventListener('click', window.petatoeToggleTopbarNotifications, true);
    shell.addEventListener('mousedown', function(e){
      if(e.target && e.target.closest && e.target.closest('.pet-notification-dropdown')) return;
      e.stopPropagation();
    }, true);
    shell.addEventListener('touchstart', function(e){
      if(e.target && e.target.closest && e.target.closest('.pet-notification-dropdown')) return;
      e.stopPropagation();
    }, {capture:true, passive:true});
    return shell;
  }
  window.petatoeToggleTopbarNotifications = function(e){
    var shell = document.getElementById('petTopbarNotifications');
    if(!shell) shell = ensureShell();
    if(!shell) return false;
    if(e){
      if(e.target && e.target.closest && e.target.closest('#petOpenAppointmentAlerts')) return false;
      if(e.target && e.target.closest && e.target.closest('.pet-notification-item')) return false;
      e.preventDefault();
      e.stopPropagation();
      if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    }
    var open = !shell.classList.contains('open');
    setOpen(open);
    if(open) refresh();
    return false;
  };
  function ensureDropdown(shell){
    if(!shell) return null;
    shell.classList.add('pet-notification-shell');
    shell.setAttribute('aria-haspopup','menu');
    shell.setAttribute('aria-expanded', shell.classList.contains('open') ? 'true' : 'false');
    shell.setAttribute('title','مركز الإشعارات');
    if(!shell.querySelector('.pet-notification-bell')){
      var bell = document.createElement('span');
      bell.className = 'pet-notification-bell';
      bell.textContent = '🔔';
      shell.appendChild(bell);
    }
    var count = document.getElementById('petTopbarNotificationCount') || document.getElementById('topbarNotifCount') || shell.querySelector('b, .pet-notification-count');
    if(!count){
      count = document.createElement('b');
      count.textContent = '0';
      shell.appendChild(count);
    }
    count.id = 'petTopbarNotificationCount';
    count.classList.add('pet-notification-count');
    var legacyCount = document.getElementById('topbarNotifCount');
    if(legacyCount && legacyCount !== count) legacyCount.textContent = count.textContent || '0';

    var dd = document.getElementById('petTopbarNotificationDropdown') || shell.querySelector('.pet-notification-dropdown');
    if(!dd){
      dd = document.createElement('div');
      dd.className = 'pet-notification-dropdown';
      dd.id = 'petTopbarNotificationDropdown';
      dd.setAttribute('role','menu');
      dd.innerHTML = '<div class="pet-notification-head"><div><b>🔔 الإشعارات</b><small id="petTopbarNotificationHint">تنبيهات المواعيد الحالية</small></div><span class="pet-notification-count" id="petTopbarNotificationCountInside">0</span></div><div class="pet-notification-list" id="petTopbarNotificationList"></div><div class="pet-notification-foot"><button type="button" id="petOpenAppointmentAlerts">فتح شاشة التنبيهات</button></div>';
      shell.appendChild(dd);
    }
    var openBtn = shell.querySelector('#petOpenAppointmentAlerts');
    if(openBtn && !openBtn.__petOpenAlertsWired){
      openBtn.__petOpenAlertsWired = true;
      openBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); openAppointmentAlerts(); }, true);
    }
    return shell;
  }
  function ensureShell(){
    ensureStyles();
    var shell = document.getElementById('petTopbarNotifications') || document.getElementById('topbarNotifBtn');
    if(shell){
      shell.id = 'petTopbarNotifications';
      ensureDropdown(shell);
      return wireShell(shell);
    }
    var candidates = Array.prototype.slice.call(document.querySelectorAll('.top-right .pill, .top-right button, header .pill, .app-header .pill'));
    var old = candidates.find(isNotificationLike);
    if(!old) return null;
    shell = document.createElement('button');
    shell.type = 'button';
    shell.id = 'petTopbarNotifications';
    shell.className = (old.className || 'pill') + ' pet-notification-shell no-alerts';
    shell.setAttribute('aria-label','الإشعارات');
    shell.innerHTML = '<span class="pet-notification-bell">🔔</span><span class="pet-notification-count" id="petTopbarNotificationCount">0</span>';
    old.replaceWith(shell);
    ensureDropdown(shell);
    wireShell(shell);
    shell.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ window.petatoeToggleTopbarNotifications(e); } }, true);
    document.addEventListener('click', function(e){ if(shell && !shell.contains(e.target)) setOpen(false); }, true);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setOpen(false); }, true);
    return shell;
  }
  function setOpen(open){
    var shell = document.getElementById('petTopbarNotifications');
    if(!shell) return;
    shell.classList.toggle('open', !!open);
    shell.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function clickIfExists(selector){
    var el = document.querySelector(selector);
    if(el && typeof el.click === 'function'){
      el.click();
      return true;
    }
    return false;
  }
  function openAppointmentAlerts(){
    setOpen(false);
    try{
      var opened = false;
      if(window.PETATOEInlineHandlers && window.PETATOEInlineHandlers.moduleCall){
        try{ window.PETATOEInlineHandlers.moduleCall('router','openTab','appointments'); opened = true; }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
        try{ window.PETATOEInlineHandlers.moduleCall('operations','setTab','alerts'); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
      }
      opened = clickIfExists('[data-tab="appointments"], [data-route="appointments"], [data-menu-target="appointments"], [data-section="appointments"]') || opened;
      setTimeout(function(){
        clickIfExists('[data-appointment-tab="alerts"], [data-op-arg1="alerts"], button[onclick*="alerts"]');
        var sec = document.querySelector('[data-appointment-section="alerts"], #appointmentsAlertsList, .appointments-alerts-card');
        if(sec && sec.scrollIntoView) sec.scrollIntoView({behavior:'smooth', block:'start'});
        if(window.PETATOEAppointments && typeof window.PETATOEAppointments.renderAlerts === 'function') window.PETATOEAppointments.renderAlerts();
        try{ document.dispatchEvent(new CustomEvent('petatoe:notifications:open-alerts')); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
      }, 160);
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
  }
  function renderList(alerts){
    var list = document.getElementById('petTopbarNotificationList');
    if(!list) return;
    list.textContent = '';
    if(!alerts.length){
      var empty = document.createElement('div');
      empty.className = 'pet-notification-empty';
      empty.textContent = '✅ لا توجد إشعارات حالية';
      list.appendChild(empty);
      return;
    }
    alerts.slice(0, 12).forEach(function(a){
      var item = document.createElement('div');
      item.className = 'pet-notification-item ' + (a.level || 'info');
      item.setAttribute('role','menuitem');
      item.tabIndex = 0;
      item.innerHTML = '<div class="pet-notification-icon">'+esc(a.icon || '🔔')+'</div><div class="pet-notification-body"><b>'+esc(a.title)+'</b><p>'+esc(a.text)+'</p><small>'+esc([a.date,a.time].filter(Boolean).join(' | ') || '-')+'</small></div>';
      item.addEventListener('click', openAppointmentAlerts);
      item.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openAppointmentAlerts(); } });
      list.appendChild(item);
    });
    if(alerts.length > 12){
      var more = document.createElement('div');
      more.className = 'pet-notification-empty';
      more.textContent = 'و ' + (alerts.length - 12) + ' إشعارات أخرى داخل شاشة التنبيهات';
      list.appendChild(more);
    }
  }
  function refresh(){
    var shell = ensureShell();
    if(!shell) return;
    var openBtn = document.getElementById('petOpenAppointmentAlerts');
    if(openBtn && !openBtn.__petOpenAlertsWired){
      openBtn.__petOpenAlertsWired = true;
      openBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); openAppointmentAlerts(); }, true);
    }
    var alerts = buildAlerts(readAppointments());
    var count = alerts.length;
    var c1 = document.getElementById('petTopbarNotificationCount') || document.getElementById('topbarNotifCount');
    var c2 = document.getElementById('petTopbarNotificationCountInside');
    var hint = document.getElementById('petTopbarNotificationHint');
    if(c1) c1.textContent = String(count);
    if(c2) c2.textContent = String(count);
    if(hint) hint.textContent = count ? ('لديك ' + count + ' إشعار يحتاج متابعة') : 'لا توجد إشعارات حالية';
    shell.classList.toggle('no-alerts', !count);
    renderList(alerts);
    try{
      ['appointmentsHeroAlertBadge','appointmentsTabAlertBadge'].forEach(function(id){
        var el = document.getElementById(id);
        if(el){ el.textContent = count; el.style.display = count ? 'inline-flex' : 'none'; }
      });
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
  }
  function scheduleRefresh(delay){
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, delay == null ? 120 : delay);
  }
  function boot(){
    ensureShell();
    scheduleRefresh(120);
    setTimeout(function(){ ensureShell(); refresh(); }, 500);
    setTimeout(function(){ ensureShell(); refresh(); }, 1500);
    setInterval(refresh, 60000);
    document.addEventListener('click', function(e){
      var node = e.target && e.target.closest && e.target.closest('#petTopbarNotifications');
      if(node) return;
      var legacy = e.target && e.target.closest && e.target.closest('.top-right .pill');
      if(legacy && isNotificationLike(legacy)){
        e.preventDefault();
        e.stopPropagation();
        ensureShell();
        setTimeout(function(){
          var shell = document.getElementById('petTopbarNotifications');
          if(shell){ setOpen(true); refresh(); }
        }, 0);
      }
    }, true);

    document.addEventListener('click', function(e){
      var shell = e.target && e.target.closest && e.target.closest('#petTopbarNotifications');
      if(shell && !(e.target.closest && e.target.closest('.pet-notification-dropdown'))){
        window.petatoeToggleTopbarNotifications(e);
      }
    }, true);
    try{
      var mo = new MutationObserver(function(muts){
        var need = false;
        (muts || []).forEach(function(m){
          if(need) return;
          var t = m.target;
          if(t && t.closest && t.closest('#petTopbarNotifications')) return;
          if(!document.getElementById('petTopbarNotifications')) need = true;
        });
        if(need) scheduleRefresh(120);
      });
      mo.observe(document.body, {childList:true, subtree:true});
    }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('security/topbar-notifications.js',_);}
    ['petatoe:tabchange','petatoe:userchanged','petatoe:operations:updated','petatoe:appointments:updated','change','input'].forEach(function(ev){
      document.addEventListener(ev, function(e){
        if(ev === 'input' || ev === 'change'){
          if(!e.target || !String(e.target.id || e.target.name || '').toLowerCase().includes('appointment')) return;
        }
        scheduleRefresh(180);
      }, true);
    });
    window.addEventListener('storage', function(e){
      if(!e || !e.key || /appointment|petatoe_appointments/i.test(e.key)) scheduleRefresh(80);
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.PETATOETopbarNotifications = {version:VERSION, refresh:refresh, buildAlerts:buildAlerts, openAppointmentAlerts:openAppointmentAlerts};
})();
