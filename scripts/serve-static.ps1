param(
    [int]$Port = 8080,
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Serving $Root at $prefix"
Write-Host "Press Ctrl+C to stop."

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png' = 'image/png'
    '.jpg' = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.svg' = 'image/svg+xml'
    '.ico' = 'image/x-icon'
    '.txt' = 'text/plain; charset=utf-8'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $relativePath = $request.Url.AbsolutePath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = 'examples/native-chrome-demo.html'
            }

            $relativePath = $relativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relativePath))
            $rootFullPath = [System.IO.Path]::GetFullPath($Root)

            if (-not $fullPath.StartsWith($rootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('Forbidden')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                continue
            }

            if ((Test-Path $fullPath) -and (Get-Item $fullPath).PSIsContainer) {
                $fullPath = Join-Path $fullPath 'index.html'
            }

            if (-not (Test-Path $fullPath)) {
                $response.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                continue
            }

            $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
            $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }

            $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.StatusCode = 200
            $response.ContentType = $contentType
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        }
        catch {
            $response.StatusCode = 500
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('Internal Server Error')
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        finally {
            $response.OutputStream.Close()
            $response.Close()
        }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
