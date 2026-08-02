$ErrorActionPreference = 'Stop'

Write-Host 'PETATOE Phase 16.2 - Git-tracked production cleanup' -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$startPoints = @((Get-Location).Path, $scriptDir, (Split-Path -Parent $scriptDir)) | Select-Object -Unique
$repoRoot = $null

foreach ($start in $startPoints) {
    try {
        $candidate = (& git -C $start rev-parse --show-toplevel 2>$null).Trim()
        if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate 'index.html'))) {
            $repoRoot = $candidate
            break
        }
    } catch {}
}

if (-not $repoRoot) {
    throw 'Git repository root was not found. Copy this package inside the PETATOE repository, or open PowerShell in the repository root and run the script again.'
}

Write-Host "Repository root: $repoRoot" -ForegroundColor DarkCyan

$targets = @(
    'index-css-control-test.html',
    'index-css-fontless-test.html',
    'maintenance/navigation-permissions.js'
)

Push-Location $repoRoot
try {
    foreach ($target in $targets) {
        $tracked = (& git ls-files --error-unmatch -- $target 2>$null)
        if ($LASTEXITCODE -eq 0 -and $tracked) {
            & git rm -f -- $target
            if ($LASTEXITCODE -ne 0) { throw "git rm failed for $target" }
            Write-Host "Git deletion staged: $target" -ForegroundColor Green
        } elseif (Test-Path -LiteralPath $target) {
            Remove-Item -LiteralPath $target -Force
            Write-Host "Removed untracked file: $target" -ForegroundColor Green
        } else {
            Write-Host "Already absent: $target" -ForegroundColor DarkGray
        }
    }

    foreach ($target in $targets) {
        if (Test-Path -LiteralPath $target) {
            throw "Cleanup verification failed: $target still exists"
        }
    }

    if (-not (Test-Path -LiteralPath 'scripts/phase16-production-contract-check.js')) {
        throw 'Missing scripts/phase16-production-contract-check.js. Apply the Phase 16 package first.'
    }

    Write-Host 'Running Phase 16 production contract check...' -ForegroundColor Cyan
    & node 'scripts/phase16-production-contract-check.js'
    if ($LASTEXITCODE -ne 0) {
        throw "Phase 16 production contract check failed with exit code $LASTEXITCODE"
    }

    Write-Host ''
    Write-Host 'Git status for required deletions:' -ForegroundColor Cyan
    & git status --short -- $targets

    $status = (& git status --porcelain=v1 -- $targets) -join "`n"
    foreach ($target in $targets) {
        $escaped = [Regex]::Escape($target)
        if ($status -notmatch "(?m)^D\s+$escaped$" -and $status -notmatch "(?m)^\sD\s+$escaped$") {
            $trackedNow = (& git ls-files -- $target)
            if ($trackedNow) {
                throw "Git is not recording the required deletion for $target"
            }
        }
    }

    Write-Host ''
    Write-Host 'Phase 16.2 passed. Open GitHub Desktop and verify the three files appear as Deleted, then commit and push.' -ForegroundColor Green
} finally {
    Pop-Location
}
