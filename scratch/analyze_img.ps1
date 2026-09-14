Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\jagad\.gemini\antigravity-ide\brain\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc\.user_uploaded\media_1789294230200.png"
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

Write-Host "Checking row y=120:"
for ($x = 0; $x -lt 40; $x++) {
    $c = $bmp.GetPixel($x, 120)
    Write-Host "x=$x : R=$($c.R), G=$($c.G), B=$($c.B)"
}

Write-Host "Checking vertical line around x=20-30:"
for ($x = 0; $x -lt 50; $x++) {
    $c = $bmp.GetPixel($x, 50)
    Write-Host "y=50, x=$x : R=$($c.R), G=$($c.G), B=$($c.B)"
}

$bmp.Dispose()
