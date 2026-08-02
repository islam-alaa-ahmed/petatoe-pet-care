param(
    [string]$RepositoryPath = ''
)

$ErrorActionPreference = 'Stop'
Write-Host 'PETATOE Phase 16.3 - Robust Git cleanup' -ForegroundColor Cyan

function Test-PetatoeRepo([string]$PathValue) {
    if (-not $PathValue) { return $false }
    try {
        $full = [System.IO.Path]::GetFullPath($PathValue)
        if (-not (Test-Path -LiteralPath $full -PathType Container)) { return $false }
        $top = (& git -C $full rev-parse --show-toplevel 2>$null).Trim()
        if (-not $top) { return $false }
        return (Test-Path -LiteralPath (Join-Path $top 'index.html')) -and
               (Test-Path -LiteralPath (Join-Path $top 'scripts/phase16-production-contract-check.js'))
    } catch { return $false }
}

function Resolve-PetatoeRepo([string]$InitialPath) {
    $candidates = New-Object System.Collections.Generic.List[string]
    if ($InitialPath) { $candidates.Add($InitialPath) }

    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $current = (Get-Location).Path
    $candidates.Add($scriptDir)
    $candidates.Add($current)

    foreach ($seed in @($scriptDir, $current)) {
        $p = $seed
        for ($i = 0; $i -lt 6 -and $p; $i++) {
            $candidates.Add($p)
            $parent = Split-Path -Parent $p
            if ($parent -eq $p) { break }
            $p = $parent
        }
    }

    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        if (Test-PetatoeRepo $candidate) {
            return (& git -C $candidate rev-parse --show-toplevel).Trim()
        }
    }

    # Search nested folders below likely roots. This handles repositories nested
    # inside an extracted package folder.
    foreach ($base in @($scriptDir, (Split-Path -Parent $scriptDir), $current) | Select-Object -Unique) {
        if (-not (Test-Path -LiteralPath $base -PathType Container)) { continue }
        try {
            $gitFolders = Get-ChildItem -LiteralPath $base -Directory -Force -Recurse -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -eq '.git' } |
                Select-Object -First 20
            foreach ($gitFolder in $gitFolders) {
                $repo = Split-Path -Parent $gitFolder.FullName
                if (Test-PetatoeRepo $repo) { return $repo }
            }
        } catch {}
    }

    return $null
}

$repoRoot = Resolve-PetatoeRepo $RepositoryPath
while (-not $repoRoot) {
    Write-Host ''
    Write-Host 'لم يتم العثور تلقائياً على مستودع PETATOE.' -ForegroundColor Yellow
    Write-Host 'انسخ المسار الكامل للمجلد الذي يحتوي على index.html و .git ثم اضغط Enter.' -ForegroundColor Yellow
    $manual = Read-Host 'Repository path'
    if (-not $manual) { throw 'Repository path was not provided.' }
    $repoRoot = Resolve-PetatoeRepo $manual
    if (-not $repoRoot) {
        Write-Host 'المسار غير صحيح أو لا يحتوي على مستودع Git وملفات Phase 16.' -ForegroundColor Red
    }
}

Write-Host "Repository root: $repoRoot" -ForegroundColor Green
$targets = @(
    'index-css-control-test.html',
    'index-css-fontless-test.html',
    'maintenance/navigation-permissions.js'
)

Push-Location $repoRoot
try {
    foreach ($target in $targets) {
        $tracked = (& git ls-files -- $target) -join ''
        if ($tracked) {
            & git rm -f -- $target
            if ($LASTEXITCODE -ne 0) { throw "git rm failed for $target" }
            Write-Host "Staged deletion: $target" -ForegroundColor Green
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

    Write-Host ''
    Write-Host 'Running Phase 16 production contract check...' -ForegroundColor Cyan
    & node 'scripts/phase16-production-contract-check.js'
    if ($LASTEXITCODE -ne 0) {
        throw "Phase 16 production contract check failed with exit code $LASTEXITCODE"
    }

    Write-Host ''
    Write-Host 'Git status:' -ForegroundColor Cyan
    & git status --short -- $targets

    foreach ($target in $targets) {
        $stillTracked = (& git ls-files -- $target) -join ''
        if ($stillTracked) { throw "Git still tracks $target after cleanup" }
    }

    Write-Host ''
    Write-Host 'PHASE 16.3 PASSED' -ForegroundColor Green
    Write-Host 'Open GitHub Desktop, verify the three Deleted entries, then commit and push.' -ForegroundColor Green
} finally {
    Pop-Location
}
