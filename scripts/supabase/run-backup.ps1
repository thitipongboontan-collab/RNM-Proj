$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LogDir = Join-Path $ProjectRoot "backups\logs"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LogFile = Join-Path $LogDir "backup-$Timestamp.log"

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

Set-Location $ProjectRoot

Write-Host "Starting backup at $Timestamp"
npm run supabase:backup *>&1 | Tee-Object -FilePath $LogFile
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
  Write-Host "Backup finished successfully. Log: $LogFile"
} else {
  Write-Host "Backup finished with warnings/errors. Log: $LogFile"
}

exit $exitCode
