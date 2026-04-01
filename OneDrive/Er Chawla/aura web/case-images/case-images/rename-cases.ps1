# Rename Case Images Script
# Run this inside the case-images folder
# Right-click this file → "Run with PowerShell"

Set-Location $PSScriptRoot

$renames = @(
    @{ From = "Abrupt Anotomy.jpeg";                         To = "case01.jpg" },
    @{ From = "2.jpeg";                                       To = "case02.jpg" },
    @{ From = "3.jpg.jpeg";                                   To = "case03.jpg" },
    @{ From = "4jpeg.jpeg";                                   To = "case04.jpg" },
    @{ From = "5.jpeg";                                       To = "case05.jpg" },
    @{ From = "6.jpeg";                                       To = "case06.jpg" },
    @{ From = "7j.peg.jpeg";                                  To = "case07.jpg" },
    @{ From = "8.jpeg";                                       To = "case08.jpg" },
    @{ From = "9.jpeg";                                       To = "case09.jpg" },
    @{ From = "Pre op.jpeg";                                  To = "case10.jpg" },
    @{ From = "11.jpeg";                                      To = "case11.jpg" },
    @{ From = "12.jpeg";                                      To = "case12.jpg" },
    @{ From = "13.jpeg";                                      To = "case13.jpg" },
    @{ From = "14.jpeg";                                      To = "case14.jpg" },
    @{ From = "15.jpeg";                                      To = "case15.jpg" },
    @{ From = "16.jpeg";                                      To = "case16.jpg" },
    @{ From = "17.jpeg";                                      To = "case17.jpg" },
    @{ From = "18.jpeg";                                      To = "case18.jpg" },
    @{ From = "curvature management.jpeg";                    To = "case19.jpg" },
    @{ From = "20.jpeg";                                      To = "case20.jpg" },
    @{ From = "21.jpeg";                                      To = "case21.jpg" },
    @{ From = "file retrivel.jpeg";                           To = "case22.jpg" },
    @{ From = "Head of File Visible under Magnification.jpeg";To = "case23.jpg" },
    @{ From = "Healing.jpeg";                                 To = "case24.jpg" },
    @{ From = "ledge management.jpeg";                        To = "case25.jpg" }
)

foreach ($r in $renames) {
    if (Test-Path $r.From) {
        Rename-Item -Path $r.From -NewName $r.To
        Write-Host "Renamed: $($r.From) → $($r.To)" -ForegroundColor Green
    } else {
        Write-Host "NOT FOUND: $($r.From)" -ForegroundColor Red
    }
}

Write-Host "`nDone! Press any key to close." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")