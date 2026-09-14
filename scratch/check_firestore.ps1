$apiKey = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk'
$url = "https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/members?key=$apiKey"
try {
    $res = Invoke-RestMethod -Uri $url -Method Get
    Write-Host "Response received. Keys:" ($res | Get-Member -MemberType NoteProperty).Name
    if ($res.documents) {
        Write-Host "Documents count: $($res.documents.Count)"
        foreach ($doc in $res.documents) {
            Write-Host "Doc: $($doc.name)"
            Write-Host ($doc.fields | ConvertTo-Json -Compress)
        }
    } else {
        Write-Host "No documents found in organizations/reddot/members."
        Write-Host ($res | ConvertTo-Json -Depth 3)
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
