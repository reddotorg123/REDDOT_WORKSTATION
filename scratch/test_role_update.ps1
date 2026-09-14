$apiKey = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk'
$projectId = 'reddot-workspace'
$orgId = 'reddot'
$targetDoc = 'Yp9Rm1HggQYJYMDc6x8e7DFxRyR2'

# Test updating role to 'Lead Embedded Systems Architect'
$newRole = 'Lead Embedded Systems Architect'
$newDept = 'Hardware Architecture'
$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$patchUrl = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/organizations/$orgId/members/$targetDoc`?updateMask.fieldPaths=role&updateMask.fieldPaths=dept&updateMask.fieldPaths=updatedAt&key=$apiKey"
$body = @{
    fields = @{
        role = @{ stringValue = $newRole }
        dept = @{ stringValue = $newDept }
        updatedAt = @{ integerValue = [string]$now }
    }
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri $patchUrl -Method Patch -Body $body -ContentType "application/json"
Write-Host ($res | ConvertTo-Json -Depth 5)
