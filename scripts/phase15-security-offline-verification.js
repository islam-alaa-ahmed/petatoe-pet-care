#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const read = rel => fs.readFileSync(path.join(root,rel),'utf8');
const exists = rel => fs.existsSync(path.join(root,rel));
const manifest = JSON.parse(read('config/petatoe-version.json'));
const index = read('index.html');
const worker = read('service-worker.js');
const auth = read('security/auth-session.js');
const css = read('css/main.css');

const requiredSql = [
  'system_settings_rls_fix.sql',
  'petatoe_v9_phase_s3_6_password_reset_rpc.sql',
  'petatoe_v9_phase_s4_4_2_1_trusted_devices_table.sql',
  'petatoe_v9_phase_s4_5_1_user_sessions_foundation.sql',
  'petatoe_v9_phase_s4_5_7_security_audit_trail.sql',
  'petatoe_v10_s1_passkey_biometric_tables.sql'
];
const requiredFunctions = [
  'supabase/functions/petatoe-security-email/index.ts',
  'supabase/functions/petatoe-translate/index.ts'
];
const criticalShell = [
  `./runtime/version-manifest.js?v=${manifest.cacheVersion}`,
  './css/main.css',
  `./css/components/interaction-ownership.css?v=${manifest.cacheVersion}`,
  `./security/session-timeout.js?v=${manifest.cacheVersion}`,
  `./components/security-hardening.js?v=${manifest.cacheVersion}`,
  `./security/enterprise-security-hardening.js?v=${manifest.cacheVersion}`,
  `./security/security-offline-contract.js?v=${manifest.cacheVersion}`,
  `./security/password-security.js?v=${manifest.cacheVersion}`,
  `./security/auth-session.js?v=${manifest.cacheVersion}`,
  `./data/data-source.js?v=${manifest.cacheVersion}`,
  `./data/records-read-facade.js?v=${manifest.cacheVersion}`
];

const checks = [];
function check(name, ok, detail){ checks.push({name,ok:!!ok,detail:detail||''}); }
check('central cache version matches service worker', worker.includes(`const APP_VERSION = '${manifest.cacheVersion}';`));
check('security offline runtime contract is loaded', index.includes(`security/security-offline-contract.js?v=${manifest.cacheVersion}`));
check('service worker ignores cross-origin requests', /if\s*\(url\.origin\s*!==\s*self\.location\.origin\)\s*return;/.test(worker));
check('service worker never caches non-GET requests', /if\s*\(request\.method\s*!==\s*'GET'\)\s*return;/.test(worker));
criticalShell.forEach(asset=>check(`critical offline shell: ${asset}`,worker.includes(`'${asset}'`)));
requiredSql.forEach(rel=>check(`security SQL source exists: ${rel}`,exists(rel)));
requiredFunctions.forEach(rel=>check(`edge function source exists: ${rel}`,exists(rel)));
check('auth session uses sessionStorage primary record', /sessionStorage\.setItem\(key/.test(auth) && /var AUTH_KEY = 'petatoe_auth_session_v668'/.test(auth));
check('persisted auth user shape excludes password fields', /var safeUser = \{[\s\S]*?mfaVerified:/.test(auth) && !/var safeUser = \{[\s\S]*?(?:password|passwordHash|password_hash|salt)\s*:/.test(auth.match(/var safeUser = \{[\s\S]*?\n\s*\};/)[0]));
check('remote enterprise session validation exists', /action:'session_touch'/.test(auth) && /remote-revoked/.test(auth));
check('trusted device and active session APIs exist', /trusted_devices_list/.test(auth) && /active_sessions_list/.test(auth));
check('WebAuthn uses Credentials API', /navigator\.credentials\.create/.test(auth) && /navigator\.credentials\.get/.test(auth));
check('offline font fallback exists', /Cairo[^;\n]*(?:system-ui|Arial|sans-serif)/i.test(css));
const clientRoots = ['index.html','security','components','data','core','smart','sales','operations','payroll','treasury','obligations','warehouses','navigation','router','mobile','pwa','performance','inline-extracted'];
const clientFiles = [];
for(const rel of clientRoots){
  const absolute = path.join(root,rel);
  if(!fs.existsSync(absolute)) continue;
  const stat = fs.statSync(absolute);
  if(stat.isDirectory()) clientFiles.push(...walk(absolute)); else clientFiles.push(absolute);
}
check('client code contains no service role literal', !clientFiles.filter(f=>/\.(?:js|mjs|html|json)$/i.test(f)).some(f=>/SUPABASE_SERVICE_ROLE_KEY|service_role\s*[:=]/i.test(fs.readFileSync(f,'utf8'))));

const appShellMatch = worker.match(/const APP_SHELL = \[([\s\S]*?)\n\];/);
const shellUrls = appShellMatch ? [...appShellMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]) : [];
const missing = shellUrls.filter(url=>{
  if(/^https?:/i.test(url)) return false;
  const clean=url.replace(/^\.\//,'').split('?')[0];
  return clean && !exists(clean);
});
check('all local APP_SHELL assets exist', missing.length===0, missing.join(', '));

const result={
  phase:'Phase 15 — Security & Offline Verification',
  generatedAt:new Date().toISOString(),
  cacheVersion:manifest.cacheVersion,
  runtimeContract:manifest.runtimeContracts.securityOffline,
  status:checks.every(c=>c.ok)?'PASSED':'FAILED',
  checks,
  warnings:[
    'Live Supabase RLS and migration state require the read-only Phase 0.5 SQL verification against the deployed project.',
    'Chart.js, XLSX and QR generation remain online-only external capabilities; they are not required for secure authentication or base offline shell.',
    'Google Cairo is optional online enhancement; system-ui/Arial fallback is the supported offline font path.'
  ]
};
fs.mkdirSync(path.join(root,'audit/phase15'),{recursive:true});
fs.writeFileSync(path.join(root,'audit/phase15/PETATOE_PHASE15_SECURITY_OFFLINE_AUDIT.json'),JSON.stringify(result,null,2)+'\n');
console.log(`Phase 15 Security & Offline Verification: ${result.status}`);
for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'} - ${c.name}${c.detail?' — '+c.detail:''}`);
if(result.status!=='PASSED') process.exitCode=1;

function* walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) yield* walk(p); else yield p;
  }
}
