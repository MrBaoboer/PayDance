param(
  [string] $Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

function Join-Codepoints([int[]] $Codes) {
  return -join ($Codes | ForEach-Object { [char] $_ })
}

$blockedTerms = @(
  ("salary" + "-ticker"),
  ("Pay" + "Pulse"),
  ("Labor-Wage" + "-Live-Calc"),
  (Join-Codepoints @(0x793E, 0x755C)),
  (Join-Codepoints @(0x8BA1, 0x7B97, 0x5668)),
  (Join-Codepoints @(0x9AD8, 0x7EA7, 0x725B, 0x9A6C))
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
      foreach ($term in $blockedTerms) {
        if ($lines[$index].Contains($term)) {
          $findings.Add(("{0}:{1}: blocked legacy wording [{2}]" -f $file, ($index + 1), $term))
        }
      }
    }
  }

  if ($findings.Count -gt 0) {
    Write-Error ("Legacy product wording found:`n{0}" -f ($findings -join "`n"))
    exit 1
  }

  Write-Host "Brand hygiene check passed."
} finally {
  Pop-Location
}
