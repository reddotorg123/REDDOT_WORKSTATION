$target = 'd:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe'
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $target
$psi.WorkingDirectory = [System.IO.Path]::GetDirectoryName($target)
$psi.UseShellExecute = $true
$p = [System.Diagnostics.Process]::Start($psi)
Start-Sleep -Seconds 3
Write-Host "Spawned PID: $($p.Id) | Responding: $($p.Responding)"
