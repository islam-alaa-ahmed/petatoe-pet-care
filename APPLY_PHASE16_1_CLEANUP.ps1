$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$targets = @(
    'index-css-control-test.html',
    'index-css-fontless-test.html',
    'maintenance/navigation-permissions.js'
)

Write-Host 'PETATOE Phase 16.1 - Production Artifact Cleanup' -ForegroundColor Cyan
Write-Host "Repository root: $repoRoot"

foreach ($relativePath in $targets) {
    $fullPath = Join-Path $repoRoot $relativePath
    if (Test-Path -LiteralPath $fullPath) {
        Remove-Item -LiteralPath $fullPath -Force
        Write-Host "Deleted: $relativePath" -ForegroundColor Green
    } else {
        Write-Host "Already absent: $relativePath" -ForegroundColor DarkGray
    }
}

$checker = Join-Path $repoRoot 'scripts/phase16-production-contract-check.js'
if (-not (Test-Path -LiteralPath $checker)) {
    throw 'scripts/phase16-production-contract-check.js was not found. Apply Phase 16 first.'
}

Write-Host 'Running Phase 16 production contract check...' -ForegroundColor Cyan
Push-Location $repoRoot
try {
    & node 'scripts/phase16-production-contract-check.js'
    if ($LASTEXITCODE -ne 0) {
        throw "Phase 16 production contract check failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

Write-Host 'Phase 16.1 cleanup completed successfully.' -ForegroundColor Green
Write-Host 'Open GitHub Desktop, confirm the three deletions, then commit and push.' -ForegroundColor Yellow
