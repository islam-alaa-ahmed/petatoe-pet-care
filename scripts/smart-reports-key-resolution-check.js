const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=path.resolve(__dirname,'..');
const context={window:{dispatchEvent(){}},CustomEvent:function(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'i18n/localization-center/dictionary-store.js'),'utf8'),context);
const store=context.window.PETATOE_LOCALIZATION_CENTER_STORE;
const required=[
  'smartReportsSource.tabs.overview',
  'smartReportsSource.tabs.sales',
  'smartReportsSource.tabs.vehicles',
  'smartReportsSource.tabs.customers',
  'smartReportsSource.tabs.services',
  'smartReportsSource.tabs.advanced',
  'smartReportsSource.filters.allYears',
  'smartReportsSource.filters.year',
  'smartReportsSource.overview.totalSales',
  'smartReportsSource.overview.invoiceCount',
  'smartReportsSource.overview.customerRetention',
  'smartReportsSource.overview.averageInvoice',
  'smartReportsSource.overview.topVehicle',
  'smartReportsSource.overview.bestService',
  'smartReportsSource.vehicleEfficiency.title',
  'smartReportsSource.vehicleEfficiency.allPayments',
  'smartReportsSource.vehicleEfficiency.allVehicles',
  'smartReportsSource.vehicleEfficiency.allMonths',
  'smartReportsSource.vehicleEfficiency.total',
  'smartReportsSource.vehicles.details',
  'smartReportsSource.vehicles.monthlySales',
  'smartReportsSource.metrics.sales'
];
const failures=[];
for(const lang of ['ar','en']){
  for(const key of required){
    const value=store.getPath(lang,key);
    if(typeof value!=='string'||!value.trim()||value===key) failures.push(`${lang}: ${key}`);
  }
}
const pack=store.getPath('en','smartReportsSource')||{};
const flatCount=Object.keys(pack).length;
if(flatCount<600) failures.push(`Unexpected Smart Reports pack size: ${flatCount}`);
if(failures.length){
  console.error('Smart Reports Key Resolution: FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('Smart Reports Key Resolution: PASSED');
console.log(JSON.stringify({requiredKeys:required.length,languages:2,smartReportsEntriesPerLanguage:flatCount,visibleKeyFallbacks:0},null,2));
