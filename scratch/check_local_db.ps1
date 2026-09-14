$dbPath = "$env:APPDATA\reddot-workstation-os\reddot_storage\reddot_database.json"
if (Test-Path $dbPath) {
    $raw = Get-Content -Path $dbPath -Raw
    $json = ConvertFrom-Json $raw
    Write-Host "Local DB Members Count: $($json.members.PSObject.Properties.Name.Count)"
    foreach ($prop in $json.members.PSObject.Properties) {
        $m = $prop.Value
        Write-Host "Key: $($prop.Name) | Name: $($m.name) | Role: $($m.role) | Dept: $($m.dept) | Email: $($m.email)"
    }
} else {
    Write-Host "Local DB not found at $dbPath"
}
