# ---------------------------------------------------------------------------
# Static site builder for Sobhakrita Fintech Solutions
# Reads src/pages/*.html plus every src/partials/*.html file and writes
# self-contained .html files into the project root. Partials can include each
# other with {{>partial-name}} tokens.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\build.ps1
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Load every partial once. Pages and partials can reference another partial with
# a {{>partial-name}} token; the token is replaced recursively at build time.
$partials = @{}
Get-ChildItem (Join-Path $root "src\partials") -Filter "*.html" | ForEach-Object {
    # Trim trailing whitespace so includes join with predictable spacing.
    $partials[$_.BaseName] = (Read-Utf8 $_.FullName).TrimEnd()
}

function Expand-Partials([string]$text) {
    $pattern = '\{\{>\s*([\w-]+)\s*\}\}'
    while ([regex]::IsMatch($text, $pattern)) {
        $text = [regex]::Replace($text, $pattern, {
            param($match)
            $name = $match.Groups[1].Value
            if ($partials.ContainsKey($name)) { return $partials[$name] }
            return $match.Value
        })
    }
    return $text
}

$head   = Expand-Partials $partials["head"]
$header = Expand-Partials $partials["header"]
$footer = Expand-Partials $partials["footer"]
$tail   = Expand-Partials $partials["tail"]

$pages = Get-ChildItem (Join-Path $root "src\pages") -Filter "*.html" | Sort-Object Name

foreach ($page in $pages) {
    $raw = Read-Utf8 $page.FullName
    $meta = @{}

    foreach ($m in [regex]::Matches($raw, '<!--@(\w+):\s*([\s\S]*?)-->')) {
        $meta[$m.Groups[1].Value] = $m.Groups[2].Value.Trim()
    }

    $body = Expand-Partials ([regex]::Replace($raw, '<!--@\w+:[\s\S]*?-->', '').Trim())

    $title = $meta["title"]
    $desc  = $meta["desc"]
    $slug  = if ($meta.ContainsKey("slug")) { $meta["slug"] } else { $page.BaseName + ".html" }
    $name  = if ($meta.ContainsKey("page")) { $meta["page"] } else { $page.BaseName }
    $robots = if ($meta.ContainsKey("robots")) { $meta["robots"] } else { "index, follow" }

    $html = $head.Replace("{{TITLE}}", $title).Replace("{{DESC}}", $desc).Replace("{{SLUG}}", $slug).Replace("{{PAGE}}", $name).Replace("{{ROBOTS}}", $robots)
    $html += "`r`n" + $header + "`r`n" + $body + "`r`n" + $footer + "`r`n" + $tail + "`r`n"

    $outPath = Join-Path $root ($page.BaseName + ".html")
    [System.IO.File]::WriteAllText($outPath, $html, $utf8NoBom)
    Write-Host ("  built  {0,-26} {1,7:N1} KB" -f ($page.BaseName + ".html"), ($html.Length / 1024))
}

Write-Host ""
Write-Host ("Done. {0} pages generated in {1}" -f $pages.Count, $root)
