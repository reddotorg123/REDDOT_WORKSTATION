Add-Type @'
  using System;
  using System.Text;
  using System.Runtime.InteropServices;
  using System.Collections.Generic;

  public class WinChecker {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder strText, int maxCount);

    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
      public int Left;
      public int Top;
      public int Right;
      public int Bottom;
    }

    public static void DumpByPids(int[] pids) {
      HashSet<int> set = new HashSet<int>(pids);
      Console.WriteLine("Target PIDs: " + string.Join(", ", pids));
      EnumWindows((hWnd, lParam) => {
        uint pid;
        GetWindowThreadProcessId(hWnd, out pid);
        if (set.Contains((int)pid)) {
          int len = GetWindowTextLength(hWnd);
          StringBuilder sb = new StringBuilder(len + 1);
          GetWindowText(hWnd, sb, sb.Capacity);
          string title = sb.ToString();
          bool vis = IsWindowVisible(hWnd);
          RECT r;
          GetWindowRect(hWnd, out r);
          Console.WriteLine("PID:" + pid + " | Vis:" + vis + " | Handle:" + hWnd + " | Rect:[" + r.Left + "," + r.Top + "," + r.Right + "," + r.Bottom + "] | Title:'" + title + "'");
        }
        return true;
      }, IntPtr.Zero);
    }
  }
'@

$pids = @(Get-Process -Name "*REDDOT*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
[WinChecker]::DumpByPids([int[]]$pids)
