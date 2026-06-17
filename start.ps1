# FraudAI — lancement local en un clic (backend + frontend en mode dev)
# Usage : clic droit > "Exécuter avec PowerShell", ou  ./start.ps1
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot


Write-Host "Demarrage de FraudAI..." -ForegroundColor Cyan


# 1) Backend FastAPI (port 8000)
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root\webapp\backend'; python -m uvicorn main:app --reload --port 8000"
)


# 2) Frontend Vite (port 5173)
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root\webapp\frontend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
)


Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"
Write-Host "Backend : http://localhost:8000   Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "Fermez les deux fenetres PowerShell pour arreter." -ForegroundColor Yellow
