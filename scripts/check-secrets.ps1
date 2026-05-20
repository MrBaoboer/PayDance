param(
  [string] $Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$self = (Resolve-Path $PSCommandPath).Path
$secretPatterns = @(
  ("sk-" + "[A-Za-z0-9_-]{20,}"),
  ("(?i)(api[_-]?key|token|secret)\s*[:=]\s*['""]?[A-Za-z0-9_\-]{16,}"),
  ("BEGIN [A-Z ]*PRIVATE KEY")
)
$sensitiveFilePatterns = @(
  "(^|/)\.env$",
  "(^|/)\.env\.",
  "\.pem$",
  "\.p12$",
  "\.pfx$"
)
$binaryExtensions = @(
  ".bmp",
  ".dll",
  ".exe",
  ".ico",
  ".jpg",
  ".jpeg",
  ".msi",
  ".png",
  ".webp"
)

Push-Location $Root
try {
  $files = git ls-files --cached --others --exclude-standard
  $findings = New-Object System.Collections.Generic.List[string]

  foreach ($file in $files) {
    $normalizedFile = $file -replace "\\", "/"
    if (-not (Test-Path -LiteralPath $file)) {
      continue
    }

    $fullPath = (Resolve-Path -LiteralPath $file).Path

    if ($fullPath -eq $self) {
      continue
    }

    foreach ($pattern in $sensitiveFilePatterns) {
      if ($normalizedFile -match $pattern) {
        $findings.Add(("{0}: sensitive file should not be tracked" -f $file))
      }
    }

    $extension = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
    if ($binaryExtensions -contains $extension) {
      continue
    }

    try {
      $lines = @(Get-Content -LiteralPath $file -Encoding UTF8)
    } catch {
      continue
    }

    for ($index = 0; $index -lt $lines.Count; $index += 1) {
      foreach ($pattern in $secretPatterns) {
        if ($lines[$index] -match $pattern) {
          $findings.Add(("{0}:{1}: possible secret matched [{2}]" -f $file, ($index + 1), $Matches[0]))
        }
      }
    }
  }

  if ($findings.Count -gt 0) {
    Write-Error ("Possible secrets found:`n{0}" -f ($findings -join "`n"))
    exit 1
  }

  Write-Host "Secret hygiene check passed."
} finally {
  Pop-Location
}
