# Generates the website + email brand assets from the supplied master artwork
# (assets/img/SFS_Logo_Black.jpg, a flat JPG on a near-black background).
#
#   assets/img/logo-mark.png        emblem only, transparent  -> site header/footer + email header
#   assets/img/logo-full.png        emblem + wordmark + tagline, transparent -> structured data
#   assets/img/logo-watermark.png   emblem at ~10% alpha      -> email body watermark
#   resources/brand/*.png           favicon / app icons on a dark rounded tile
#
# The email watermark has its transparency baked in because Outlook's Word
# rendering engine ignores CSS opacity.
#
# Usage: powershell -ExecutionPolicy Bypass -File tools/generate-brand-assets.ps1

$ErrorActionPreference = "Stop"

$code = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Collections.Generic;

public static class LogoGen
{
    static Bitmap src;
    static int W, H;
    static int[] px;
    static bool[] transparent;
    static Bitmap emblem;

    static int BgR = 33, BgG = 31, BgB = 32;

    static int Dist(int argb)
    {
        int r = (argb >> 16) & 0xFF, g = (argb >> 8) & 0xFF, b = argb & 0xFF;
        return Math.Abs(r - BgR) + Math.Abs(g - BgG) + Math.Abs(b - BgB);
    }

    public static void Load(string path)
    {
        src = new Bitmap(path);
        W = src.Width; H = src.Height;
        px = new int[W * H];
        var rect = new Rectangle(0, 0, W, H);
        var bmpData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            for (int y = 0; y < H; y++)
            {
                IntPtr rowPtr = IntPtr.Add(bmpData.Scan0, y * bmpData.Stride);
                int[] row = new int[W];
                System.Runtime.InteropServices.Marshal.Copy(rowPtr, row, 0, W);
                Array.Copy(row, 0, px, y * W, W);
            }
        }
        finally { src.UnlockBits(bmpData); }
    }

    // Flood fill the near-background from the image border so the dark areas
    // enclosed by the logo's rings (icon backgrounds) stay opaque.
    static void BuildMask(int tolerance)
    {
        transparent = new bool[W * H];
        var stack = new Stack<int>();
        for (int x = 0; x < W; x++)
        {
            stack.Push(x);
            stack.Push((H - 1) * W + x);
        }
        for (int y = 0; y < H; y++)
        {
            stack.Push(y * W);
            stack.Push(y * W + W - 1);
        }

        while (stack.Count > 0)
        {
            int i = stack.Pop();
            if (transparent[i]) continue;
            if (Dist(px[i]) > tolerance) continue;
            transparent[i] = true;
            int x = i % W, y = i / W;
            if (x > 0) stack.Push(i - 1);
            if (x < W - 1) stack.Push(i + 1);
            if (y > 0) stack.Push(i - W);
            if (y < H - 1) stack.Push(i + W);
        }
    }

    // Partial alpha for anti-aliased edge pixels so the logo has no dark halo.
    static int AlphaAt(int i, int x, int y)
    {
        if (transparent[i]) return 0;
        int d = Dist(px[i]);
        if (d >= 130) return 255;
        bool touchesEdge = false;
        for (int dy = -1; dy <= 1 && !touchesEdge; dy++)
        {
            for (int dx = -1; dx <= 1; dx++)
            {
                int nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                if (transparent[ny * W + nx]) { touchesEdge = true; break; }
            }
        }
        if (!touchesEdge) return 255;
        if (d <= 45) return 0;
        double a = (d - 45.0) / 85.0;
        if (a < 0) a = 0;
        if (a > 1) a = 1;
        return (int)Math.Round(a * 255);
    }

    public static void SaveCrop(string outPath, int x0, int y0, int cw, int ch, int targetWidth, double alphaScale)
    {
        int minX = cw, minY = ch, maxX = -1, maxY = -1;
        for (int y = 0; y < ch; y++)
        {
            for (int x = 0; x < cw; x++)
            {
                int sx = x0 + x, sy = y0 + y;
                if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
                int i = sy * W + sx;
                if (AlphaAt(i, sx, sy) > 3)
                {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < 0) throw new Exception("Empty crop for " + outPath);

        int tw = maxX - minX + 1, th = maxY - minY + 1;
        using (var outBmp = new Bitmap(tw, th, PixelFormat.Format32bppArgb))
        {
            var rect = new Rectangle(0, 0, tw, th);
            var bmpData = outBmp.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            try
            {
                for (int y = 0; y < th; y++)
                {
                    int[] row = new int[tw];
                    for (int x = 0; x < tw; x++)
                    {
                        int sx = x0 + minX + x, sy = y0 + minY + y;
                        int i = sy * W + sx;
                        int a = AlphaAt(i, sx, sy);
                        if (alphaScale < 1.0) a = (int)Math.Round(a * alphaScale);
                        row[x] = (a << 24) | (px[i] & 0x00FFFFFF);
                    }
                    System.Runtime.InteropServices.Marshal.Copy(row, 0, IntPtr.Add(bmpData.Scan0, y * bmpData.Stride), tw);
                }
            }
            finally { outBmp.UnlockBits(bmpData); }

            int targetHeight = (int)Math.Round(targetWidth * (double)th / tw);
            using (var scaled = new Bitmap(targetWidth, targetHeight, PixelFormat.Format32bppArgb))
            {
                using (var g = Graphics.FromImage(scaled))
                {
                    g.CompositingMode = CompositingMode.SourceCopy;
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.SmoothingMode = SmoothingMode.HighQuality;
                    g.DrawImage(outBmp, new Rectangle(0, 0, targetWidth, targetHeight));
                }
                scaled.Save(outPath, ImageFormat.Png);
                Console.WriteLine(outPath + " -> " + targetWidth + "x" + targetHeight);
            }
        }
    }

    // Card-sized canvas with the emblem centred. Used as the email "watermark" background so the
    // details rows sit on top of it. A full-card canvas means clients that ignore background-size
    // (Outlook's Word engine) do not tile the emblem across the table.
    public static void SaveCanvas(string outPath, string emblemPath, int canvasW, int canvasH, int emblemW, double alpha)
    {
        using (var canvas = new Bitmap(canvasW, canvasH, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(canvas))
            {
                g.CompositingMode = CompositingMode.SourceOver;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.Clear(Color.Transparent);

                using (var em = new Bitmap(emblemPath))
                {
                    int w = emblemW;
                    int h = (int)Math.Round(emblemW * (double)em.Height / em.Width);
                    var attrs = new ImageAttributes();
                    var cm = new ColorMatrix();
                    cm.Matrix33 = (float)alpha;
                    attrs.SetColorMatrix(cm, ColorMatrixFlag.Default, ColorAdjustType.Bitmap);
                    g.DrawImage(em, new Rectangle((canvasW - w) / 2, (canvasH - h) / 2, w, h),
                        0, 0, em.Width, em.Height, GraphicsUnit.Pixel, attrs);
                    attrs.Dispose();
                }
            }
            canvas.Save(outPath, ImageFormat.Png);
            Console.WriteLine(outPath + " -> " + canvasW + "x" + canvasH);
        }
    }

    // Square icon on a dark rounded tile, matching the supplied artwork's background.
    public static void SaveIcon(string outPath, int size, int emblemW, int emblemH, int pad)
    {
        using (var bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.Clear(Color.Transparent);
                using (var path = new GraphicsPath())
                {
                    int r = (int)Math.Round(size * 0.20);
                    path.AddArc(0, 0, r * 2, r * 2, 180, 90);
                    path.AddArc(size - r * 2, 0, r * 2, r * 2, 270, 90);
                    path.AddArc(size - r * 2, size - r * 2, r * 2, r * 2, 0, 90);
                    path.AddArc(0, size - r * 2, r * 2, r * 2, 90, 90);
                    path.CloseFigure();
                    using (var brush = new SolidBrush(Color.FromArgb(255, 33, 31, 32)))
                        g.FillPath(brush, path);
                }

                int maxW = size - pad * 2;
                int maxH = size - pad * 2;
                double scale = Math.Min((double)maxW / emblemW, (double)maxH / emblemH);
                int w = (int)Math.Round(emblemW * scale);
                int h = (int)Math.Round(emblemH * scale);
                g.DrawImage(emblem, new Rectangle((size - w) / 2, (size - h) / 2, w, h));
            }
            bmp.Save(outPath, ImageFormat.Png);
            Console.WriteLine(outPath + " -> " + size + "x" + size);
        }
    }

    public static void SaveAll(string srcPath, string outDir, string brandDir)
    {
        Load(srcPath);
        BuildMask(40);

        // Emblem and full lockup bounds measured from the source artwork.
        int emX = 565, emY = 176, emW = 2035 - 565 + 1, emH = 1337 - 176 + 1;
        int fullX = 161, fullY = 176, fullW = 2474 - 161 + 1, fullH = 1634 - 176 + 1;

        SaveCrop(System.IO.Path.Combine(outDir, "logo-mark.png"), emX, emY, emW, emH, 256, 1.0);
        SaveCrop(System.IO.Path.Combine(outDir, "logo-full.png"), fullX, fullY, fullW, fullH, 800, 1.0);

        emblem = new Bitmap(System.IO.Path.Combine(outDir, "logo-mark.png"));

        // Email watermark: a details-card sized canvas (640x340) with the emblem centred at ~10% alpha.
        SaveCanvas(System.IO.Path.Combine(outDir, "logo-watermark.png"), System.IO.Path.Combine(outDir, "logo-mark.png"), 640, 340, 270, 0.10);

        SaveIcon(System.IO.Path.Combine(brandDir, "icon-512.png"), 512, emblem.Width, emblem.Height, 46);
        SaveIcon(System.IO.Path.Combine(brandDir, "icon-192.png"), 192, emblem.Width, emblem.Height, 18);
        SaveIcon(System.IO.Path.Combine(brandDir, "apple-touch-icon.png"), 180, emblem.Width, emblem.Height, 16);
        SaveIcon(System.IO.Path.Combine(brandDir, "favicon-32.png"), 32, emblem.Width, emblem.Height, 2);
        Console.WriteLine("icons written to: " + brandDir);
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "assets\img\SFS_Logo_Black.jpg"
$imgDir = Join-Path $root "assets\img"
$brandDir = Join-Path $root "resources\brand"

if (-not (Test-Path $src)) { throw "Missing master artwork: $src" }

[LogoGen]::SaveAll($src, $imgDir, $brandDir)

# Keep the brand master folder and the web asset folder in sync.
foreach ($name in @("icon-192.png", "favicon-32.png", "apple-touch-icon.png", "icon-512.png")) {
    Start-Sleep -Milliseconds 150
    Copy-Item (Join-Path $brandDir $name) (Join-Path $imgDir $name) -Force
}
Copy-Item (Join-Path $imgDir "logo-mark.png") (Join-Path $brandDir "logo-mark.png") -Force
Write-Host "Done."
