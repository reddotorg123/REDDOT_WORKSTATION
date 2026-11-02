$ErrorActionPreference = 'SilentlyContinue'
$apps = Get-Process | Where-Object { $_.MainWindowTitle -ne '' -and $_.ProcessName -ne 'powershell' } | ForEach-Object {
    [PSCustomObject]@{
        name = $_.ProcessName
        exe = ($_.ProcessName + '.exe').ToLower()
        title = $_.MainWindowTitle
    }
}
if ($apps) {
    if ($apps.Count -eq 1) {
        ConvertTo-Json -Compress @($apps)
    } else {
        $apps | ConvertTo-Json -Compress
    }
} else {
    '[]'
}
