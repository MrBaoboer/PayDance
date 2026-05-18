param(
  [string]$Version = $env:GITHUB_REF_NAME,
  [string]$OutputPath = "release-notes.md"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Version)) {
  throw "Version is required. Pass -Version vX.Y.Z or set GITHUB_REF_NAME."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$readmePath = Join-Path $projectRoot "README.md"
$normalizedVersion = $Version.Trim()
if (-not $normalizedVersion.StartsWith("v")) {
  $normalizedVersion = "v$normalizedVersion"
}

$lines = Get-Content -LiteralPath $readmePath -Encoding utf8
$heading = "### $normalizedVersion"
$startIndex = [Array]::IndexOf($lines, $heading)

if ($startIndex -lt 0) {
  $fallback = @(
    "## PayDance $normalizedVersion",
    "",
    'This release was built by GitHub Actions. Download `pay-dance.exe` and verify it with `pay-dance.exe.sha256`.'
  )
  Set-Content -LiteralPath $OutputPath -Value $fallback -Encoding utf8
  Write-Host "Release notes section $heading was not found. Wrote fallback notes to $OutputPath." -ForegroundColor Yellow
  exit 0
}

$body = New-Object System.Collections.Generic.List[string]
for ($i = $startIndex + 1; $i -lt $lines.Count; $i++) {
  if ($lines[$i].StartsWith("### ")) {
    break
  }

  $body.Add($lines[$i])
}

$content = @(
  "## PayDance $normalizedVersion",
  "",
  "### Changes"
)
$content += $body.ToArray()
$content += @(
  "",
  "### Download and verification",
  "",
  '- Windows portable executable: `pay-dance.exe`',
  '- SHA256 checksum: `pay-dance.exe.sha256`',
  "- Download assets from this GitHub Release page."
)

Set-Content -LiteralPath $OutputPath -Value $content -Encoding utf8
Write-Host "Wrote release notes to $OutputPath" -ForegroundColor Green
