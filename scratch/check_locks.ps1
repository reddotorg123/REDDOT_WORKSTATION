$procs = Get-Process -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    try {
        if ($p.Path -and $p.Path -like "*wallpaper-desktop-app*") {
            Write-Host "LOCKED BY: PID $($p.Id) | $($p.ProcessName) | $($p.Path)"
        }
    } catch {}
}
