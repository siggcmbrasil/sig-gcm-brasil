$origem = Split-Path -Parent $MyInvocation.MyCommand.Path
$projeto = Get-Location

Copy-Item "$origem\app\sistema\mapa-operacional\page.tsx" "$projeto\app\sistema\mapa-operacional\page.tsx" -Force
Copy-Item "$origem\components\MapaOperacional.tsx" "$projeto\components\MapaOperacional.tsx" -Force

Remove-Item "$projeto\.next" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Mapa Operacional V3 instalado. Execute: npm run build" -ForegroundColor Green
