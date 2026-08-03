/* Generated from config/petatoe-version.json. Do not edit manually. */
(function(global){
  'use strict';
  var manifest = {
  "schemaVersion": 1,
  "product": "PETATOE",
  "releaseVersion": "10.0.25",
  "releaseLabel": "v10.0.25",
  "releaseName": "PETATOE_V10_0_25_SESSION_LOGOUT_RACE_HOTFIX_E4_1",
  "buildVersion": "10.0.25-phase-e4-1-session-logout-race-hotfix-1",
  "cacheVersion": "10.0.25-phase-e4-1-session-logout-race-hotfix-1",
  "runtimeContracts": {
    "startupGate": "10.0.25-sg4-6-9-smart-reports-soft-ui-dependency-1",
    "smartReportsRegistration": "10.0.25-smart-reports-sr3-registration",
    "smartReportsReadAdapter": "10.0.25-smart-reports-sr5-4-read-adapter",
    "navigationRuntime": "10.0.25-phase-e3-previous-route-lifecycle-contract-1",
    "readinessRuntime": "10.0.25-phase7-required-optional-deferred-contract-1",
    "inventoryCountRuntime": "10.0.25-phase9-inventory-count-safety-contract-1",
    "permissionRuntime": "10.0.25-phase10-canonical-permission-key-contract-1",
    "operationsVehiclePolicy": "10.0.25-phase11-operations-vehicle-policy-contract-1",
    "commissionCalculation": "10.0.25-phase12-commission-calculation-uat-contract-1",
    "financialOperationsUAT": "10.0.25-phase13-financial-operations-uat-contract-1",
    "visualInteraction": "10.0.25-phase14-interaction-visual-contract-1",
    "securityOffline": "10.0.25-phase15-security-offline-contract-1",
    "testContracts": "10.0.25-phase16-active-ci-contract-1",
    "observability": "10.0.25-phase-b-observability-contract-1",
    "startupBootstrap": "10.0.25-phase-c1-critical-dashboard-bootstrap-contract-1",
    "dataPipeline": "10.0.25-phase-c3-coalesced-read-pipeline-contract-1",
    "warehouseSafeRender": "10.0.25-phase-c3-1-warehouse-safe-render-contract-1",
    "loaderRegistry": "10.0.25-phase-d1-loader-registry-contract-1",
    "recordsRouteHydration": "10.0.25-phase-d2-2-records-nonblocking-route-contract-1",
    "businessModuleLoading": "10.0.25-phase-d2-route-owned-business-hydration-contract-1",
    "navigationGuardRuntime": "10.0.25-phase-e2-permission-ready-route-replay-contract-1",
    "navigationLifecycle": "10.0.25-phase-e3-previous-route-lifecycle-contract-1",
    "sessionRuntime": "10.0.25-phase-e4-1-session-invalidation-epoch-contract-1"
  },
  "native": {
    "latestVersion": "10.0.0",
    "minimumSupportedVersion": "10.0.0"
  },
  "policy": {
    "releaseVersionPurpose": "User-visible product release.",
    "cacheVersionPurpose": "Browser and service-worker cache invalidation.",
    "runtimeContractPurpose": "Compatibility contract; changes only when the contract changes.",
    "manualVersionLiteralsAllowed": false
  }
};
  try{ Object.freeze(manifest.runtimeContracts); Object.freeze(manifest.native); Object.freeze(manifest); }catch(_e){}
  global.PETATOEVersionManifest = manifest;
})(typeof window !== 'undefined' ? window : globalThis);
