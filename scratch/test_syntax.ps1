$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$testHtml = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\test_syntax.html"
$content = @"
<!DOCTYPE html>
<html>
<head>
<script>
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('JS_ERROR:', msg, 'Line:', lineNo, 'Col:', columnNo);
};
</script>
<script src="../wallpaper-ui/firebase-config.js"></script>
<script src="../wallpaper-ui/firebase-service.js"></script>
<script src="../wallpaper-ui/wallpaper.js"></script>
</head>
<body>
<h1>Testing</h1>
</body>
</html>
"@
Set-Content -Path $testHtml -Value $content

$logFile = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\edge_console.log"
if (Test-Path $logFile) { Remove-Item $logFile }

Start-Process -FilePath $edge -ArgumentList "--headless=new --enable-logging --v=1 --user-data-dir=d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\edge_temp $testHtml" -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 3

# Check log file in edge_temp\chrome_debug.log if generated
$debugLog = "d:\documents\wallpaper_desktop_app\wallpaper-desktop-app\scratch\edge_temp\chrome_debug.log"
if (Test-Path $debugLog) {
    Get-Content $debugLog | Select-String "JS_ERROR", "Uncaught", "SyntaxError", "wallpaper.js" | Write-Host
} else {
    Write-Host "Debug log not found, checking file directly."
}
