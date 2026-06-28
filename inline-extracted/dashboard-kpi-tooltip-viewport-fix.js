(function(){
  if(window.__PETATOE_DASHBOARD_KPI_TOOLTIP_VIEWPORT_FIX_BOUND__) return;
  window.__PETATOE_DASHBOARD_KPI_TOOLTIP_VIEWPORT_FIX_BOUND__ = true;
  /* v3.11.10: using global clamp */

  function getActiveMainBtn(){
    return document.querySelector('.panel#dashboard.active .kpis .kpi-info-btn:hover, .panel#dashboard.active .kpis .kpi-info-btn:focus, .panel#dashboard.active .kpis .kpi-info-btn.tooltip-active');
  }

  function positionMainKpiTooltip(btn){
    if(!btn || !btn.closest) return;
    var kpi = btn.closest('#dashboard .kpis .kpi');
    if(!kpi) return;
    var tip = kpi.querySelector('.kpi-tooltip');
    if(!tip) return;

    tip.classList.add('main-kpi-viewport-tooltip');
    tip.classList.remove('flip');

    // measure safely while not showing it visually
    var oldVisibility = tip.style.visibility;
    var oldOpacity = tip.style.opacity;
    var oldTransform = tip.style.transform;
    var oldDisplay = tip.style.display;
    tip.style.visibility = 'hidden';
    tip.style.opacity = '0';
    tip.style.transform = 'none';
    tip.style.display = 'block';

    var rect = btn.getBoundingClientRect();
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var margin = 14;
    var gap = 12;
    var tw = tip.offsetWidth || Math.min(310, vw - margin*2);
    var th = tip.offsetHeight || 220;

    // Default: center on icon, then clamp fully inside viewport
    var left = rect.left + rect.width/2 - tw/2;
    left = clamp(left, margin, Math.max(margin, vw - tw - margin));

    // Prefer below icon; if it would go outside screen, show above it
    var top = rect.bottom + gap;
    if(top + th + margin > vh){
      top = rect.top - th - gap;
      tip.classList.add('flip');
    }
    top = clamp(top, margin, Math.max(margin, vh - th - margin));

    var arrowLeft = clamp(rect.left + rect.width/2 - left - 7, 18, Math.max(18, tw - 32));
    tip.style.setProperty('--tip-left', left + 'px');
    tip.style.setProperty('--tip-top', top + 'px');
    tip.style.setProperty('--tip-arrow-left', arrowLeft + 'px');

    tip.style.visibility = oldVisibility;
    tip.style.opacity = oldOpacity;
    tip.style.transform = oldTransform;
    tip.style.display = oldDisplay;
  }

  function petBlock3457_activate(btn){
    if(!btn) return;
    document.querySelectorAll('#dashboard .kpis .kpi-info-btn.tooltip-active').forEach(function(x){
      if(x !== btn) x.classList.remove('tooltip-active');
    });
    btn.classList.add('tooltip-active');
    positionMainKpiTooltip(btn);
  }

  document.addEventListener('mouseover', function(e){
    var btn = e.target.closest && e.target.closest('#dashboard .kpis .kpi-info-btn');
    if(btn) petBlock3457_activate(btn);
  }, true);

  document.addEventListener('focusin', function(e){
    var btn = e.target.closest && e.target.closest('#dashboard .kpis .kpi-info-btn');
    if(btn) petBlock3457_activate(btn);
  }, true);

  document.addEventListener('mouseout', function(e){
    var btn = e.target.closest && e.target.closest('#dashboard .kpis .kpi-info-btn');
    if(btn) btn.classList.remove('tooltip-active');
  }, true);

  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('#dashboard .kpis .kpi-info-btn');
    if(btn){
      petBlock3457_activate(btn);
    }else{
      document.querySelectorAll('#dashboard .kpis .kpi-info-btn.tooltip-active').forEach(function(x){x.classList.remove('tooltip-active');});
    }
  }, true);

  var repositionScheduled=false;
  function scheduleActiveMainKpiTooltip(){
    if(repositionScheduled) return;
    repositionScheduled=true;
    requestAnimationFrame(function(){
      repositionScheduled=false;
      var btn = getActiveMainBtn();
      if(btn) positionMainKpiTooltip(btn);
    });
  }

  ['resize','scroll'].forEach(function(evt){
    window.addEventListener(evt, scheduleActiveMainKpiTooltip, true);
  });
})();