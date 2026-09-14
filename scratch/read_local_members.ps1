$dbPath = "$env:APPDATA\reddot-workstation-os\reddot_storage\reddot_database.json"
if (Test-Path $dbPath) {
    $lines = Get-Content -Path $dbPath
    $inMembers = $false
    foreach ($line in $lines) {
        if ($line -match '"members"\s*:\s*\{') { $inMembers = $true }
        if ($inMembers) {
            if ($line -match '"(name|displayName|role|dept|id|email)"\s*:\s*"([^"]+)"') {
                Write-Host $line.Trim()
            }
            if ($line -match '^\s*\},?\s*$') {
                Write-Host "---"
            }
            if ($line -match '^\s*"tasks"\s*:\s*\[') { break }
        }
    }
}
