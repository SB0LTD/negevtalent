# Query all applications from Firestore (production).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\query-applications.ps1

$token = cmd /c "gcloud auth print-access-token 2>nul"

$body = @{
  structuredQuery = @{
    from    = @(@{ collectionId = "applications" })
    orderBy = @(@{ field = @{ fieldPath = "createdAt" }; direction = "DESCENDING" })
    limit   = 100
  }
} | ConvertTo-Json -Depth 10

$resp = Invoke-RestMethod -Method POST `
  -Uri "https://firestore.googleapis.com/v1/projects/negevtalent/databases/(default)/documents:runQuery" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body

$count = 0
foreach ($r in $resp) {
  $d = $r.document.fields
  if ($d) {
    $count++
    Write-Host "─────────────────────────────────────────"
    Write-Host "#$count  $($d.name.stringValue)"
    Write-Host "  טלפון:    $($d.phone.stringValue)"
    Write-Host "  אימייל:   $($d.email.stringValue)"
    Write-Host "  ת.ז:      $($d.idNum.stringValue)"
    Write-Host "  לידה:     $($d.birthdate.stringValue)"
    Write-Host "  מגדר:     $($d.gender.stringValue)"
    Write-Host "  עיר:      $($d.city.stringValue)"
    Write-Host "  ניסיון:   $($d.background.stringValue)"
    Write-Host "  נשלח:     $($d.createdAt.stringValue)"
  }
}
Write-Host "─────────────────────────────────────────"
Write-Host "סה""כ הרשמות: $count"
