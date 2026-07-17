$zip = "$PWD\SIG-Mapa-Operacional-Tela-Cheia-V4.zip"
$temp = "$PWD\mapa-v4-extraido"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $temp -Force
Copy-Item "$temp\app\sistema\mapa-operacional\page.tsx" "$PWD\app\sistema\mapa-operacional\page.tsx" -Force
Copy-Item "$temp\components\MapaOperacional.tsx" "$PWD\components\MapaOperacional.tsx" -Force
Write-Host "Mapa Operacional V4 instalado." -ForegroundColor Green
