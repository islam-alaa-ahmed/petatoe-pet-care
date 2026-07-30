const fs = require('fs');

function read(path){ return fs.readFileSync(path, 'utf8'); }
function assert(ok, message){
  if(!ok){ console.error('FAIL:', message); process.exitCode = 1; }
  else console.log('PASS:', message);
}

const nav = read('navigation/navigation.js');
const controller = read('router/navigation-controller.js');
const state = read('navigation/navigation-state.js');
const ops = read('operations/operations-legacy-engine.js');

assert(!/setTimeout\(function\(\)\{[\s\S]{0,700}PETATOEAppointments\.setTab\(appointmentsSubTab\)[\s\S]{0,200}\},80\)/.test(nav), 'navigation no longer uses the 80ms appointments sub-tab race');
assert(nav.includes("appointmentsSubTab:appointmentsSubTab"), 'canonical navigation passes appointments sub-route intent');
assert(controller.includes("appointmentsSubTab:intent.appointmentsSubTab"), 'router event carries appointmentsSubTab');
assert(controller.includes("window.__PETATOE_APPOINTMENTS_NAV_INTENT__=intent.appointmentsSubTab"), 'router persists pending appointments intent for late module readiness');
assert(ops.includes("setTab(requestedSubTab)"), 'appointments listener applies the requested sub-route exactly once');
assert(!ops.includes("Master data sidebar entry still switches to master after this event via navigation.js"), 'legacy forced-add collision contract removed');
assert(state.includes("appointmentsSubTab:s.panel==='appointments'?(s.appointmentsTab||'add')"), 'navigation-state restore passes the saved appointments sub-route');
assert(!state.includes("appointment state restore skipped"), 'delayed duplicate appointments restore path removed');
assert(ops.includes("petatoe:appointments-ready"), 'appointments runtime publishes readiness after API registration');

if(process.exitCode) process.exit(process.exitCode);
