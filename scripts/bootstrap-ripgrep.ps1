param(
  [switch]$PersistUserPath
)

$ErrorActionPreference = "Stop"

$toolRoot = Join-Path $PSScriptRoot "..\.tools\ripgrep"
$rgPath = Join-Path $toolRoot "rg.exe"
$version = "14.1.1"
$archiveName = "ripgrep-$version-x86_64-pc-windows-msvc.zip"
$downloadUrl = "https://github.com/BurntSushi/ripgrep/releases/download/$version/$archiveName"
$archivePath = Join-Path $env:TEMP $archiveName

if (Test-Path -LiteralPath $rgPath) {
  if ($PersistUserPath) {
    $resolvedToolRoot = [System.IO.Path]::GetFullPath($toolRoot)
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathParts = @($userPath -split ";" | Where-Object { $_ -and $_ -ne $resolvedToolRoot })
    [Environment]::SetEnvironmentVariable("Path", (($resolvedToolRoot) + ";" + ($pathParts -join ";")).TrimEnd(";"), "User")
    Write-Host "Prepended $resolvedToolRoot to the user PATH." -ForegroundColor Green
  }

  & $rgPath --version
  exit 0
}

New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null

Write-Host "Downloading ripgrep $version..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath

$extractRoot = Join-Path $env:TEMP "ripgrep-$version"
if (Test-Path -LiteralPath $extractRoot) {
  Remove-Item -LiteralPath $extractRoot -Recurse -Force
}

Expand-Archive -LiteralPath $archivePath -DestinationPath $extractRoot -Force
$downloadedRg = Get-ChildItem -LiteralPath $extractRoot -Recurse -Filter "rg.exe" | Select-Object -First 1
if (-not $downloadedRg) {
  throw "rg.exe was not found in $archiveName"
}

Copy-Item -LiteralPath $downloadedRg.FullName -Destination $rgPath -Force
Remove-Item -LiteralPath $archivePath -Force
Remove-Item -LiteralPath $extractRoot -Recurse -Force

Write-Host "Installed ripgrep to $rgPath" -ForegroundColor Green
if ($PersistUserPath) {
  $resolvedToolRoot = [System.IO.Path]::GetFullPath($toolRoot)
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $pathParts = @($userPath -split ";" | Where-Object { $_ -and $_ -ne $resolvedToolRoot })
  [Environment]::SetEnvironmentVariable("Path", (($resolvedToolRoot) + ";" + ($pathParts -join ";")).TrimEnd(";"), "User")
  Write-Host "Prepended $resolvedToolRoot to the user PATH." -ForegroundColor Green
}
& $rgPath --version
