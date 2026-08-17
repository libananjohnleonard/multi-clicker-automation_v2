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

public struct MOUSEINPUT {
    public int dx;
    public int dy;
    public uint mouseData;
    public uint dwFlags;
    public uint time;
    public IntPtr dwExtraInfo;
}

public struct INPUT {
    public int type;
    public MOUSEINPUT mi;
}

public class SendInputApi {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);
}
"@

$MOUSEEVENTF_MOVE = 0x0001
$MOUSEEVENTF_LEFTDOWN = 0x0002
$MOUSEEVENTF_LEFTUP = 0x0004
$MOUSEEVENTF_ABSOLUTE = 0x8000
$MOUSEEVENTF_VIRTUALDESK = 0x4000

$SM_XVIRTUALSCREEN = 76
$SM_YVIRTUALSCREEN = 77
$SM_CXVIRTUALSCREEN = 78
$SM_CYVIRTUALSCREEN = 79

$vLeft = [SendInputApi]::GetSystemMetrics($SM_XVIRTUALSCREEN)
$vTop = [SendInputApi]::GetSystemMetrics($SM_YVIRTUALSCREEN)
$vWidth = [SendInputApi]::GetSystemMetrics($SM_CXVIRTUALSCREEN)
$vHeight = [SendInputApi]::GetSystemMetrics($SM_CYVIRTUALSCREEN)

$inputSize = [System.Runtime.InteropServices.Marshal]::SizeOf([Type][INPUT])

function Send-Click([int]$x, [int]$y) {
    $nx = [int]((($x - $vLeft) * 65536) / $vWidth)
    $ny = [int]((($y - $vTop) * 65536) / $vHeight)

    $moveFlags = $MOUSEEVENTF_MOVE -bor $MOUSEEVENTF_ABSOLUTE -bor $MOUSEEVENTF_VIRTUALDESK
    $downFlags = $MOUSEEVENTF_LEFTDOWN -bor $MOUSEEVENTF_ABSOLUTE -bor $MOUSEEVENTF_VIRTUALDESK
    $upFlags = $MOUSEEVENTF_LEFTUP -bor $MOUSEEVENTF_ABSOLUTE -bor $MOUSEEVENTF_VIRTUALDESK

    $move = New-Object INPUT
    $move.type = 0
    $move.mi.dx = $nx
    $move.mi.dy = $ny
    $move.mi.dwFlags = $moveFlags

    $down = New-Object INPUT
    $down.type = 0
    $down.mi.dx = $nx
    $down.mi.dy = $ny
    $down.mi.dwFlags = $downFlags

    $up = New-Object INPUT
    $up.type = 0
    $up.mi.dx = $nx
    $up.mi.dy = $ny
    $up.mi.dwFlags = $upFlags

    [SendInputApi]::SendInput(1, @($move), $inputSize) | Out-Null
    Start-Sleep -Milliseconds 30
    [SendInputApi]::SendInput(1, @($down), $inputSize) | Out-Null
    Start-Sleep -Milliseconds 50
    [SendInputApi]::SendInput(1, @($up), $inputSize) | Out-Null
}

for ($row = 0; $row -lt $Rows; $row++) {
    for ($col = 0; $col -lt $Cols; $col++) {
        $x = $GridX + ($col * $CellSize) + [int]($CellSize / 2)
        $y = $GridY + ($row * $CellSize) + [int]($CellSize / 2)
        Send-Click $x $y
    }
}

'{"success":true}'
