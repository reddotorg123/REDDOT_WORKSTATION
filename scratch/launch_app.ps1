$exe = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe'
$cwd = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable'

$p = Start-Process -FilePath $exe -WorkingDirectory $cwd -PassThru
Start-Sleep -Seconds 4
Write-Host "PID: $($p.Id)"
Get-Process -Id $p.Id | Select-Object Id, ProcessName, Responding, StartTime
