$sourceDir = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\wallpaper-ui"
$destDir = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\resources\app\wallpaper-ui"

$files = Get-ChildItem -Path $sourceDir -File
foreach ($f in $files) {
    $destFile = Join-Path $destDir $f.Name
    if (Test-Path $destFile) {
        $h1 = (Get-FileHash $f.FullName).Hash
        $h2 = (Get-FileHash $destFile).Hash
        if ($h1 -ne $h2) {
            Write-Host "DIFF: $($f.Name) differs between source and portable!"
        } else {
            Write-Host "MATCH: $($f.Name)"
        }
    } else {
        Write-Host "MISSING in dest: $($f.Name)"
    }
}
