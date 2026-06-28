/* PETATOE v4.1 Liquid Glass UI interactions
   UI-only: no router/data/render wrappers. */
(function(w,d){
  'use strict';
  var NS='PETATOELiquidGlassUI';
  if(w[NS] && w[NS].ready) return;
  function q(sel,root){return (root||d).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||d).querySelectorAll(sel))}
  function enhanceRoot(){
    d.documentElement.classList.add('pet-liquid-glass');
    if(d.body) d.body.classList.add('pet-liquid-glass-body');
  }
  function ripple(e){
    var btn=e.target && e.target.closest && e.target.closest('button,.btn,.exp-btn,.reports-btn,.hamb,.pill.toggle,.pet-modal-close');
    if(!btn || btn.disabled || btn.closest('[data-lg-no-ripple]')) return;
    var rect=btn.getBoundingClientRect();
    var size=Math.max(rect.width,rect.height);
    var span=d.createElement('span');
    span.className='lg-ripple';
    span.style.width=span.style.height=size+'px';
    span.style.left=(e.clientX-rect.left-size/2)+'px';
    span.style.top=(e.clientY-rect.top-size/2)+'px';
    var old=btn.style.position;
    if(getComputedStyle(btn).position==='static') btn.style.position='relative';
    btn.style.overflow='hidden';
    btn.appendChild(span);
    setTimeout(function(){try{span.remove()}catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",_);} if(!old){}},650);
  }
  function markActive(tabId){
    if(!tabId){var p=q('.panel.active'); tabId=p&&p.id;}
    qa('[data-tab], [data-smart-open]').forEach(function(el){
      var active=(el.getAttribute('data-tab')===tabId) || (tabId==='smart' && el.getAttribute('data-smart-open'));
      el.classList.toggle('lg-active-tab', !!active);
    });
    var p=tabId && d.getElementById(tabId);
    if(p){p.classList.remove('lg-tab-pulse'); void p.offsetWidth; p.classList.add('lg-tab-pulse');}
  }
  function polishSelects(root){
    root=root||d;
    qa('select:not(.lg-select)',root).forEach(function(el){el.classList.add('lg-select')});
    qa('input:not(.lg-field),textarea:not(.lg-field)',root).forEach(function(el){el.classList.add('lg-field')});
  }
  function init(){enhanceRoot();polishSelects();markActive();}
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',init); else init();
  d.addEventListener('click',ripple,true);
  d.addEventListener('petatoe:tabchange',function(e){
    clearTimeout(markActive._t);
    markActive._t=setTimeout(function(){
      var tabId=e.detail && e.detail.tabId;
      markActive(tabId);
      polishSelects(tabId ? d.getElementById(tabId) : d);
    },60);
  });
  d.addEventListener('input',function(e){if(e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) e.target.classList.add('lg-touched')},true);
  w[NS]={ready:true,refresh:function(){init();}};
})(window,document);

/* PETATOE v4.3 Dashboard Chart Glass Plugin
   UI-only Chart.js plugin. Does not alter data, filters, router, or calculations. */
(function(w,d){
  'use strict';
  var NS='PETATOELiquidGlassCharts';
  if(w[NS] && w[NS].ready) return;
  function isLight(){return d.documentElement.getAttribute('data-theme')==='light' || (d.body && (d.body.classList.contains('light') || d.body.classList.contains('light-mode')));}
  function rgba(light,dark){return isLight()?light:dark;}
  function register(){
    if(!w.Chart || !w.Chart.register) return false;
    if(w.Chart.__petatoeLiquidGlassPlugin) return true;
    var plugin={
      id:'petatoeLiquidGlassChartArea',
      beforeDraw:function(chart){
        try{
          var area=chart.chartArea;
          if(!area) return;
          var canvas=chart.canvas;
          if(!canvas || !canvas.closest || !canvas.closest('#dashboard')) return;
          var ctx=chart.ctx;
          var left=area.left, top=area.top, width=area.right-area.left, height=area.bottom-area.top;
          ctx.save();
          var g=ctx.createLinearGradient(left,top,left,top+height);
          g.addColorStop(0,rgba('rgba(255,255,255,.30)','rgba(255,255,255,.070)'));
          g.addColorStop(.52,rgba('rgba(255,255,255,.16)','rgba(59,130,246,.040)'));
          g.addColorStop(1,rgba('rgba(255,255,255,.10)','rgba(139,92,246,.035)'));
          ctx.fillStyle=g;
          if(typeof ctx.roundRect==='function'){
            ctx.beginPath();ctx.roundRect(left-8,top-8,width+16,height+16,20);ctx.fill();
          }else{
            ctx.fillRect(left-8,top-8,width+16,height+16);
          }
          ctx.strokeStyle=rgba('rgba(15,23,42,.10)','rgba(255,255,255,.10)');
          ctx.lineWidth=1;
          if(typeof ctx.roundRect==='function'){
            ctx.beginPath();ctx.roundRect(left-8,top-8,width+16,height+16,20);ctx.stroke();
          }
          ctx.restore();
        }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
      }
    };
    w.Chart.register(plugin);
    w.Chart.__petatoeLiquidGlassPlugin=true;
    try{
      w.Chart.defaults.color=rgba('#1e293b','#eaf2ff');
      w.Chart.defaults.font.family='Cairo, system-ui, sans-serif';
      w.Chart.defaults.borderColor=rgba('rgba(15,23,42,.10)','rgba(226,232,240,.13)');
      if(w.Chart.defaults.plugins && w.Chart.defaults.plugins.legend && w.Chart.defaults.plugins.legend.labels){
        w.Chart.defaults.plugins.legend.labels.usePointStyle=true;
        w.Chart.defaults.plugins.legend.labels.boxWidth=12;
        w.Chart.defaults.plugins.legend.labels.boxHeight=12;
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
    return true;
  }
  function updateCharts(){
    if(!register() || !w.Chart) return;
    try{
      var instances=w.Chart.instances;
      if(instances){
        Object.keys(instances).forEach(function(k){try{instances[k].update('none')}catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",_);}});
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
  }
  function scheduleUpdate(delay){clearTimeout(scheduleUpdate._t);scheduleUpdate._t=setTimeout(updateCharts,delay||160);}
  function init(){register();scheduleUpdate(160);}
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',init); else init();
  d.addEventListener('petatoe:tabchange',function(e){if(!e.detail || e.detail.tabId==='dashboard') scheduleUpdate(180);});
  d.addEventListener('petatoe:records-updated',function(){scheduleUpdate(220);});
  w[NS]={ready:true,refresh:updateCharts};
})(window,document);

/* PETATOE v4.4 Apple Liquid Glass Enterprise UI Enhancements
   UI-only: no router/data/render wrappers or business logic changes. */
(function(w,d){
  'use strict';
  var NS='PETATOEAppleLiquidGlassFullUI';
  if(w[NS] && w[NS].ready) return;

  var toneNames=['sales','tax','transactions','customers','average','profit','reports','treasury'];
  function qa(sel,root){return Array.prototype.slice.call((root||d).querySelectorAll(sel));}
  function q(sel,root){return (root||d).querySelector(sel);}
  function safeText(el){return (el && (el.textContent||'')).trim();}

  function enhanceKpis(){
    qa('#dashboard .kpis .kpi:not(.lg-enterprise-kpi), #dashboard .summary-card:not(.lg-enterprise-kpi), #dashboard .smart-exec-kpi:not(.lg-enterprise-kpi), #dashboard .exec-kpi:not(.lg-enterprise-kpi), #dashboard .bi-kpi:not(.lg-enterprise-kpi), #dashboard .com-kpi:not(.lg-enterprise-kpi), #dashboard .pdf-kpi:not(.lg-enterprise-kpi), #dashboard .pet-dd-kpi:not(.lg-enterprise-kpi)').forEach(function(card,idx){
      card.classList.add('lg-enterprise-kpi','lg-kpi-cylinder');
      if(!card.getAttribute('data-lg-tone')) card.setAttribute('data-lg-tone', toneNames[idx % toneNames.length]);
      var icon=card.querySelector('i,.ico,.icon,.kpi-icon,.card-icon');
      if(icon) icon.classList.add('lg-icon-bubble');
      var primary=card.querySelector('b,strong,.kpi-value,.value');
      if(primary) primary.classList.add('lg-kpi-number');
      var label=card.querySelector('span,small,.label,.kpi-label');
      if(label) label.classList.add('lg-kpi-label');
      if(!card.querySelector('.lg-kpi-trend-line')){
        var line=d.createElement('span');
        line.className='lg-kpi-trend-line';
        line.setAttribute('aria-hidden','true');
        card.appendChild(line);
      }
    });
  }

  function enhanceCharts(){
    qa('#dashboard canvas:not([data-lg-chart-bound])').forEach(function(canvas){
      var holder=canvas.closest('.chart,.card,.monthly-wide-card,.payment-below-card,.chart-card,.report-chart-card') || canvas.parentElement;
      canvas.setAttribute('data-lg-chart-bound','1');
      if(holder) holder.classList.add('lg-apple-chart-panel');
    });
    qa('#dashboard .chart-head:not(.lg-apple-chart-head), #dashboard .card-title:not(.lg-apple-chart-head), .chart-head:not(.lg-apple-chart-head), .card-title:not(.lg-apple-chart-head)').forEach(function(head){
      head.classList.add('lg-apple-chart-head');
    });
  }

  function enhanceControls(){
    qa('button:not(.lg-glass-button),.btn:not(.lg-glass-button),.exp-btn:not(.lg-glass-button),.report-btn:not(.lg-glass-button),.reports-btn:not(.lg-glass-button),.pdf-btn:not(.lg-glass-button),.excel-btn:not(.lg-glass-button),.action-btn:not(.lg-glass-button)').forEach(function(el){
      el.classList.add('lg-glass-button');
    });
    qa('input:not(.lg-glass-control),select:not(.lg-glass-control),textarea:not(.lg-glass-control)').forEach(function(el){
      el.classList.add('lg-glass-control');
    });
  }

  function enhanceHeader(){
    qa('.topbar:not(.lg-sticky-glass-header),.header:not(.lg-sticky-glass-header),.app-header:not(.lg-sticky-glass-header),.main-header:not(.lg-sticky-glass-header),.pet-topbar:not(.lg-sticky-glass-header),#topbar:not(.lg-sticky-glass-header),#header:not(.lg-sticky-glass-header),header:not(.lg-sticky-glass-header)').forEach(function(el){
      el.classList.add('lg-sticky-glass-header');
    });
  }

  function enhanceSidebar(){
    qa('.sidebar:not(.lg-apple-sidebar),.side:not(.lg-apple-sidebar),.side-nav:not(.lg-apple-sidebar),.app-sidebar:not(.lg-apple-sidebar),#sidebar:not(.lg-apple-sidebar),nav.sidebar:not(.lg-apple-sidebar)').forEach(function(el){
      el.classList.add('lg-apple-sidebar');
    });
  }

  function applyAll(options){
    options=options||{};
    if(d.documentElement) d.documentElement.classList.add('petatoe-apple-liquid-glass-v44');
    if(d.body) d.body.classList.add('petatoe-enterprise-glass-body');
    enhanceHeader();
    enhanceSidebar();
    if(options.dashboardOnly){
      enhanceKpis();
      enhanceCharts();
      return;
    }
    enhanceKpis();
    enhanceCharts();
    enhanceControls();
  }

  function registerChartTheme(){
    if(!w.Chart || !w.Chart.register) return false;
    if(w.Chart.__petatoeAppleEnterpriseTheme) return true;
    var isLight=function(){
      return d.documentElement.getAttribute('data-theme')==='light' || (d.body && (d.body.classList.contains('light') || d.body.classList.contains('light-mode')));
    };
    var palette=function(){
      return isLight() ? {
        text:'#0F172A',
        muted:'#64748B',
        grid:'rgba(15,23,42,.10)',
        border:'rgba(37,99,235,.20)',
        tooltip:'rgba(255,255,255,.82)'
      } : {
        text:'#F8FAFC',
        muted:'#94A3B8',
        grid:'rgba(226,232,240,.13)',
        border:'rgba(96,165,250,.22)',
        tooltip:'rgba(18,28,45,.78)'
      };
    };
    var plugin={
      id:'petatoeAppleEnterpriseChartPolish',
      beforeDraw:function(chart){
        try{
          var canvas=chart.canvas;
          if(!canvas || !canvas.closest || !canvas.closest('#dashboard')) return;
          var area=chart.chartArea;
          if(!area) return;
          var p=palette();
          var ctx=chart.ctx;
          var x=area.left-10,y=area.top-10,wid=area.right-area.left+20,hei=area.bottom-area.top+20;
          ctx.save();
          var g=ctx.createLinearGradient(x,y,x,y+hei);
          g.addColorStop(0,isLight()?'rgba(255,255,255,.42)':'rgba(255,255,255,.075)');
          g.addColorStop(.55,isLight()?'rgba(255,255,255,.20)':'rgba(96,165,250,.040)');
          g.addColorStop(1,isLight()?'rgba(255,255,255,.14)':'rgba(167,139,250,.032)');
          ctx.fillStyle=g;
          ctx.strokeStyle=p.border;
          ctx.lineWidth=1;
          if(typeof ctx.roundRect==='function'){
            ctx.beginPath(); ctx.roundRect(x,y,wid,hei,22); ctx.fill(); ctx.stroke();
          }else{
            ctx.fillRect(x,y,wid,hei); ctx.strokeRect(x,y,wid,hei);
          }
          ctx.restore();
        }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
      }
    };
    w.Chart.register(plugin);
    w.Chart.__petatoeAppleEnterpriseTheme=true;
    try{
      var p=palette();
      w.Chart.defaults.color=p.text;
      w.Chart.defaults.borderColor=p.grid;
      w.Chart.defaults.font.family='Cairo, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      if(w.Chart.defaults.plugins && w.Chart.defaults.plugins.tooltip){
        w.Chart.defaults.plugins.tooltip.backgroundColor=p.tooltip;
        w.Chart.defaults.plugins.tooltip.titleColor=p.text;
        w.Chart.defaults.plugins.tooltip.bodyColor=p.text;
        w.Chart.defaults.plugins.tooltip.borderColor=p.border;
        w.Chart.defaults.plugins.tooltip.borderWidth=1;
        w.Chart.defaults.plugins.tooltip.cornerRadius=14;
        w.Chart.defaults.plugins.tooltip.padding=12;
        w.Chart.defaults.plugins.tooltip.displayColors=true;
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
    return true;
  }

  function refreshCharts(){
    if(!registerChartTheme() || !w.Chart) return;
    try{
      var instances=w.Chart.instances;
      if(instances){
        Object.keys(instances).forEach(function(k){try{instances[k].update('none');}catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",_);}});
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
  }

  var mo;
  function observeDashboard(){
    if(mo) return;
    var target=d.getElementById('dashboard');
    if(!target || !w.MutationObserver) return;
    mo=new MutationObserver(function(){
      clearTimeout(observeDashboard._t);
      observeDashboard._t=setTimeout(function(){enhanceKpis(); enhanceCharts();},80);
    });
    mo.observe(target,{childList:true,subtree:true});
  }

  function scheduleApply(options, delay){clearTimeout(scheduleApply._t);scheduleApply._lastOptions=options||{};scheduleApply._t=setTimeout(function(){applyAll(scheduleApply._lastOptions); if(!scheduleApply._lastOptions || !scheduleApply._lastOptions.skipCharts) refreshCharts();},delay||160);}
  function init(){
    applyAll();
    observeDashboard();
    scheduleApply({dashboardOnly:true},180);
  }

  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',init); else init();
  d.addEventListener('petatoe:tabchange',function(e){
    var tabId=e.detail && e.detail.tabId;
    scheduleApply({dashboardOnly:tabId!=='settings',skipCharts:!!(e.detail && tabId!=='dashboard')},140);
  });
  d.addEventListener('change',function(e){
    if(e && e.target && e.target.matches && e.target.matches('select,input,textarea')){
      e.target.classList.add('lg-control-touched');
      if(e.target.closest && e.target.closest('#dashboard')){ clearTimeout(refreshCharts._changeT); refreshCharts._changeT=setTimeout(refreshCharts,200); }
    }
  },true);
  w[NS]={ready:true,refresh:function(){applyAll();refreshCharts();}};
})(window,document);

/* PETATOE v4.4.11 dynamic layout resize observer */
(function(w,d){
  'use strict';
  var NS='PETATOEDynamicMenuLayoutV4411';
  if(w[NS] && w[NS].ready) return;
  function resizeCharts(){
    try{ if(typeof w.resizeChartsSafe==='function') w.resizeChartsSafe(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
    try{
      if(w.Chart && w.Chart.instances){
        Object.keys(w.Chart.instances).forEach(function(k){
          try{ w.Chart.instances[k].resize(); w.Chart.instances[k].update('none'); }catch(_e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",_e);}
        });
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
  }
  function schedule(){
    var now=Date.now();
    if(schedule._last && now-schedule._last<180) return;
    schedule._last=now;
    clearTimeout(schedule._t);
    schedule._t=setTimeout(resizeCharts,140);
  }
  function syncState(force){
    var open=!!(d.body && d.body.classList.contains('sidebar-open'));
    d.documentElement.classList.toggle('pet-sidebar-open',open);
    d.documentElement.classList.toggle('pet-sidebar-closed',!open);
    if(force || syncState._lastOpen!==open){
      syncState._lastOpen=open;
      schedule();
    }
  }
  function init(){
    if(!d.body) return;
    syncState(true);
    if(w.MutationObserver){
      var mo=new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          if(muts[i].attributeName==='class'){ syncState(false); break; }
        }
      });
      mo.observe(d.body,{attributes:true,attributeFilter:['class']});
    }
    d.addEventListener('transitionend',function(e){
      if(e && e.target && (e.target.classList.contains('main') || e.target.classList.contains('topbar') || e.target.id==='sidebar')) schedule();
    },true);
  }
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',init); else init();
  w[NS]={ready:true,refresh:function(){syncState(true);}};
})(window,document);

/* PETATOE v5.0.2 Header Launcher Stability
   UI-only: keep the real PETATOE launcher owned by the header at all times.
   Reason: moving the same button into the sidebar made it disappear/clipped in PDF/sidebar states.
   No router/data/render changes. */
(function(w,d){
  'use strict';
  var NS='PETATOEHeaderLauncherStableV502';
  if(w[NS] && w[NS].ready) return;
  var launcher, headerParent, nextSibling, placeholder;
  function ensure(){
    launcher=launcher||d.getElementById('sideLauncher');
    if(!launcher) return false;
    if(!headerParent){
      var topLeft=d.querySelector('.topbar .top-left');
      headerParent=topLeft || launcher.parentNode;
      nextSibling=launcher.nextSibling;
    }
    placeholder=d.querySelector('.petatoe-launcher-placeholder');
    return true;
  }
  function restore(force){
    if(!ensure()) return;
    var openNow=!!(d.body && d.body.classList.contains('sidebar-open'));
    if(!force && restore._lastOpen===openNow && launcher.parentNode===headerParent) return;
    restore._lastOpen=openNow;
    launcher.classList.remove('petatoe-sidebar-docked-launcher');
    launcher.style.removeProperty('position');
    launcher.style.removeProperty('top');
    launcher.style.removeProperty('right');
    launcher.style.removeProperty('left');
    launcher.style.removeProperty('bottom');
    launcher.style.removeProperty('z-index');
    if(headerParent && launcher.parentNode!==headerParent){
      try{ headerParent.insertBefore(launcher,nextSibling||headerParent.firstChild||null); }
      catch(e){ try{ headerParent.appendChild(launcher); }catch(_e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",_e);} }
    }
    try{ if(placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/liquid-glass-ui.js",e);}
    var open=openNow;
    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    launcher.title=open ? 'إغلاق القائمة الرئيسية' : 'فتح القائمة الرئيسية';
  }
  function init(){
    restore(true);
    if(w.MutationObserver && d.body){
      var mo=new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          if(muts[i].attributeName==='class'){ restore(false); break; }
        }
      });
      mo.observe(d.body,{attributes:true,attributeFilter:['class']});
    }
    d.addEventListener('click',function(e){
      var t=e && e.target;
      if(!t || !t.closest) return;
      if(t.closest('#sideLauncher,#sidebar,.sidebar,.pet-v142-toggle,[data-tab],[data-smart-open]')){
        clearTimeout(restore._clickT);
        restore._clickT=setTimeout(function(){restore(true);},50);
      }
    },true);
  }
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',init); else init();
  w[NS]={ready:true,refresh:function(){restore(true);}};
})(window,document);
