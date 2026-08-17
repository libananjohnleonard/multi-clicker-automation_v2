Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public class WinApi {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern IntPtr GetShellWindow();

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$shellWindow = [WinApi]::GetShellWindow()
$results = New-Object System.Collections.Generic.List[Object]

$enumProc = {
    param($hWnd, $lParam)

    if ($hWnd -eq $shellWindow) { return $true }
    if (-not [WinApi]::IsWindowVisible($hWnd)) { return $true }

    $length = [WinApi]::GetWindowTextLength($hWnd)
    if ($length -eq 0) { return $true }

    $sb = New-Object System.Text.StringBuilder ($length + 1)
    [WinApi]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null
    $title = $sb.ToString()
    if ([string]::IsNullOrWhiteSpace($title)) { return $true }

    $rect = New-Object WinApi+RECT
    [WinApi]::GetWindowRect($hWnd, [ref]$rect) | Out-Null
    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    if ($width -le 0 -or $height -le 0) { return $true }

    $procId = 0
    [WinApi]::GetWindowThreadProcessId($hWnd, [ref]$procId) | Out-Null

    try {
        $proc = Get-Process -Id $procId -ErrorAction Stop
        $procName = $proc.ProcessName
    } catch {
        $procName = "unknown"
    }

    $results.Add([PSCustomObject]@{
        handle = $hWnd.ToInt64()
        title = $title
        processId = $procId
        processName = $procName
        x = $rect.Left
        y = $rect.Top
        width = $width
        height = $height
    })

    return $true
}

[WinApi]::EnumWindows($enumProc, [IntPtr]::Zero) | Out-Null

$results | ConvertTo-Json -Compress
