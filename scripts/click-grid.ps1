param(
    [Parameter(Mandatory = $true)]
    [long]$Handle,
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

public class ClickApi {
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool ScreenToClient(IntPtr hWnd, ref POINT lpPoint);

    public struct POINT { public int X; public int Y; }
}
"@

$WM_LBUTTONDOWN = 0x0201
$WM_LBUTTONUP = 0x0202
$MK_LBUTTON = [IntPtr]0x0001

$hwnd = [IntPtr]$Handle

for ($row = 0; $row -lt $Rows; $row++) {
    for ($col = 0; $col -lt $Cols; $col++) {
        $screenX = $GridX + ($col * $CellSize) + [int]($CellSize / 2)
        $screenY = $GridY + ($row * $CellSize) + [int]($CellSize / 2)

        $pt = New-Object ClickApi+POINT
        $pt.X = $screenX
        $pt.Y = $screenY
        [ClickApi]::ScreenToClient($hwnd, [ref]$pt) | Out-Null

        [int64]$packed = ((($pt.Y -band 0xFFFF) -shl 16) -bor ($pt.X -band 0xFFFF))
        $packed = $packed -band 0xFFFFFFFF
        $lParam = [IntPtr]$packed

        [ClickApi]::PostMessage($hwnd, $WM_LBUTTONDOWN, $MK_LBUTTON, $lParam) | Out-Null
        [ClickApi]::PostMessage($hwnd, $WM_LBUTTONUP, [IntPtr]0, $lParam) | Out-Null
    }
}

'{"success":true}'
