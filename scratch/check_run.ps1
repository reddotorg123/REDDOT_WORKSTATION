$proc = Start-Process -FilePath "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe" -WorkingDirectory "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable" -PassThru
Start-Sleep -Seconds 2
if ($proc.HasExited) {
    Write-Host "Process exited with code: $($proc.ExitCode)"
} else {
    Write-Host "Process is RUNNING with PID: $($proc.Id)"
}
