Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32Window {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@ -ErrorAction SilentlyContinue

try {
    $hwnd = [Win32Window]::GetForegroundWindow()
    $procId = 0
    [Win32Window]::GetWindowThreadProcessId($hwnd, [ref]$procId)
    if ($procId -gt 0) {
        $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($p) {
            Write-Output "$($p.ProcessName).exe"
            exit 0
        }
    }
} catch {}
Write-Output "unknown"
