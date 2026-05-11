$ErrorActionPreference = "Stop"

$exePath = Join-Path $PSScriptRoot "..\src-tauri\target\release\pay-pulse.exe"
$resolvedExePath = [System.IO.Path]::GetFullPath($exePath)

if (-not (Test-Path -LiteralPath $resolvedExePath)) {
  exit 0
}

$runningProcesses = Get-Process -Name "pay-pulse" -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -eq $resolvedExePath }

if (-not $runningProcesses) {
  exit 0
}

Write-Host ""
Write-Host "pay-pulse.exe is still running, so the release build cannot overwrite it." -ForegroundColor Yellow
Write-Host "Close the app from the tray menu first, then run the build again." -ForegroundColor Yellow
Write-Host ""
Write-Host "Running process ids:" -ForegroundColor Yellow
$runningProcesses | ForEach-Object {
  Write-Host "  - $($_.Id)"
}
Write-Host ""

exit 1
