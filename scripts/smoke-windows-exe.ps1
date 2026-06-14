# SPDX-FileCopyrightText: 2026 Mr.Baoboer
# SPDX-License-Identifier: AGPL-3.0-only
#
# Additional terms: see /legal/ADDITIONAL_TERMS.md

param(
  [Parameter(Mandatory = $true)]
  [string]$ExePath,
  [int]$StartupTimeoutSeconds = 25,
  [int]$StableSeconds = 10,
  [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"
$resolvedExe = (Resolve-Path -LiteralPath $ExePath).Path
$smokeRoot = Join-Path $env:RUNNER_TEMP "paydance-exe-smoke"
if (-not $ReportPath) {
  $ReportPath = Join-Path $smokeRoot "report.json"
}
$resolvedReportPath = [System.IO.Path]::GetFullPath($ReportPath)
$reportDirectory = Split-Path -Parent $resolvedReportPath
$env:APPDATA = Join-Path $smokeRoot "Roaming"
$env:LOCALAPPDATA = Join-Path $smokeRoot "Local"
New-Item -ItemType Directory -Force -Path $env:APPDATA, $env:LOCALAPPDATA, $reportDirectory | Out-Null

$primary = $null
$secondary = $null
$report = [ordered]@{
  status = "running"
  executable = $resolvedExe
  startedAt = (Get-Date).ToUniversalTime().ToString("o")
  startupTimeoutSeconds = $StartupTimeoutSeconds
  stableSeconds = $StableSeconds
  mainWindowHandle = 0
  responding = $false
  singleInstance = $false
}

try {
  Write-Host "Starting PayDance smoke target: $resolvedExe"
  $primary = Start-Process -FilePath $resolvedExe -PassThru
  $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)

  do {
    Start-Sleep -Milliseconds 250
    $primary.Refresh()
    if ($primary.HasExited) {
      throw "PayDance exited during startup with code $($primary.ExitCode)."
    }
  } while ($primary.MainWindowHandle -eq 0 -and (Get-Date) -lt $deadline)

  if ($primary.MainWindowHandle -eq 0) {
    throw "PayDance did not create a main window within $StartupTimeoutSeconds seconds."
  }
  $report.mainWindowHandle = $primary.MainWindowHandle.ToInt64()
  $report.responding = $primary.Responding
  if (-not $report.responding) {
    throw "PayDance created a main window but is not responding."
  }

  Write-Host "Main window detected. Verifying stable runtime for $StableSeconds seconds."
  Start-Sleep -Seconds $StableSeconds
  $primary.Refresh()
  if ($primary.HasExited) {
    throw "PayDance exited before the stability window completed."
  }

  Write-Host "Starting a second process to verify single-instance behavior."
  $secondary = Start-Process -FilePath $resolvedExe -PassThru
  if (-not $secondary.WaitForExit(10000)) {
    throw "The second PayDance process did not exit; single-instance enforcement failed."
  }

  $primary.Refresh()
  if ($primary.HasExited) {
    throw "The primary PayDance process exited during the single-instance check."
  }

  $report.status = "passed"
  $report.primaryProcessId = $primary.Id
  $report.secondaryExitCode = $secondary.ExitCode
  $report.singleInstance = $true
  $report.completedAt = (Get-Date).ToUniversalTime().ToString("o")
  Write-Host "Windows EXE smoke passed: main window, stable runtime, single-instance."
}
catch {
  $report.status = "failed"
  $report.error = $_.Exception.Message
  $report.completedAt = (Get-Date).ToUniversalTime().ToString("o")
  throw
}
finally {
  $report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $resolvedReportPath -Encoding utf8
  Write-Host "Windows EXE smoke report: $resolvedReportPath"

  foreach ($process in @($secondary, $primary)) {
    if ($null -ne $process) {
      $process.Refresh()
      if (-not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
      }
    }
  }
}
