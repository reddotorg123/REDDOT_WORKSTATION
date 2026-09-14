$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*REDDOT*" -or $_.CommandLine -like "*wallpaper-desktop-app*" }
foreach ($p in $procs) {
    Write-Host "PID: $($p.ProcessId) | ParentPID: $($p.ParentProcessId) | Name: $($p.Name) | CommandLine: $($p.CommandLine)"
}
if (!$procs) {
    Write-Host "No process matching REDDOT or wallpaper-desktop-app found via WMI."
}
