$apiKey = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk'
$projectId = 'reddot-workspace'
$orgId = 'reddot'

# 1. Delete duplicate doc pavithratech1206
$urlP = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/organizations/$orgId/members/pavithratech1206?key=$apiKey"
try {
    $resP = Invoke-RestMethod -Uri $urlP -Method Delete
    Write-Host "Deleted pavithratech1206 duplicate successfully."
} catch {
    Write-Host "pavithratech1206 delete note: $($_.Exception.Message)"
}

# 2. Delete duplicate doc RD-FOUNDER-001
$urlF = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/organizations/$orgId/members/RD-FOUNDER-001?key=$apiKey"
try {
    $resF = Invoke-RestMethod -Uri $urlF -Method Delete
    Write-Host "Deleted RD-FOUNDER-001 duplicate successfully."
} catch {
    Write-Host "RD-FOUNDER-001 delete note: $($_.Exception.Message)"
}

# 3. Verify remaining documents in Firestore
$urlAll = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/organizations/$orgId/members?key=$apiKey"
$resAll = Invoke-RestMethod -Uri $urlAll -Method Get
Write-Host "Remaining Firestore members count: $($resAll.documents.Count)"
foreach ($doc in $resAll.documents) {
    $name = $doc.name.Split('/')[-1]
    $role = $doc.fields.role.stringValue
    $email = $doc.fields.email.stringValue
    $disp = $doc.fields.displayName.stringValue
    Write-Host "Doc: $name | Email: $email | Name: $disp | Role: $role"
}
