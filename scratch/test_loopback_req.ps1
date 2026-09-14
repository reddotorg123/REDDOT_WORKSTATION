$url = 'http://127.0.0.1:56419/'
try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing
    Write-Host "Status: $($r.StatusCode) | Length: $($r.Content.Length)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
