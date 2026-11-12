# ---------------------------------------------------------------------------
# Generates assets/img/og-image.png (1200x630) for social sharing.
# Uses System.Drawing, so no external packages are required on Windows.
#
# Usage: powershell -ExecutionPolicy Bypass -File .\tools\make-og-image.ps1
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "assets\img"
$brandDir = Join-Path $root "resources\brand"
$outFile = Join-Path $outDir "og-image.png"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$W = 1200
$H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

function C([string]$hex, [int]$alpha = 255) {
    $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
    return [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B)
}
function Font([string]$family, [float]$size, [string]$style = "Regular") {
    $fs = [System.Drawing.FontStyle]::$style
    return New-Object System.Drawing.Font($family, $size, $fs, [System.Drawing.GraphicsUnit]::Pixel)
}
function Text($text, $font, $color, [float]$x, [float]$y) {
    $brush = New-Object System.Drawing.SolidBrush($color)
    $g.DrawString($text, $font, $brush, $x, $y)
    $brush.Dispose()
}

# --- Background gradient ---------------------------------------------------
$rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, (C "#0b1b2b"), (C "#0e3a37"), 35.0)
$g.FillRectangle($bg, $rect)
$bg.Dispose()

# --- Decorative rings (top right) -----------------------------------------
$ringPen1 = New-Object System.Drawing.Pen((C "#c89a4b" 55), 2)
$ringPen2 = New-Object System.Drawing.Pen((C "#dd7517" 40), 2)
$ringPen3 = New-Object System.Drawing.Pen((C "#f6efe2" 18), 1)
$g.DrawEllipse($ringPen1, 730, -190, 620, 620)
$g.DrawEllipse($ringPen2, 815, -105, 450, 450)
$g.DrawEllipse($ringPen3, 890, -30, 300, 300)

# Dots on the outer ring
$dotBrush = New-Object System.Drawing.SolidBrush((C "#c89a4b" 150))
for ($i = 0; $i -lt 12; $i++) {
    $angle = ($i * 30) * [Math]::PI / 180
    $cx = 730 + 310 + [Math]::Cos($angle) * 310
    $cy = -190 + 310 + [Math]::Sin($angle) * 310
    $g.FillEllipse($dotBrush, [float]($cx - 4), [float]($cy - 4), 8, 8)
}
$dotBrush.Dispose()

# Warm glow bottom-left
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(-260, 420, 720, 420)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glow.CenterColor = (C "#dd7517" 42)
$glow.SurroundColors = @((C "#dd7517" 0))
$g.FillPath($glow, $glowPath)
$glow.Dispose()
$glowPath.Dispose()

# --- Gold rule ------------------------------------------------------------
$goldPen = New-Object System.Drawing.Pen((C "#c89a4b"), 3)
$g.DrawLine($goldPen, 96, 212, 300, 212)
$goldPen.Dispose()

# --- Logo mark ------------------------------------------------------------
$logoPath = Join-Path $brandDir "logo-mark.png"
$logo = [System.Drawing.Image]::FromFile($logoPath)
$logoH = 92
$logoW = [int]($logo.Width * $logoH / $logo.Height)
$g.DrawImage($logo, 96, 74, $logoW, $logoH)
$logo.Dispose()

# --- Brand ----------------------------------------------------------------
Text "SOBHAKRITA" (Font "Georgia" 40 "Bold") (C "#f7f1e6") 232 88
Text "FINTECH SOLUTIONS" (Font "Segoe UI" 17 "Bold") (C "#e9b865") 234 142

# --- Headline -------------------------------------------------------------
Text "Loans, explained" (Font "Georgia" 72 "Bold") (C "#f7f1e6") 92 250
Text "before you sign." (Font "Georgia" 72 "Italic") (C "#e9b865") 92 332

# --- Supporting line ------------------------------------------------------
Text "Personal / Business / Home / Mortgage / Car / Education / Industrial" (Font "Segoe UI" 22) (C "#d8dfe6") 96 444
Text "A loan facilitator in Chittoor, Andhra Pradesh. Clear fees, explained upfront." (Font "Segoe UI" 20) (C "#a9bccb") 96 484

# --- Bottom bar -----------------------------------------------------------
$barPen = New-Object System.Drawing.Pen((C "#ffffff" 34), 1)
$g.DrawLine($barPen, 96, 548, 1104, 548)
$barPen.Dispose()
Text "www.sobhakritafintech.com" (Font "Segoe UI" 20 "Bold") (C "#e9b865") 96 568
Text "DSA / RBI-regulated lending partners" (Font "Segoe UI" 17) (C "#9db0bf") 760 571

# --- Save -----------------------------------------------------------------
$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host ("Wrote {0} ({1:N0} bytes)" -f $outFile, (Get-Item $outFile).Length)
