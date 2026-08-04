'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
let pass=0,total=0;
function check(ok,msg){total++;if(ok){pass++;console.log('PASS - '+msg)}else{console.error('FAIL - '+msg);process.exitCode=1}}
const engine=read('operations/operations-legacy-engine.js');
const html=read('index.html');
const css=read('css/components/appointments.css');
const catalog=read('i18n/localization-center/operations-customer-management.js');
const manifest=JSON.parse(read('config/petatoe-version.json'));
check(html.includes('id="appointmentSlot"')&&!html.includes('id="appointmentStart"')&&!html.includes('id="appointmentEnd"'),'appointment form owns one session slot field');
check(engine.includes("APPOINTMENT_SLOT_VALUES=['12:00','14:00','16:00','18:00','20:00','22:00']"),'only six certified session slots are registered');
check(engine.includes('appointmentSlotIsUnavailable(slot,date,vehicle,currentId)'),'slot availability is scoped by vehicle date and current appointment');
check(engine.includes("normalizeStatus(row.status)==='ملغي'"),'cancelled appointments release their slot');
check(engine.includes('refreshAvailableAppointmentSlots')&&html.includes('data-op-change="applyVehicleStaffAssignment,refreshAvailableAppointmentSlots"'),'vehicle and date changes refresh available slots');
check(engine.includes("start:normalizeHourValue(val('appointmentSlot'))")&&engine.includes("end:appointmentSlotEnd(val('appointmentSlot'))"),'single slot persists with backward-compatible start and derived end');
check(css.includes('html[data-theme="dark"] .appointment-customer-search-results'),'dark customer search results have an isolated theme');
check(catalog.includes("appointmentSlot:'موعد الجلسة'")&&catalog.includes("appointmentSlot:'Session Time'"),'Arabic and English slot localization is registered');
check(manifest.runtimeContracts.appointmentVehicleSlotAvailability==='10.0.25-phase-e5-2-11-vehicle-date-slot-availability-contract-1','runtime contract is registered');
console.log(`Phase E5.2.11 appointment vehicle slot and dark search: ${pass}/${total} PASSED`);
if(pass!==total)process.exit(1);
