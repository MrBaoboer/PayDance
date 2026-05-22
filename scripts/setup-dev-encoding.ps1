param(
  [switch] $SkipGitConfig
)

$ErrorActionPreference = "Stop"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$profileStart = "# >>> PayDance UTF-8 shell setup >>>"
$profileEnd = "# <<< PayDance UTF-8 shell setup <<<"
$profileBlock = @"
$profileStart
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new(`$false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(`$false)
`$OutputEncoding = [System.Text.UTF8Encoding]::new(`$false)
`$PSDefaultParameterValues["Get-Content:Encoding"] = "utf8"
`$PSDefaultParameterValues["Set-Content:Encoding"] = "utf8"
`$PSDefaultParameterValues["Out-File:Encoding"] = "utf8"
chcp.com 65001 | Out-Null
$profileEnd
"@

[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$PSDefaultParameterValues["Get-Content:Encoding"] = "utf8"
$PSDefaultParameterValues["Set-Content:Encoding"] = "utf8"
$PSDefaultParameterValues["Out-File:Encoding"] = "utf8"
chcp.com 65001 | Out-Null

$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path -Parent $profilePath
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

$existingProfile = ""
if (Test-Path -LiteralPath $profilePath) {
  $existingProfile = Get-Content -LiteralPath $profilePath -Raw -Encoding utf8
}

$escapedStart = [Regex]::Escape($profileStart)
$escapedEnd = [Regex]::Escape($profileEnd)
$blockPattern = "(?s)`r?`n?$escapedStart.*?$escapedEnd`r?`n?"
$nextProfile = [Regex]::Replace($existingProfile, $blockPattern, "")
if ($nextProfile.Trim().Length -gt 0) {
  $nextProfile = $nextProfile.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $profileBlock + [Environment]::NewLine
} else {
  $nextProfile = $profileBlock + [Environment]::NewLine
}

[System.IO.File]::WriteAllText($profilePath, $nextProfile, $utf8NoBom)

if (-not $SkipGitConfig) {
  git config --global core.quotepath false
  git config --global i18n.logOutputEncoding utf-8
}

Write-Host "PowerShell UTF-8 profile configured: $profilePath"
Write-Host "Current output encoding: $([Console]::OutputEncoding.WebName)"
Write-Host "Current input encoding: $([Console]::InputEncoding.WebName)"
