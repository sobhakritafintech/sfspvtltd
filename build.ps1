# ---------------------------------------------------------------------------
# Static site builder for Sobhakrita Fintech Solutions
# Reads src/pages/*.html + src/partials/{head,header,footer}.html and writes
# self-contained .html files into the project root.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\build.ps1
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$head   = Read-Utf8 (Join-Path $root "src\partials\head.html")
$header = Read-Utf8 (Join-Path $root "src\partials\header.html")
$footer = Read-Utf8 (Join-Path $root "src\partials\footer.html")

$pages = Get-ChildItem (Join-Path $root "src\pages") -Filter "*.html" | Sort-Object Name

foreach ($page in $pages) {
    $raw = Read-Utf8 $page.FullName
    $meta = @{}

    foreach ($m in [regex]::Matches($raw, '<!--@(\w+):\s*([\s\S]*?)-->')) {
        $meta[$m.Groups[1].Value] = $m.Groups[2].Value.Trim()
    }

    $body = [regex]::Replace($raw, '<!--@\w+:[\s\S]*?-->', '').Trim()

    $title = $meta["title"]
    $desc  = $meta["desc"]
    $slug  = if ($meta.ContainsKey("slug")) { $meta["slug"] } else { $page.BaseName + ".html" }
    $name  = if ($meta.ContainsKey("page")) { $meta["page"] } else { $page.BaseName }
    $robots = if ($meta.ContainsKey("robots")) { $meta["robots"] } else { "index, follow" }

    $html = $head.Replace("{{TITLE}}", $title).Replace("{{DESC}}", $desc).Replace("{{SLUG}}", $slug).Replace("{{PAGE}}", $name).Replace("{{ROBOTS}}", $robots)
    $html += "`r`n" + $header + "`r`n" + $body + "`r`n" + $footer

    $outPath = Join-Path $root ($page.BaseName + ".html")
    [System.IO.File]::WriteAllText($outPath, $html, $utf8NoBom)
    Write-Host ("  built  {0,-26} {1,7:N1} KB" -f ($page.BaseName + ".html"), ($html.Length / 1024))
}

Write-Host ""
Write-Host ("Done. {0} pages generated in {1}" -f $pages.Count, $root)
