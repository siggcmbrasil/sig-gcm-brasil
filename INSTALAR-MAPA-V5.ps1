$ErrorActionPreference = "Stop"

Write-Host "Limpando cache do Next.js..." -ForegroundColor Cyan
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Executando build..." -ForegroundColor Cyan
npm run build
