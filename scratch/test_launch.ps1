$exe = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe'
$cwd = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable'
$log = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\electron_run.log'

$p = Start-Process -FilePath $exe -ArgumentList '--enable-logging' -WorkingDirectory $cwd -RedirectStandardOutput $log -RedirectStandardError 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\electron_err.log' -PassThru
Start-Sleep -Seconds 5
Write-Host "PID: $($p.Id) | HasExited: $($p.HasExited)"
if ($p.HasExited) {
    Write-Host "ExitCode: $($p.ExitCode)"
}
if (Test-Path $log) {
    Get-Content $log -Tail 30 | Write-Host
}
if (Test-Path 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\electron_err.log') {
    Get-Content 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\electron_err.log' -Tail 30 | Write-Host
}
