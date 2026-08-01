/* Generated from config/petatoe-version.json. Do not edit manually. */
(function(global){
  'use strict';
  var manifest = {
  "schemaVersion": 1,
  "product": "PETATOE",
  "releaseVersion": "10.0.25",
  "releaseLabel": "v10.0.25",
  "releaseName": "PETATOE_V10_0_25_PERMISSION_KEY_INTEGRITY_PHASE10",
  "buildVersion": "10.0.25-phase10-permission-key-integrity-1",
  "cacheVersion": "10.0.25-phase10-permission-key-integrity-1",
  "runtimeContracts": {
    "startupGate": "10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1",
    "smartReportsRegistration": "10.0.25-smart-reports-sr3-registration",
    "smartReportsReadAdapter": "10.0.25-smart-reports-sr5-4-read-adapter",
    "navigationRuntime": "10.0.25-phase6-navigation-intent-contract-1",
    "readinessRuntime": "10.0.25-phase7-required-optional-deferred-contract-1",
    "inventoryCountRuntime": "10.0.25-phase9-inventory-count-safety-contract-1",
    "permissionRuntime": "10.0.25-phase10-canonical-permission-key-contract-1"
  },
  "native": {
    "latestVersion": "10.0.0",
    "minimumSupportedVersion": "10.0.0"
  }
};
  try{ Object.freeze(manifest.runtimeContracts); Object.freeze(manifest.native); Object.freeze(manifest); }catch(_e){}
  global.PETATOEVersionManifest = manifest;
})(typeof window !== 'undefined' ? window : globalThis);
