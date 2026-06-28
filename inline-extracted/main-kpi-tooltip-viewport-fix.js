// MAIN_DASHBOARD_KPI_TOOLTIP_VIEWPORT_SAFE_FIX
// Applies only to homepage KPI cards; smart reports tooltip behavior remains unchanged.
(function(){
  /* v3.11.10: using global clamp */
  function positionMainKpiTooltip(btn){
    const kpi=btn && btn.closest && btn.closest('.kpis .kpi');
    if(!kpi) return;
    const tip=kpi.querySelector('.kpi-tooltip');
    if(!tip) return;
    tip.classList.add('main-kpi-viewport-tooltip');
    tip.classList.remove('flip');

    // Temporarily make it measurable while keeping it invisible to the eye.
    const oldVis=tip.style.visibility, oldOp=tip.style.opacity, oldTrans=tip.style.transform;
    tip.style.visibility='hidden';
    tip.style.opacity='0';
    tip.style.transform='translateY(0) scale(1)';

    const rect=btn.getBoundingClientRect();
    const vw=window.innerWidth || document.documentElement.clientWidth;
    const vh=window.innerHeight || document.documentElement.clientHeight;
    const gap=12;
    const margin=12;
    let tw=tip.offsetWidth || Math.min(310, vw-24);
    let th=tip.offsetHeight || 210;

    let left=rect.left + rect.width/2 - tw/2;
    left=clamp(left, margin, Math.max(margin, vw - tw - margin));
    let top=rect.bottom + gap;

    if(top + th + margin > vh){
      top=rect.top - th - gap;
      tip.classList.add('flip');
    }
    top=clamp(top, margin, Math.max(margin, vh - th - margin));

    const arrowLeft=clamp(rect.left + rect.width/2 - left - 7, 18, Math.max(18, tw - 32));
    tip.style.setProperty('--tip-left', left+'px');
    tip.style.setProperty('--tip-top', top+'px');
    tip.style.setProperty('--tip-arrow-left', arrowLeft+'px');

    tip.style.visibility=oldVis;
    tip.style.opacity=oldOp;
    tip.style.transform=oldTrans;
  }

  document.addEventListener('mouseover', function(e){
    const btn=e.target.closest && e.target.closest('.kpis .kpi-info-btn');
    if(btn) positionMainKpiTooltip(btn);
  }, true);
  document.addEventListener('focusin', function(e){
    const btn=e.target.closest && e.target.closest('.kpis .kpi-info-btn');
    if(btn) positionMainKpiTooltip(btn);
  }, true);
  window.addEventListener('resize', function(){
    const btn=document.querySelector('.kpis .kpi-info-btn:hover, .kpis .kpi-info-btn:focus');
    if(btn) positionMainKpiTooltip(btn);
  });
})();