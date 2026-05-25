$env:Path = "C:\Program Files\Git\bin;C:\Program Files\GitHub CLI;" + $env:Path
$Gh = "C:\Program Files\GitHub CLI\gh.exe"
Set-Location $PSScriptRoot

function Test-GhAuth {
  & $Gh auth status 1>$null 2>$null
  return ($LASTEXITCODE -eq 0)
}

Write-Host "Checking GitHub CLI login..." -ForegroundColor Cyan

if (-not (Test-GhAuth)) {
  Write-Host ""
  Write-Host "Please complete GitHub login in your browser." -ForegroundColor Yellow
  Write-Host "When prompted, choose: GitHub.com -> HTTPS -> Login with a web browser" -ForegroundColor Yellow
  Write-Host ""
  & $Gh auth login -h github.com -p https -w
  if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub login failed. Please run this script again." -ForegroundColor Red
    exit 1
  }
}

if (-not (Test-GhAuth)) {
  Write-Host "Still not logged in. Please run: gh auth login" -ForegroundColor Red
  exit 1
}

Write-Host "Creating repository and pushing to GitHub..." -ForegroundColor Cyan

if (git remote get-url origin 2>$null) {
  Write-Host "Remote 'origin' already exists. Pushing to existing remote..." -ForegroundColor Yellow
  git push -u origin main
} else {
  & $Gh repo create RNM-Proj --public --source=. --remote=origin --push
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed. If the repo name is taken, try a different name." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Done! Repository URL:" -ForegroundColor Green
& $Gh repo view --json url -q .url
