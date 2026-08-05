#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const desktop=fs.readFileSync(path.join(root,'navigation/navigation.js'),'utf8');
const mobile=fs.readFileSync(path.join(root,'mobile/mobile-enterprise-v10-shell.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/petatoe-version.json'),'utf8'));
const checks=[
 ['desktop and mobile share one canonical accordion state owner',desktop.includes('window.PETATOENavigationAccordionState')&&mobile.includes('window.PETATOENavigationAccordionState')],
 ['desktop group toggles no longer close sibling groups',desktop.includes('setGroupOpen(nav,id,!navAccordion.isOpen(id),true)')&&!desktop.includes('closeOpen(nav,')],
 ['desktop rebuild restores every open group from shared state',desktop.includes("function syncOpenGroups(nav)")&&desktop.includes("navAccordion.isOpen(id)")],
 ['permission and active-state refreshes preserve explicit user choices',desktop.includes('if(groupId) navAccordion.ensureOpen(groupId)')&&desktop.includes('explicit user collapse/open always wins')],
 ['desktop group toggles expose stable aria expanded state',desktop.includes("toggle.setAttribute('aria-expanded',open?'true':'false')")],
 ['mobile drawer group toggles persist through the shared owner',mobile.includes("setSectionOpen(section,!section.classList.contains('open'),{persist:true})")],
 ['mobile permission or schema rerenders restore open sections',mobile.includes("desiredSectionOpen(group.id,active,!!q)")&&mobile.includes("petatoe:navigationaccordionchange")],
 ['mobile and desktop allow multiple groups to remain open simultaneously',!desktop.includes("g.classList.toggle('open',open);\n      var ar")&&desktop.includes("qa('.pet-v142-group',nav).forEach")&&mobile.includes("navAccordion.set(id,!!open")],
 ['mobile shell uses the current release cache token',fs.readFileSync(path.join(root,'index.html'),'utf8').includes('mobile/mobile-enterprise-v10-shell.js?v='+manifest.cacheVersion)],
 ['runtime unified navigation accordion contract is registered',manifest.runtimeContracts&&manifest.runtimeContracts.unifiedNavigationAccordion==='10.0.25-phase-e5-2-13-unified-navigation-accordion-state-contract-1']
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' - '+name);if(!ok)failed++;}
console.log(`Phase E5.2.13 unified navigation accordion state: ${checks.length-failed}/${checks.length} PASSED`);
process.exit(failed?1:0);
