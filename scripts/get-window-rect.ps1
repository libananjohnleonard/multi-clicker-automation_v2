param(
    [Parameter(Mandatory = $true)]
    [long]$Handle
)

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class RectApi {
    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$hwnd = [IntPtr]$Handle

if (-not [RectApi]::IsWindow($hwnd)) {
    [PSCustomObject]@{ exists = $false } | ConvertTo-Json -Compress
    exit
}

$rect = New-Object RectApi+RECT
[RectApi]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$isForeground = ([RectApi]::GetForegroundWindow() -eq $hwnd)

[PSCustomObject]@{
    exists = $true
    isForeground = $isForeground
    x = $rect.Left
    y = $rect.Top
    width = $rect.Right - $rect.Left
    height = $rect.Bottom - $rect.Top
} | ConvertTo-Json -Compress
