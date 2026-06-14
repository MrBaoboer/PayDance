# SPDX-FileCopyrightText: 2026 Mr.Baoboer
# SPDX-License-Identifier: AGPL-3.0-only
#
# Additional terms: see /legal/ADDITIONAL_TERMS.md

param(
  [Parameter(Mandatory = $true)]
  [string]$ExePath,
  [int]$StartupTimeoutSeconds = 25,
  [int]$StableSeconds = 10
)

$ErrorActionPreference = "Stop"
$resolvedExe = (Resolve-Path -LiteralPath $ExePath).Path
$smokeRoot = Join-Path $env:RUNNER_TEMP "paydance-exe-smoke"
$env:APPDATA = Join-Path $smokeRoot "Roaming"
$env:LOCALAPPDATA = Join-Path $smokeRoot "Local"
New-Item -ItemType Directory -Force -Path $env:APPDATA, $env:LOCALAPPDATA | Out-Null

$primary = $null
$secondary = $null

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

  Write-Host "Windows EXE smoke passed: main window, stable runtime, single-instance."
}
finally {
  foreach ($process in @($secondary, $primary)) {
    if ($null -ne $process) {
      $process.Refresh()
      if (-not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
      }
    }
  }
}
