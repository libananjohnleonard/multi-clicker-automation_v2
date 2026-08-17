param(
    [Parameter(Mandatory = $true)]
    [int]$GridX,
    [Parameter(Mandatory = $true)]
    [int]$GridY,
    [Parameter(Mandatory = $true)]
    [int]$Cols,
    [Parameter(Mandatory = $true)]
    [int]$Rows,
    [Parameter(Mandatory = $true)]
    [int]$CellSize
)

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class CursorClickApi {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, IntPtr dwExtraInfo);
}
"@

$MOUSEEVENTF_LEFTDOWN = 0x0002
$MOUSEEVENTF_LEFTUP = 0x0004

for ($row = 0; $row -lt $Rows; $row++) {
    for ($col = 0; $col -lt $Cols; $col++) {
        $x = $GridX + ($col * $CellSize) + [int]($CellSize / 2)
        $y = $GridY + ($row * $CellSize) + [int]($CellSize / 2)

        [CursorClickApi]::SetCursorPos($x, $y) | Out-Null
        [CursorClickApi]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, [IntPtr]::Zero)
        [CursorClickApi]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, [IntPtr]::Zero)
    }
}

'{"success":true}'
