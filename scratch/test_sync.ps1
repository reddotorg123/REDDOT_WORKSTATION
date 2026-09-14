$exe = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe'
$cwd = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable'

$p = Start-Process -FilePath $exe -ArgumentList '--enable-logging' -WorkingDirectory $cwd -PassThru -Wait
Write-Host "ExitCode: $($p.ExitCode)"
