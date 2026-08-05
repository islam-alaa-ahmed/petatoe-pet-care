'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
let pass=0,total=0;function check(ok,msg){total++;if(ok){pass++;console.log('PASS - '+msg)}else{console.error('FAIL - '+msg);process.exitCode=1}}
const engine=read('operations/operations-legacy-engine.js');const html=read('index.html');const css=read('css/components/appointments.css');const core=read('operations/operations-core.js');const catalog=read('i18n/localization-center/operations-customer-management.js');const manifest=JSON.parse(read('config/petatoe-version.json'));
check(html.includes('data-calendar-view="timeline"')&&html.includes('data-calendar-view="month"')&&!html.includes('data-calendar-view="day"')&&!html.includes('data-calendar-view="week"'),'calendar exposes only timeline and monthly views');
check(engine.includes("var calendarView='timeline'")&&engine.includes("calendarView=view==='month'?'month':'timeline'"),'timeline is the canonical default calendar view');
check(engine.includes('renderCalendarMonth')&&engine.includes('appointments-month-grid'),'monthly calendar renderer is registered');
check(engine.includes("groupBy(activeCalendarRows(rows),'vehicle'")&&engine.includes('appointments-month-vehicle'),'monthly days summarize appointment counts by vehicle');
check(engine.includes('openCalendarDayDetails')&&engine.includes('appointments-calendar-vehicle-columns'),'day details open a vehicle-split modal');
check(engine.includes("'ar-SA-u-ca-gregory'")&&engine.includes('openCalendarAppointment'),'calendar uses Gregorian dates and opens appointments through a guarded modal action');
check(core.includes("'openCalendarDayDetails'")&&core.includes("'closeCalendarDayDetails'")&&core.includes("'openCalendarAppointment'"),'calendar detail actions are exposed by operations facade');
check(css.includes('.appointments-calendar-vehicle-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))')&&css.includes('.appointments-calendar-day-modal'),'desktop details modal splits vehicle columns');
check(catalog.includes("monthly:'التقويم الشهري'")&&catalog.includes("monthly:'Monthly Calendar'"),'Arabic and English monthly calendar localization is registered');
check(manifest.runtimeContracts.operationsMonthlyVehicleCalendar==='10.0.25-phase-e5-2-12-timeline-monthly-vehicle-details-contract-1','runtime contract is registered');
console.log(`Phase E5.2.12 operations monthly vehicle calendar: ${pass}/${total} PASSED`);if(pass!==total)process.exit(1);
