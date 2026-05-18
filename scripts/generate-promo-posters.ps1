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
    [Parameter(Mandatory = $true)][float]$Size,
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

function Draw-SetupCard {
  param(
    [System.Drawing.Graphics]$G,
    [int]$Step,
    [string]$Title,
    [string]$Caption,
    [string[]]$Rows,
    [float]$X,
    [float]$Y,
    [float]$W,
    [float]$H
  )

  Fill-RoundedRect $G ($X + 14) ($Y + 20) $W $H 34 (New-PosterColor "0F172A" 18)
  Fill-RoundedRect $G $X $Y $W $H 34 (New-PosterColor "FFFFFF" 236)
  Stroke-RoundedRect $G $X $Y $W $H 34 (New-PosterColor "CBD5E1" 160) 2

  Fill-RoundedRect $G ($X + 34) ($Y + 34) 58 58 18 (New-PosterColor "F59E0B")
  Draw-TextBlock $G "$Step" ($X + 34) ($Y + 38) 58 48 (New-PosterFont -Family "Cascadia Mono" -Size 31 -Style Bold) (New-PosterColor "111827") Center Center -NoWrap
  Draw-TextBlock $G $Title ($X + 112) ($Y + 32) ($W - 146) 42 (New-PosterFont -Size 30 -Style Bold) (New-PosterColor "111827") Near Center -NoWrap
  Draw-TextBlock $G $Caption ($X + 112) ($Y + 76) ($W - 146) 36 (New-PosterFont -Size 20) (New-PosterColor "64748B") Near Center -NoWrap

  $rowY = $Y + 138
  foreach ($row in $Rows) {
    Fill-RoundedRect $G ($X + 34) $rowY ($W - 68) 54 18 (New-PosterColor "F8FAFC")
    Stroke-RoundedRect $G ($X + 34) $rowY ($W - 68) 54 18 (New-PosterColor "E2E8F0") 1
    Fill-RoundedRect $G ($X + 54) ($rowY + 20) 14 14 7 (New-PosterColor "F59E0B")
    Draw-TextBlock $G $row ($X + 82) ($rowY + 8) ($W - 124) 38 (New-PosterFont -Size 21 -Style Bold) (New-PosterColor "334155") Near Center -NoWrap
    $rowY += 70
  }
}

function Draw-PosterTwo {
  $bitmap = [System.Drawing.Bitmap]::new($script:CanvasW, $script:CanvasH)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  Draw-GradientBackground $g "FFF7ED" "E0F2FE" 32
  Fill-RoundedRect $g 96 82 1408 1036 58 (New-PosterColor "FFFFFF" 142)
  Stroke-RoundedRect $g 96 82 1408 1036 58 (New-PosterColor "FFFFFF" 210) 2

  Draw-Icon $g 140 128 104
  Draw-TextBlock $g "薪跳 PayDance" 270 134 500 42 (New-PosterFont -Size 30 -Style Bold) (New-PosterColor "0F172A") Near Center -NoWrap
  Draw-TextBlock $g "首次配置，三步上手" 140 266 760 92 (New-PosterFont -Size 72 -Style Bold) (New-PosterColor "0F172A") Near Center -NoWrap
  Draw-TextBlock $g "把薪资、作息、外观一次设好，从第一天开始看见每一秒收入。" 144 372 760 52 (New-PosterFont -Size 28) (New-PosterColor "475569") Near Center -NoWrap

  Draw-SetupCard $g 1 "薪资模式" "选择月薪、日薪或时薪" @("月薪 8000 元", "每月工作 22 天", "自动换算秒薪") 142 520 390 420
  Draw-SetupCard $g 2 "工作时间" "还原真实上下班节奏" @("09:30 上班", "18:30 下班", "午休可选剔除") 606 520 390 420
  Draw-SetupCard $g 3 "外观风格" "让看板贴合桌面" @("浅色 / 深色主题", "窗口始终置顶", "迷你悬浮模式") 1070 520 390 420

  Draw-Line $g 536 730 598 730 (New-PosterColor "F59E0B" 170) 5
  Draw-Line $g 1000 730 1062 730 (New-PosterColor "F59E0B" 170) 5
  Fill-RoundedRect $g 142 984 1318 70 24 (New-PosterColor "0F172A")
  Draw-TextBlock $g "配置完成后，薪跳会在桌面实时显示今日入账、工作进度和预计收入。" 176 996 1250 46 (New-PosterFont -Size 27 -Style Bold) (New-PosterColor "FFFFFF") Center Center -NoWrap

  $path = Join-Path $outDir "poster-02-first-run-setup.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bitmap.Dispose()
}

function Draw-TimelineNode {
  param(
    [System.Drawing.Graphics]$G,
    [string]$Time,
    [string]$Label,
    [string]$Amount,
    [float]$X,
    [float]$Y,
    [bool]$Active = $false
  )

  $fill = if ($Active) { New-PosterColor "F59E0B" } else { New-PosterColor "1E293B" }
  $text = if ($Active) { New-PosterColor "111827" } else { New-PosterColor "E2E8F0" }
  Fill-RoundedRect $G ($X - 15) ($Y - 15) 30 30 15 $fill
  Stroke-RoundedRect $G ($X - 15) ($Y - 15) 30 30 15 (New-PosterColor "FBBF24" 180) 2
  Draw-TextBlock $G $Time ($X - 96) ($Y + 30) 192 34 (New-PosterFont -Family "Cascadia Mono" -Size 23 -Style Bold) (New-PosterColor "F8FAFC") Center Center -NoWrap
  Draw-TextBlock $G $Label ($X - 116) ($Y + 68) 232 32 (New-PosterFont -Size 22 -Style Bold) (New-PosterColor "CBD5E1") Center Center -NoWrap
  Draw-TextBlock $G $Amount ($X - 120) ($Y + 104) 240 42 (New-PosterFont -Family "Cascadia Mono" -Size 28 -Style Bold) $text Center Center -NoWrap
}

function Draw-PosterThree {
  $bitmap = [System.Drawing.Bitmap]::new($script:CanvasW, $script:CanvasH)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  Draw-GradientBackground $g "020617" "172554" 24
  for ($i = 0; $i -lt 18; $i++) {
    Draw-Line $g 80 (170 + $i * 46) 1520 (92 + $i * 46) (New-PosterColor "38BDF8" ([Math]::Max(8, 34 - $i))) 1.3
  }

  Draw-Icon $g 112 96 110
  Draw-TextBlock $g "薪跳 PayDance" 244 108 470 44 (New-PosterFont -Size 30 -Style Bold) (New-PosterColor "F8FAFC") Near Center -NoWrap
  Draw-TextBlock $g "一天收入轨迹" 112 246 620 88 (New-PosterFont -Size 76 -Style Bold) (New-PosterColor "FFFFFF") Near Center -NoWrap
  Draw-TextBlock $g "从上班、午休到下班，把时间怎样变成钱画出来。" 116 354 740 52 (New-PosterFont -Size 28) (New-PosterColor "CBD5E1") Near Center -NoWrap

  Fill-RoundedRect $g 102 488 1396 320 48 (New-PosterColor "0F172A" 224)
  Stroke-RoundedRect $g 102 488 1396 320 48 (New-PosterColor "FFFFFF" 48) 2
  Draw-Line $g 202 632 1398 632 (New-PosterColor "334155") 6
  Draw-Line $g 202 632 825 632 (New-PosterColor "F59E0B") 8
  Draw-TimelineNode $g "09:30" "开始上班" "¥0.00" 202 632 $false
  Draw-TimelineNode $g "12:00" "午休暂停" "¥113.64" 558 632 $false
  Draw-TimelineNode $g "14:00" "继续入账" "¥113.64" 825 632 $true
  Draw-TimelineNode $g "18:30" "今日下班" "¥363.64" 1398 632 $false

  Fill-RoundedRect $g 110 872 604 190 42 (New-PosterColor "FFFFFF" 18)
  Stroke-RoundedRect $g 110 872 604 190 42 (New-PosterColor "FFFFFF" 54) 2
  Draw-TextBlock $g "当前入账" 156 910 220 40 (New-PosterFont -Size 26 -Style Bold) (New-PosterColor "CBD5E1") Near Center -NoWrap
  Draw-TextBlock $g "¥128.47" 154 952 360 80 (New-PosterFont -Family "Cascadia Mono" -Size 64 -Style Bold) (New-PosterColor "FBBF24") Near Center -NoWrap

  Fill-RoundedRect $g 790 872 708 190 42 (New-PosterColor "FFFFFF" 18)
  Stroke-RoundedRect $g 790 872 708 190 42 (New-PosterColor "FFFFFF" 54) 2
  Draw-TextBlock $G "不止看数字，也看节奏" 838 910 400 40 (New-PosterFont -Size 26 -Style Bold) (New-PosterColor "F8FAFC") Near Center -NoWrap
  Draw-TextBlock $G "工作中、午休中、已下班、今日休息，状态会随时间自然切换。" 838 956 590 58 (New-PosterFont -Size 24) (New-PosterColor "CBD5E1") Near Center

  Draw-TextBlock $g "github.com/MasterBao66/PayDance" 112 1094 680 44 (New-PosterFont -Family "Cascadia Mono" -Size 24 -Style Bold) (New-PosterColor "E2E8F0") Near Center -NoWrap
  Draw-TextBlock $g "Windows 11 · Tauri 2 · 本地优先" 1050 1094 448 44 (New-PosterFont -Size 24 -Style Bold) (New-PosterColor "CBD5E1") Far Center -NoWrap

  $path = Join-Path $outDir "poster-03-workday-income-timeline.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bitmap.Dispose()
}

Draw-PosterTwo
Draw-PosterThree

Get-ChildItem -LiteralPath $outDir -Filter "poster-0*.png" | Select-Object FullName, Length
