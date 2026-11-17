param(
  [ValidateSet("install", "remove", "status", "run")]
  [string]$Action = "install",
  [string]$Time = "02:00"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$TaskName = "RNM-Proj Supabase Backup"
$LogDir = Join-Path $ProjectRoot "backups\logs"
$RunnerScript = Join-Path $ProjectRoot "scripts\supabase\run-backup.ps1"

function Ensure-LogDir {
  if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
  }
}

switch ($Action) {
  "install" {
    Ensure-LogDir
    $actionArg = New-ScheduledTaskAction `
      -Execute "powershell.exe" `
      -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RunnerScript`""

    $triggerArg = New-ScheduledTaskTrigger -Daily -At $Time
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries

    Register-ScheduledTask `
      -TaskName $TaskName `
      -Action $actionArg `
      -Trigger $triggerArg `
      -Settings $settings `
      -Description "Daily Supabase SQL backup for RNM-Proj" `
      -Force | Out-Null

    Write-Host "Installed scheduled task '$TaskName' daily at $Time"
    Write-Host "Logs: $LogDir"
  }

  "remove" {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed scheduled task '$TaskName'"
  }

  "status" {
    Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue |
      Format-List TaskName, State, Description
  }

  "run" {
    Ensure-LogDir
    & $RunnerScript
  }
}
