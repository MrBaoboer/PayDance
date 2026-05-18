$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$packagePath = Join-Path $projectRoot "package.json"
$tauriPath = Join-Path $projectRoot "src-tauri\tauri.conf.json"
$cargoPath = Join-Path $projectRoot "src-tauri\Cargo.toml"

$packageVersion = (Get-Content -LiteralPath $packagePath -Raw -Encoding utf8 | ConvertFrom-Json).version
$tauriVersion = (Get-Content -LiteralPath $tauriPath -Raw -Encoding utf8 | ConvertFrom-Json).version
$cargoMatch = Select-String -LiteralPath $cargoPath -Pattern '^version\s*=\s*"([^"]+)"' | Select-Object -First 1

if (-not $cargoMatch) {
  throw "Could not read package version from $cargoPath"
}

$cargoVersion = $cargoMatch.Matches[0].Groups[1].Value
$versions = [ordered]@{
  "package.json" = $packageVersion
  "src-tauri/tauri.conf.json" = $tauriVersion
  "src-tauri/Cargo.toml" = $cargoVersion
}

$uniqueVersions = @($versions.Values | Sort-Object -Unique)
if ($uniqueVersions.Count -ne 1) {
  Write-Host "Version mismatch detected:" -ForegroundColor Red
  foreach ($entry in $versions.GetEnumerator()) {
    Write-Host "  $($entry.Key): $($entry.Value)" -ForegroundColor Red
  }
  exit 1
}

$tagName = $env:GITHUB_REF_NAME
if ($tagName -and $tagName.StartsWith("v")) {
  $expectedTag = "v$packageVersion"
  if ($tagName -ne $expectedTag) {
    Write-Host "Tag $tagName does not match project version $expectedTag." -ForegroundColor Red
    exit 1
  }
}

Write-Host "Version consistency verified: $packageVersion" -ForegroundColor Green
