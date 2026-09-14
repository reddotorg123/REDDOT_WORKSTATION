Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile('C:\Users\jagad\.gemini\antigravity-ide\brain\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc\inspect_full_geometry.png')
$rect = New-Object System.Drawing.Rectangle(0, 140, 340, 120)
$crop = $src.Clone($rect, $src.PixelFormat)
$crop.Save('C:\Users\jagad\.gemini\antigravity-ide\brain\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc\crop_nav_fixed.png')
$src.Dispose()
$crop.Dispose()
Write-Host "Saved crop_nav_fixed.png"
