$logFile = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\realtime_run.log"
"Starting..." | Out-File $logFile

$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable\REDDOT-Workstation-OS.exe"
$pinfo.WorkingDirectory = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\app\v2.5.1\REDDOT-Workstation-OS-Portable"
$pinfo.UseShellExecute = $false
$pinfo.RedirectStandardOutput = $true
$pinfo.RedirectStandardError = $true

$p = New-Object System.Diagnostics.Process
$p.StartInfo = $pinfo

Register-ObjectEvent -InputObject $p -EventName OutputDataReceived -Action {
    if ($EventArgs.Data) {
        $EventArgs.Data | Out-File -FilePath "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\realtime_run.log" -Append
    }
} | Out-Null

Register-ObjectEvent -InputObject $p -EventName ErrorDataReceived -Action {
    if ($EventArgs.Data) {
        ("[ERR] " + $EventArgs.Data) | Out-File -FilePath "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\realtime_run.log" -Append
    }
} | Out-Null

$p.Start() | Out-Null
$p.BeginOutputReadLine()
$p.BeginErrorReadLine()

for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    if ($p.HasExited) {
        "Exited at second $i with code $($p.ExitCode)" | Out-File -FilePath $logFile -Append
        break
    } else {
        "Still running at second $i (PID $($p.Id))" | Out-File -FilePath $logFile -Append
    }
}
