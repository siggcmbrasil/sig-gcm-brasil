$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$projeto = (Get-Location).Path

Copy-Item "$raiz\app\sistema\mapa-operacional\page.tsx" "$projeto\app\sistema\mapa-operacional\page.tsx" -Force
Copy-Item "$raiz\components\MapaOperacional.tsx" "$projeto\components\MapaOperacional.tsx" -Force

Remove-Item "$projeto\.next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "MAPA V2 INSTALADO COM SUCESSO" -ForegroundColor Green
Write-Host "Agora execute: npm run dev" -ForegroundColor Cyan
