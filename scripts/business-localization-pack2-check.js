'use strict';
const fs=require('fs');
const path=require('path');
function read(file){return fs.readFileSync(path.join(process.cwd(),file),'utf8');}
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exitCode=1;}}
const business=read('i18n/business-data-localization.js');
const c360=read('inline-extracted/customer360-runtime-data-binding-fix.js');
const index=read('index.html');
[
  'vehicleStatus:Object.freeze',
  'vehicleType:Object.freeze',
  'customerCategory:Object.freeze',
  'renderRecord:renderRecord',
  'renderList:renderList'
].forEach(token=>assert(business.includes(token),`missing business renderer token: ${token}`));
[
  "business('customer',raw)",
  "business('service',raw)",
  "business('vehicle',raw)",
  "business('payment',raw)",
  "petatoe:language-changed"
].forEach(token=>assert(c360.includes(token),`Customer360 is not routed through business localization: ${token}`));
assert(/business-data-localization\.js\?v=[^"']+/.test(index),'business localization script is missing a cache-busting version');
assert(/customer360-runtime-data-binding-fix\.js\?v=[^"']+/.test(index),'Customer360 localization script is missing a cache-busting version');
if(!process.exitCode) console.log('Business Localization Pack 2 Check: Passed');
