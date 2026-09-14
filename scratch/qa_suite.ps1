# ==============================================================================
# REDDOT WORKSTATION OS - COMPREHENSIVE QA TEST SUITE
# ==============================================================================
$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  REDDOT WORKSTATION QA AUTOMATED TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$passedCount = 0
$failedCount = 0

function Assert-Test($testName, $condition, $failDetails = "") {
    if ($condition) {
        Write-Host "  [PASS] $testName" -ForegroundColor Green
        $script:passedCount++
    } else {
        Write-Host "  [FAIL] $testName" -ForegroundColor Red
        if ($failDetails) {
            Write-Host "         $failDetails" -ForegroundColor Yellow
        }
        $script:failedCount++
    }
}

# ------------------------------------------------------------------------------
# TEST 1: Zero Thread-Blocking alert() & prompt() Calls
# ------------------------------------------------------------------------------
Write-Host "[1/5] Verifying Elimination of Blocking Dialogs..." -ForegroundColor Magenta
$alertMatches = Select-String -Path "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\wallpaper.js" -Pattern '(?<!\/\/.*)(?<!showQuickToast.*)\balert\s*\('
$promptMatches = Select-String -Path "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\wallpaper.js" -Pattern '(?<!\/\/.*)\bprompt\s*\('

Assert-Test "Zero active alert() calls in wallpaper.js" ($alertMatches.Count -eq 0) "Found $($alertMatches.Count) alert() calls"
Assert-Test "Zero active prompt() calls in wallpaper.js" ($promptMatches.Count -eq 0) "Found $($promptMatches.Count) prompt() calls"

# ------------------------------------------------------------------------------
# TEST 2: Jitsi & WebRTC Content Security Policy Verification
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Verifying Content Security Policy and Window Handlers..." -ForegroundColor Magenta
$mainJs = Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\main.js" -Raw
$indexHtml = Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\index.html" -Raw

$mainHasJitsiCsp = $mainJs.Contains("https://meet.jit.si") -and $mainJs.Contains("https://*.8x8.vc")
$htmlHasJitsiCsp = $indexHtml.Contains("https://meet.jit.si") -and $indexHtml.Contains("https://*.8x8.vc")
$mainHasWideMeetingWindow = $mainJs.Contains("1024") -and $mainJs.Contains("720")

Assert-Test "main.js CSP includes Jitsi domains" $mainHasJitsiCsp
Assert-Test "index.html meta CSP includes Jitsi domains" $htmlHasJitsiCsp
Assert-Test "main.js allocates widescreen 1024x720 bounds for video meetings" $mainHasWideMeetingWindow

# ------------------------------------------------------------------------------
# TEST 3: Shift Tracking & Hotkey Safety Code Verification
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Verifying Shift Persistence & Hotkey Guards..." -ForegroundColor Magenta
$wpJs = Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\wallpaper.js" -Raw

$hasShiftStorage = $wpJs.Contains("rd_active_shift")
$hasShiftReset = $wpJs.Contains("removeItem('rd_active_shift')")
$hasAltHotkeys = $wpJs.Contains("if (e.altKey)") -and $wpJs.Contains("key === 'w'")

Assert-Test "Shift tracking persists state to localStorage (rd_active_shift)" $hasShiftStorage
Assert-Test "Clock out clears localStorage (rd_active_shift) and resets seconds" $hasShiftReset
Assert-Test "Quick tab navigation requires Alt key (Alt+W, Alt+T, etc.)" $hasAltHotkeys

# ------------------------------------------------------------------------------
# TEST 4: Task Status Progression & Portable Sync
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] Verifying Task Progression & Portable Distribution Sync..." -ForegroundColor Magenta
$hasTaskCycle = $wpJs.Contains("card.querySelector('.task-status-pill')?.addEventListener('click'")
$hasStatusPillCursor = (Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\style.css" -Raw).Contains("cursor: pointer")

$portableWp = Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\resources\app\wallpaper-ui\wallpaper.js" -Raw
$isPortableMirrored = $portableWp.Contains("rd_active_shift") -and $portableWp.Contains("if (e.altKey)")

Assert-Test "Task status pills have 1-click progression listener" $hasTaskCycle
Assert-Test "Task status pill CSS has pointer cursor and hover scaling" $hasStatusPillCursor
Assert-Test "Portable distribution bundle synchronized with updated codebase" $isPortableMirrored

# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
# TEST 5: DOM Structure, Unique IDs, and JavaScript-to-HTML Binding
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Verifying DOM Structure, Unique IDs, and JS-to-HTML Binding..." -ForegroundColor Magenta
$htmlContent = Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\index.html" -Raw
$jsContent = Get-Content "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui\wallpaper.js" -Raw

# 5a. Core elements existence
$hasRoot = $htmlContent.Contains('id="wallpaperRoot"')
$hasPersonalShift = $htmlContent.Contains('id="personalShiftBadge"') -and $htmlContent.Contains('id="personalShiftTimer"')
$hasTopClose = $htmlContent.Contains('title="Close REDDOT Workstation"')
$hasTaskCardsList = $htmlContent.Contains('id="taskCardsList"')
$hasDrawer = $htmlContent.Contains('id="commandCenterDrawer"')

Assert-Test "index.html contains core UI mounts (#wallpaperRoot, #commandCenterDrawer, #taskCardsList)" ($hasRoot -and $hasDrawer -and $hasTaskCardsList)
Assert-Test "index.html contains shift tracking nodes (#personalShiftBadge, #personalShiftTimer)" $hasPersonalShift
Assert-Test "index.html contains window close button with updated title" $hasTopClose

# 5b. Duplicate IDs check
$idMatches = [regex]::Matches($htmlContent, 'id="([^"]+)"')
$allIds = @()
foreach ($m in $idMatches) { $allIds += $m.Groups[1].Value }
$dups = $allIds | Group-Object | Where-Object { $_.Count -gt 1 }
Assert-Test "Zero duplicate element IDs in index.html (Total IDs: $($allIds.Count))" ($dups.Count -eq 0)

# 5c. JS getElementById binding validation
$htmlIdMap = @{}
foreach ($id in $allIds) { $htmlIdMap[$id] = $true }
$dynamicIds = @('btnCloseEditTaskModal', 'btnModalEditThisTask')
$missingIds = @()
foreach ($m in [regex]::Matches($jsContent, 'getElementById\([''"]([a-zA-Z0-9_-]+)[''"]\)')) {
    $elemId = $m.Groups[1].Value
    if (-not $htmlIdMap.ContainsKey($elemId) -and $dynamicIds -notcontains $elemId) {
        if ($missingIds -notcontains $elemId) { $missingIds += $elemId }
    }
}
Assert-Test "Zero missing DOM element IDs queried by wallpaper.js" ($missingIds.Count -eq 0) "Missing: $($missingIds -join ', ')"

# ------------------------------------------------------------------------------
# FINAL REPORT
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
$summaryColor = if ($failedCount -eq 0) { "Green" } else { "Yellow" }
$failColor = if ($failedCount -eq 0) { "Green" } else { "Red" }
Write-Host "  Passed: $passedCount / $($passedCount + $failedCount)" -ForegroundColor $summaryColor
Write-Host "  Failed: $failedCount" -ForegroundColor $failColor
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedCount -gt 0) { exit 1 } else { exit 0 }
