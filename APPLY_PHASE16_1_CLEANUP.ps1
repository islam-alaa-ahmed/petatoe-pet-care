$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$candidates = @(
    $scriptDir,
    (Split-Path -Parent $scriptDir),
    (Get-Location).Path
) | Select-Object -Unique

$repoRoot = $null
foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath (Join-Path $candidate 'index.html')) {
        $repoRoot = $candidate
        break
    }
}

if (-not $repoRoot) {
    throw 'PETATOE repository root was not found. Place this folder inside the project or copy its contents beside index.html.'
}

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

$repoChecker = Join-Path $repoRoot 'scripts/phase16-production-contract-check.js'
$bundledChecker = Join-Path $scriptDir 'scripts/phase16-production-contract-check.js'

if (-not (Test-Path -LiteralPath $repoChecker)) {
    if (-not (Test-Path -LiteralPath $bundledChecker)) {
        throw 'Phase 16 production contract checker is missing from both the repository and this package.'
    }
    $repoScripts = Join-Path $repoRoot 'scripts'
    New-Item -ItemType Directory -Path $repoScripts -Force | Out-Null
    Copy-Item -LiteralPath $bundledChecker -Destination $repoChecker -Force
    Write-Host 'Restored: scripts/phase16-production-contract-check.js' -ForegroundColor Green
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
Write-Host 'Open GitHub Desktop, confirm the deletions, then commit and push.' -ForegroundColor Yellow
