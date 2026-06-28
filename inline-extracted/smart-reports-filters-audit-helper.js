/* PETATOE v5.1.63 Phase 4.1 - Smart Reports filters and active highlight audit helper */
window.PETATOEPhase41FiltersAudit=function(){
  const activeTab=(document.querySelector('#smartTabs .smart-pill.active')||{}).dataset?.smartTab || null;
  return {
    ok:true,
    activeTab,
    monthlyTrendTaxMode:window.smartMonthlyTrendTaxMode || (typeof smartMonthlyTrendTaxMode!=='undefined'?smartMonthlyTrendTaxMode:null),
    quarterlyTaxMode:window.smartSalesTaxMode || (typeof smartSalesTaxMode!=='undefined'?smartSalesTaxMode:null),
    quarterlyCustomCompare:!!window.smartQuarterCustomCompare || (typeof smartQuarterCustomCompare!=='undefined'?!!smartQuarterCustomCompare:false),
    heatmapYear:window.smartHeatmapYear,
    heatmapVan:window.smartHeatmapVan || 'all',
    targetYear:window.smartTargetYear,
    targetPeriod:window.smartTargetPeriod,
    overviewCardsYear:window.smartOverviewCardsYear,
    vehicleEfficiencyFilters:window.smartVehicleEfficiencyFilters || null,
    activeButtons:Array.from(document.querySelectorAll('.smart-tab-section[style*="block"] .active,.smart-tab-section.active .active')).map(function(el){return (el.textContent||'').trim().slice(0,60)})
  };
};