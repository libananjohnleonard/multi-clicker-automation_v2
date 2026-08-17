param(
    [Parameter(Mandatory = $true)]
    [long]$Handle
)

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class FocusApi {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$hwnd = [IntPtr]$Handle
$SW_MAXIMIZE = 3

$foreground = [FocusApi]::GetForegroundWindow()
$foreThread = 0
[FocusApi]::GetWindowThreadProcessId($foreground, [ref]$foreThread) | Out-Null
$targetThread = 0
[FocusApi]::GetWindowThreadProcessId($hwnd, [ref]$targetThread) | Out-Null
$curThread = [FocusApi]::GetCurrentThreadId()

[FocusApi]::AttachThreadInput($curThread, $foreThread, $true) | Out-Null
[FocusApi]::AttachThreadInput($curThread, $targetThread, $true) | Out-Null

[FocusApi]::ShowWindow($hwnd, $SW_MAXIMIZE) | Out-Null
$success = [FocusApi]::SetForegroundWindow($hwnd)

[FocusApi]::AttachThreadInput($curThread, $foreThread, $false) | Out-Null
[FocusApi]::AttachThreadInput($curThread, $targetThread, $false) | Out-Null

$rect = New-Object FocusApi+RECT
[FocusApi]::GetWindowRect($hwnd, [ref]$rect) | Out-Null

$result = [PSCustomObject]@{
    success = $success
    x = $rect.Left
    y = $rect.Top
    width = $rect.Right - $rect.Left
    height = $rect.Bottom - $rect.Top
}

$result | ConvertTo-Json -Compress
