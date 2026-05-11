$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $projectRoot "marketing-posters"
$iconPath = Join-Path $projectRoot "src-tauri\icons\icon.png"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$script:CanvasW = 1600
$script:CanvasH = 1200

function New-PosterColor {
  param(
    [Parameter(Mandatory = $true)][string]$Hex,
    [int]$Alpha = 255
  )

  $clean = $Hex.TrimStart("#")
  $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function New-PosterFont {
  param(
    [string]$Family = "Microsoft YaHei UI",
    [float]$Size,
    [string]$Style = "Regular"
  )

  $fontStyle = [System.Enum]::Parse([System.Drawing.FontStyle], $Style)
  return [System.Drawing.Font]::new($Family, $Size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundedPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [float]$R
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  if ($R -le 0) {
    $path.AddRectangle([System.Drawing.RectangleF]::new($X, $Y, $W, $H))
    return $path
  }

  $R = [Math]::Min($R, [Math]::Min($W, $H) / 2)
  $d = $R * 2
  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundedRect {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [float]$R,
    [System.Drawing.Color]$Color
  )

  $brush = [System.Drawing.SolidBrush]::new($Color)
  $path = New-RoundedPath $X $Y $W $H $R
  $G.FillPath($brush, $path)
  $path.Dispose()
  $brush.Dispose()
}

function Stroke-RoundedRect {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [float]$R,
    [System.Drawing.Color]$Color,
    [float]$Width = 2
  )

  $pen = [System.Drawing.Pen]::new($Color, $Width)
  $path = New-RoundedPath $X $Y $W $H $R
  $G.DrawPath($pen, $path)
  $path.Dispose()
  $pen.Dispose()
}

function Draw-Shadow {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [float]$R,
    [string]$Hex = "000000",
    [int]$Strength = 28
  )

  for ($i = 7; $i -ge 1; $i--) {
    $alpha = [Math]::Max(2, [int]($Strength / ($i + 1)))
    Fill-RoundedRect $G ($X - $i) ($Y + $i * 3) ($W + $i * 2) ($H + $i * 2) ($R + $i) (New-PosterColor $Hex $alpha)
  }
}

function Draw-TextBlock {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Text,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [System.Drawing.Font]$Font,
    [System.Drawing.Color]$Color,
    [string]$Align = "Near",
    [string]$LineAlign = "Near",
    [switch]$NoWrap
  )

  $brush = [System.Drawing.SolidBrush]::new($Color)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Enum]::Parse([System.Drawing.StringAlignment], $Align)
  $format.LineAlignment = [System.Enum]::Parse([System.Drawing.StringAlignment], $LineAlign)
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  if ($NoWrap) {
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
  }
  $rect = [System.Drawing.RectangleF]::new($X, $Y, $W, $H)
  $G.DrawString($Text, $Font, $brush, $rect, $format)
  $format.Dispose()
  $brush.Dispose()
}

function Draw-Line {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X1,
    [float]$Y1,
    [float]$X2,
    [float]$Y2,
    [System.Drawing.Color]$Color,
    [float]$Width = 2
  )
  $pen = [System.Drawing.Pen]::new($Color, $Width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $G.DrawLine($pen, $X1, $Y1, $X2, $Y2)
  $pen.Dispose()
}

function Draw-GradientBackground {
  param(
    [System.Drawing.Graphics]$G,
    [string]$From,
    [string]$To,
    [float]$Angle = 45
  )

  $rect = [System.Drawing.RectangleF]::new(0, 0, $script:CanvasW, $script:CanvasH)
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, (New-PosterColor $From), (New-PosterColor $To), $Angle)
  $G.FillRectangle($brush, $rect)
  $brush.Dispose()
}

function Draw-Icon {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$Size
  )

  if (-not (Test-Path -LiteralPath $iconPath)) {
    return
  }

  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $G.DrawImage($icon, [System.Drawing.RectangleF]::new($X, $Y, $Size, $Size))
  $icon.Dispose()
}

function Draw-FeatureChip {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Label,
    [float]$X,
    [float]$Y,
    [float]$W,
    [string]$Theme = "dark"
  )

  $fill = if ($Theme -eq "dark") { New-PosterColor "FFFFFF" 22 } else { New-PosterColor "111827" 14 }
  $line = if ($Theme -eq "dark") { New-PosterColor "FFFFFF" 52 } else { New-PosterColor "111827" 26 }
  $textColor = if ($Theme -eq "dark") { New-PosterColor "F8FAFC" } else { New-PosterColor "111827" }
  Fill-RoundedRect $G $X $Y $W 52 18 $fill
  Stroke-RoundedRect $G $X $Y $W 52 18 $line 1.5
  Draw-TextBlock $G $Label ($X + 18) ($Y + 8) ($W - 36) 38 (New-PosterFont -Size 22 -Style Bold) $textColor Center Center -NoWrap
}

function Draw-AppMock {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [string]$Theme = "light",
    [string]$Amount = "128.47",
    [float]$Progress = 0.58
  )

  $isDark = $Theme -eq "dark"
  $panel = if ($isDark) { New-PosterColor "18181B" 220 } else { New-PosterColor "FFFFFF" 224 }
  $soft = if ($isDark) { New-PosterColor "3F3F46" 135 } else { New-PosterColor "F4F4F5" 230 }
  $line = if ($isDark) { New-PosterColor "FFFFFF" 28 } else { New-PosterColor "D4D4D8" 210 }
  $text = if ($isDark) { New-PosterColor "FAFAFA" } else { New-PosterColor "18181B" }
  $muted = if ($isDark) { New-PosterColor "A1A1AA" } else { New-PosterColor "71717A" }
  $gold = if ($isDark) { New-PosterColor "F59E0B" } else { New-PosterColor "D97706" }
  $gold2 = New-PosterColor "FBBF24"
  $windowStroke = if ($isDark) { New-PosterColor "FFFFFF" 42 } else { New-PosterColor "FFFFFF" 220 }
  $statusFill = if ($isDark) { New-PosterColor "27272A" 160 } else { New-PosterColor "F4F4F5" 220 }
  $buttonFill = if ($isDark) { New-PosterColor "FFFFFF" 22 } else { New-PosterColor "111827" 12 }
  $trackFill = if ($isDark) { New-PosterColor "3F3F46" 190 } else { New-PosterColor "E4E4E7" 235 }

  $corner = [Math]::Max(24, [Math]::Min(42, $H * 0.07))
  Draw-Shadow $G $X $Y $W $H $corner "000000" 44
  Fill-RoundedRect $G $X $Y $W $H $corner $panel
  Stroke-RoundedRect $G $X $Y $W $H $corner $windowStroke 2

  $statusX = $X + $W * 0.047
  $statusY = $Y + $H * 0.043
  $statusW = [Math]::Max(140, [Math]::Min(160, $W * 0.32))
  $statusH = [Math]::Max(28, [Math]::Min(38, $H * 0.07))
  $statusFont = [Math]::Max(15, [Math]::Min(19, $H * 0.035))
  Fill-RoundedRect $G $statusX $statusY $statusW $statusH ($statusH / 2) $statusFill
  Fill-RoundedRect $G ($statusX + 20) ($statusY + $statusH / 2 - 5) 10 10 5 $gold
  Draw-TextBlock $G "正在上班" ($statusX + 40) ($statusY + 3) ($statusW - 48) ($statusH - 6) (New-PosterFont -Size $statusFont -Style Bold) $muted Near Center -NoWrap

  $actionSize = [Math]::Max(16, [Math]::Min(24, $W * 0.04))
  $actionGap = [Math]::Max(6, [Math]::Min(10, $W * 0.018))
  $btnX = $X + $W - ($actionSize * 6 + $actionGap * 5) - $W * 0.06
  $btnY = $statusY + ($statusH - $actionSize) / 2
  for ($i = 0; $i -lt 6; $i++) {
    Fill-RoundedRect $G ($btnX + $i * ($actionSize + $actionGap)) $btnY $actionSize $actionSize ([Math]::Min(7, $actionSize / 3)) $buttonFill
  }

  $metaFont = [Math]::Max(20, [Math]::Min(30, $H * 0.05))
  $amountFont = [Math]::Max(44, [Math]::Min(76, [Math]::Min($W * 0.13, $H * 0.15)))
  Draw-TextBlock $G "今日入账" $X ($Y + $H * 0.20) $W ($H * 0.08) (New-PosterFont -Size $metaFont -Style Bold) $muted Center Center -NoWrap
  Draw-TextBlock $G "¥$Amount" ($X + $W * 0.07) ($Y + $H * 0.32) ($W * 0.86) ($H * 0.16) (New-PosterFont -Family "Cascadia Mono" -Size $amountFont -Style Bold) $text Center Center -NoWrap

  $statsMargin = [Math]::Max(28, $W * 0.06)
  $statsGap = [Math]::Max(8, $W * 0.02)
  $statsY = $Y + $H * 0.62
  $cardH = [Math]::Max(54, [Math]::Min(86, $H * 0.14))
  $cardW = ($W - $statsMargin * 2 - $statsGap * 2) / 3
  $labelFont = [Math]::Max(13, [Math]::Min(18, $H * 0.032))
  $valueFont = [Math]::Max(16, [Math]::Min(22, $H * 0.038))
  $labels = @("已工作", "距离下班", "今日预计")
  $values = @("4h 12m", "3h 18m", "¥363.64")
  for ($i = 0; $i -lt 3; $i++) {
    $cx = $X + $statsMargin + $i * ($cardW + $statsGap)
    Fill-RoundedRect $G $cx $statsY $cardW $cardH 16 $soft
    Stroke-RoundedRect $G $cx $statsY $cardW $cardH 16 $line 1.3
    Draw-TextBlock $G $labels[$i] $cx ($statsY + $cardH * 0.15) $cardW ($cardH * 0.32) (New-PosterFont -Size $labelFont -Style Bold) $muted Center Center -NoWrap
    Draw-TextBlock $G $values[$i] $cx ($statsY + $cardH * 0.52) $cardW ($cardH * 0.34) (New-PosterFont -Family "Cascadia Mono" -Size $valueFont -Style Bold) $text Center Center -NoWrap
  }

  $trackX = $X + $W * 0.067
  $trackY = $Y + $H * 0.84
  $trackW = $W * 0.866
  $trackH = [Math]::Max(10, [Math]::Min(16, $H * 0.027))
  $dot = [Math]::Max(18, [Math]::Min(26, $H * 0.043))
  Fill-RoundedRect $G $trackX $trackY $trackW $trackH ($trackH / 2) $trackFill
  Fill-RoundedRect $G $trackX $trackY ($trackW * $Progress) $trackH ($trackH / 2) $gold
  Fill-RoundedRect $G ($trackX + $trackW * $Progress - $dot / 2) ($trackY - ($dot - $trackH) / 2) $dot $dot ($dot / 2) $gold2
  $progressLabel = "今日进度 {0}%" -f ([Math]::Round($Progress * 100))
  Draw-TextBlock $G $progressLabel $X ($trackY + $trackH + 14) $W 28 (New-PosterFont -Size ([Math]::Max(15, [Math]::Min(20, $H * 0.034))) -Style Bold) $muted Center Center -NoWrap
}

function Draw-MiniWindow {
  param(
    [System.Drawing.Graphics]$G,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H,
    [string]$Amount,
    [string]$Theme = "light"
  )

  $dark = $Theme -eq "dark"
  $miniFill = if ($dark) { New-PosterColor "18181B" 210 } else { New-PosterColor "FFFFFF" 218 }
  $miniStroke = if ($dark) { New-PosterColor "FFFFFF" 42 } else { New-PosterColor "FFFFFF" 230 }
  $miniText = if ($dark) { New-PosterColor "FAFAFA" } else { New-PosterColor "18181B" }
  Draw-Shadow $G $X $Y $W $H 24 "000000" 38
  Fill-RoundedRect $G $X $Y $W $H 24 $miniFill
  Stroke-RoundedRect $G $X $Y $W $H 24 $miniStroke 2
  Draw-TextBlock $G "¥$Amount" ($X + 18) ($Y + 16) ($W - 36) ($H - 32) (New-PosterFont -Family "Cascadia Mono" -Size 40 -Style Bold) $miniText Center Center -NoWrap
}

function Draw-PosterOne {
  $bitmap = [System.Drawing.Bitmap]::new($script:CanvasW, $script:CanvasH)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  Draw-GradientBackground $g "121212" "2B2419" 28
  for ($i = 0; $i -lt 18; $i++) {
    $y = 116 + $i * 56
    Draw-Line $g 920 $y 1500 ($y - 88) (New-PosterColor "F59E0B" ([Math]::Max(14, 72 - $i * 3))) 3
    Fill-RoundedRect $g (1210 + ($i % 4) * 70) ($y - 14) 26 26 13 (New-PosterColor "F59E0B" ([Math]::Max(18, 120 - $i * 5)))
  }

  Draw-Icon $g 96 86 132
  Draw-TextBlock $g "打工人的桌面实时工资看板" 252 96 560 44 (New-PosterFont -Size 28 -Style Bold) (New-PosterColor "FBBF24") Near Center -NoWrap
  Draw-TextBlock $g "薪跳`nPayPulse" 92 220 690 250 (New-PosterFont -Size 92 -Style Bold) (New-PosterColor "FFFFFF") Near Near
  Draw-TextBlock $g "上班每一秒，都在入账。" 100 492 660 62 (New-PosterFont -Size 38 -Style Bold) (New-PosterColor "FDE68A") Near Center -NoWrap
  Draw-TextBlock $g "把今天已经挣到的钱放在桌面上实时滚动，让每一分钟都有清晰的薪资脉搏。" 102 572 620 116 (New-PosterFont -Size 25) (New-PosterColor "E5E7EB") Near Near

  Draw-FeatureChip $g "实时滚动金额" 104 732 210 "dark"
  Draw-FeatureChip $g "秒薪 / 毫秒感知" 336 732 236 "dark"
  Draw-FeatureChip $g "本地保存，不上云" 104 804 254 "dark"
  Draw-FeatureChip $g "托盘常驻" 380 804 174 "dark"

  Draw-AppMock $g 820 250 600 610 "dark" "128.47" 0.58
  Draw-MiniWindow $g 1010 906 320 104 "888.88" "dark"

  Draw-TextBlock $g "github.com/MasterBao66/PayPulse" 100 1062 760 48 (New-PosterFont -Family "Cascadia Mono" -Size 24 -Style Bold) (New-PosterColor "F8FAFC") Near Center -NoWrap
  Draw-TextBlock $g "v0.5.4 · Windows x64" 104 1110 360 34 (New-PosterFont -Size 22 -Style Bold) (New-PosterColor "A1A1AA") Near Center -NoWrap

  $path = Join-Path $outDir "poster-01-income-ticker.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bitmap.Dispose()
}

function Draw-PosterTwo {
  $bitmap = [System.Drawing.Bitmap]::new($script:CanvasW, $script:CanvasH)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  Draw-GradientBackground $g "F8FAFC" "FEF3C7" 62
  for ($x = 0; $x -le $script:CanvasW; $x += 80) {
    Draw-Line $g $x 0 $x $script:CanvasH (New-PosterColor "111827" 10) 1
  }
  for ($y = 0; $y -le $script:CanvasH; $y += 80) {
    Draw-Line $g 0 $y $script:CanvasW $y (New-PosterColor "111827" 10) 1
  }

  Draw-Icon $g 100 92 116
  Draw-TextBlock $g "薪跳 PayPulse" 240 108 600 42 (New-PosterFont -Size 29 -Style Bold) (New-PosterColor "18181B") Near Center -NoWrap
  Draw-TextBlock $g "每一秒都有`n薪资刻度" 96 230 650 228 (New-PosterFont -Size 88 -Style Bold) (New-PosterColor "111827") Near Near
  Draw-TextBlock $g "月薪、日薪、时薪都能输入；工作日、午休、上下班时间都能算清。" 104 486 600 92 (New-PosterFont -Size 27) (New-PosterColor "52525B") Near Near

  Draw-Shadow $g 102 638 620 260 38 "78350F" 24
  Fill-RoundedRect $g 102 638 620 260 38 (New-PosterColor "FFFFFF" 226)
  Stroke-RoundedRect $g 102 638 620 260 38 (New-PosterColor "FFFFFF" 240) 2
  Draw-TextBlock $g "秒薪" 150 678 100 38 (New-PosterFont -Size 27 -Style Bold) (New-PosterColor "D97706") Near Center -NoWrap
  Draw-TextBlock $g "¥0.0632" 142 722 420 88 (New-PosterFont -Family "Cascadia Mono" -Size 72 -Style Bold) (New-PosterColor "111827") Near Center -NoWrap
  Draw-TextBlock $g "按帧刷新，数字像计价器一样往前滚。" 150 818 500 42 (New-PosterFont -Size 24) (New-PosterColor "71717A") Near Center -NoWrap

  $flow = @(
    @{label = "月薪"; value = "8000"},
    @{label = "日薪"; value = "363.64"},
    @{label = "时薪"; value = "45.45"},
    @{label = "分薪"; value = "0.76"},
    @{label = "秒薪"; value = "0.0126"}
  )
  $startX = 820
  $startY = 196
  for ($i = 0; $i -lt $flow.Count; $i++) {
    $x = $startX + ($i % 2) * 296
    $y = $startY + [Math]::Floor($i / 2) * 158
    Fill-RoundedRect $g $x $y 250 104 24 (New-PosterColor "FFFFFF" 224)
    Stroke-RoundedRect $g $x $y 250 104 24 (New-PosterColor "111827" 20) 1.5
    Draw-TextBlock $g $flow[$i].label ($x + 26) ($y + 18) 84 30 (New-PosterFont -Size 23 -Style Bold) (New-PosterColor "71717A") Near Center -NoWrap
    Draw-TextBlock $g ("¥" + $flow[$i].value) ($x + 26) ($y + 50) 190 36 (New-PosterFont -Family "Cascadia Mono" -Size 28 -Style Bold) (New-PosterColor "111827") Near Center -NoWrap
    if ($i -lt ($flow.Count - 1)) {
      $lineX = if (($i % 2) -eq 0) { $x + 252 } else { $x + 126 }
      $lineY = if (($i % 2) -eq 0) { $y + 52 } else { $y + 112 }
      $endX = if (($i % 2) -eq 0) { $x + 292 } else { $x + 126 }
      $endY = if (($i % 2) -eq 0) { $y + 52 } else { $y + 150 }
      Draw-Line $g $lineX $lineY $endX $endY (New-PosterColor "D97706" 120) 4
    }
  }

  Draw-AppMock $g 970 654 430 360 "light" "88.36" 0.42
  Draw-FeatureChip $g "月薪 / 日薪 / 时薪" 104 958 250 "light"
  Draw-FeatureChip $g "工作日与午休剔除" 376 958 270 "light"
  Draw-FeatureChip $g "统计面板自动换算" 668 958 270 "light"
  Draw-TextBlock $g "让工资从一个月底的大数字，变成今天此刻正在发生的小确幸。" 104 1062 960 48 (New-PosterFont -Size 28 -Style Bold) (New-PosterColor "18181B") Near Center -NoWrap

  $path = Join-Path $outDir "poster-02-salary-granularity.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bitmap.Dispose()
}

function Draw-PosterThree {
  $bitmap = [System.Drawing.Bitmap]::new($script:CanvasW, $script:CanvasH)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  Draw-GradientBackground $g "DBEAFE" "111827" 28
  Fill-RoundedRect $g 0 820 1600 380 0 (New-PosterColor "020617" 170)
  Fill-RoundedRect $g 164 140 1270 800 58 (New-PosterColor "FFFFFF" 42)
  Stroke-RoundedRect $g 164 140 1270 800 58 (New-PosterColor "FFFFFF" 90) 2
  Fill-RoundedRect $g 226 206 1146 668 28 (New-PosterColor "0F172A" 210)

  for ($i = 0; $i -lt 9; $i++) {
    $x = 282 + $i * 120
    Fill-RoundedRect $g $x 802 74 14 7 (New-PosterColor "FFFFFF" 38)
  }

  Draw-AppMock $g 258 260 520 470 "dark" "76.91" 0.36
  Draw-MiniWindow $g 1032 238 296 94 "77.02" "light"
  Draw-MiniWindow $g 992 368 356 112 "77.48" "dark"

  Draw-TextBlock $g "放在桌面角落`n看钱自己长大" 154 760 720 190 (New-PosterFont -Size 72 -Style Bold) (New-PosterColor "FFFFFF") Near Near
  Draw-TextBlock $g "迷你悬浮窗默认置顶，关窗可藏到托盘；上班时安静显示，下班后自动停表。" 158 950 690 76 (New-PosterFont -Size 27) (New-PosterColor "CBD5E1") Near Near

  Draw-Icon $g 980 764 132
  Draw-FeatureChip $g "迷你悬浮" 1140 768 170 "dark"
  Draw-FeatureChip $g "窗口置顶" 1328 768 170 "dark"
  Draw-FeatureChip $g "深浅双主题" 1140 840 202 "dark"
  Draw-FeatureChip $g "托盘菜单" 1360 840 170 "dark"

  Fill-RoundedRect $g 980 966 458 74 24 (New-PosterColor "F59E0B" 245)
  Draw-TextBlock $g "GitHub 免费下载" 1008 978 402 50 (New-PosterFont -Size 31 -Style Bold) (New-PosterColor "111827") Center Center -NoWrap
  Draw-TextBlock $g "github.com/MasterBao66/PayPulse" 970 1058 510 34 (New-PosterFont -Family "Cascadia Mono" -Size 18 -Style Bold) (New-PosterColor "E5E7EB") Center Center -NoWrap

  $path = Join-Path $outDir "poster-03-desktop-corner.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bitmap.Dispose()
}

Draw-PosterOne
Draw-PosterTwo
Draw-PosterThree

Get-ChildItem -LiteralPath $outDir -Filter "poster-*.png" | Select-Object FullName, Length
