param([int]$Port = 8642)
$root = Split-Path -Parent $PSScriptRoot
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $root on http://localhost:$Port/"
$types = @{ '.html'='text/html'; '.js'='text/javascript'; '.css'='text/css'; '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.woff2'='font/woff2'; '.png'='image/png'; '.svg'='image/svg+xml'; '.json'='application/json' }
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  if ($p -eq '') { $p = 'index.html' }
  $f = Join-Path $root $p
  try {
    if (Test-Path $f -PathType Leaf) {
      $b = [IO.File]::ReadAllBytes($f)
      $ext = [IO.Path]::GetExtension($f).ToLower()
      $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' })
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $ctx.Response.ContentLength64 = $b.Length
      $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $ctx.Response.StatusCode = 404 }
  } catch {}
  $ctx.Response.Close()
}
