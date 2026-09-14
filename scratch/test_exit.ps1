$proc = [System.Diagnostics.Process]::Start("d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe")
Write-Host "Started PID: $($proc.Id)"
Start-Sleep -Seconds 2
Write-Host "HasExited: $($proc.HasExited)"
if ($proc.HasExited) {
    Write-Host "ExitCode: $($proc.ExitCode)"
}
