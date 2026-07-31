#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const gate = fs.readFileSync(path.join(root, 'performance/mobile-startup-loading-gate.js'), 'utf8');
const failures = [];
function requireText(text, label){ if(!gate.includes(text)) failures.push(label); }
function forbidText(text, label){ if(gate.includes(text)) failures.push(label); }
requireText("window.PETATOECards", 'reportsUI requires cards renderer');
requireText("window.PETATOEFiltersEvents", 'reportsUI requires filters event layer');
requireText("window.PETATOEExport", 'reportsUI requires export layer');
forbidText("window.PETATOEReports || typeof window.renderReports", 'reportsUI no longer accepts partial OR readiness');
requireText("window.__PETATOE_SALES_IMPORT_ENGINE_SINGLETON__ === true", 'sales requires import engine');
requireText("window.PETATOESalesInvoiceReport && typeof window.PETATOESalesInvoiceReport.render === 'function'", 'sales requires invoice report runtime');
requireText("window.__PETATOE_INVOICE_MANUAL_MULTI_ITEMS_SINGLETON__ === true", 'sales requires manual-items runtime');
forbidText("window.PETATOESales || window.PETATOESalesInvoiceReport", 'sales no longer accepts partial OR readiness');
requireText("typeof window.petatoeExportActivePagePdf === 'function'", 'printing requires full-page export');
requireText("window.PETATOE_FULL_PAGE_PDF_EXPORT_READY === true", 'printing requires export ready marker');
forbidText("window.PETATOEPDF || typeof window.petatoeRefreshPdfReport", 'printing no longer accepts partial OR readiness');
requireText("window.__PETATOE_SETTINGS_CORE_BOOTED__ === true", 'settings requires core boot marker');
requireText("window.PETATOEUsersModule && typeof window.PETATOEUsersModule.renderUsersBody === 'function'", 'settings requires users module');
requireText("window.PETATOEPermissions && typeof window.PETATOEPermissions.renderPermissionsBody === 'function'", 'settings requires permissions module');
requireText("window.PETATOESetup && typeof window.PETATOESetup.renderSetupBody === 'function'", 'settings requires setup module');
requireText("window.PETATOEBackup && typeof window.PETATOEBackup.renderBackupBody === 'function'", 'settings requires backup module');
const status = failures.length ? 'FAILED' : 'PASSED';
console.log(`SG-4.4 Readiness Contracts Hardening: ${status}`);
console.log(JSON.stringify({status, checks: 16, failures}, null, 2));
process.exit(failures.length ? 1 : 0);
