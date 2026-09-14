$conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalAddress -eq '127.0.0.1' -and $_.LocalPort -gt 40000 }
foreach ($c in $conns) {
    try {
        $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "Port: $($c.LocalPort) | PID: $($c.OwningProcess) | Process: $($p.ProcessName)"
    } catch {}
}
