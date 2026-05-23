param(
  [string]$Version = $env:GITHUB_REF_NAME,
  [string]$OutputPath = "release-notes.md"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Version)) {
  throw "Version is required. Pass -Version vX.Y.Z or set GITHUB_REF_NAME."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$changelogPath = Join-Path $projectRoot "CHANGELOG.md"
$normalizedVersion = $Version.Trim()
if (-not $normalizedVersion.StartsWith("v")) {
  $normalizedVersion = "v$normalizedVersion"
}

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string[]]$Value
  )

  $absolutePath = [System.IO.Path]::GetFullPath($Path)
  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllLines($absolutePath, $Value, $utf8NoBom)
}

$lines = Get-Content -LiteralPath $changelogPath -Encoding utf8
$heading = "### $normalizedVersion"
$startIndex = [Array]::IndexOf($lines, $heading)

if ($startIndex -lt 0) {
  $fallback = @(
    "## PayDance $normalizedVersion",
    "",
    'This release was built by GitHub Actions. Download `pay-dance.exe` and verify it with `pay-dance.exe.sha256`.'
  )
  Write-Utf8NoBom -Path $OutputPath -Value $fallback
  Write-Host "Release notes section $heading was not found in CHANGELOG.md. Wrote fallback notes to $OutputPath." -ForegroundColor Yellow
  exit 0
}

$body = New-Object System.Collections.Generic.List[string]
for ($i = $startIndex + 1; $i -lt $lines.Count; $i++) {
  if ($lines[$i].StartsWith("### ")) {
    break
  }

  $body.Add($lines[$i])
}

while ($body.Count -gt 0 -and [string]::IsNullOrWhiteSpace($body[0])) {
  $body.RemoveAt(0)
}

while ($body.Count -gt 0 -and [string]::IsNullOrWhiteSpace($body[$body.Count - 1])) {
  $body.RemoveAt($body.Count - 1)
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
  "- Download assets from this GitHub Release page.",
  '- If a `.sha256` file is provided, verify the executable before running it.'
)

Write-Utf8NoBom -Path $OutputPath -Value $content
Write-Host "Wrote release notes from CHANGELOG.md to $OutputPath" -ForegroundColor Green
