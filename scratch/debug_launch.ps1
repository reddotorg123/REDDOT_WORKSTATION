$logOut = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\proc_out.log"
$logErr = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\proc_err.log"

$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe"
$pinfo.WorkingDirectory = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable"
$pinfo.UseShellExecute = $false
$pinfo.RedirectStandardOutput = $true
$pinfo.RedirectStandardError = $true

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $pinfo
$p.Start() | Out-Null

Start-Sleep -Seconds 6

$out = $p.StandardOutput.ReadToEnd()
$err = $p.StandardError.ReadToEnd()

Set-Content -Path $logOut -Value $out
Set-Content -Path $logErr -Value $err

Write-Host "HasExited: $($p.HasExited)"
if ($p.HasExited) {
    Write-Host "ExitCode: $($p.ExitCode)"
}
