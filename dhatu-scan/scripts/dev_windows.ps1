$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendScript = Join-Path $repoRoot "scripts\run_backend_windows.ps1"
$frontendScript = Join-Path $repoRoot "scripts\run_frontend_windows.ps1"

Write-Host "Opening backend terminal ..."
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$backendScript`""

Start-Sleep -Seconds 2

Write-Host "Starting frontend in current terminal ..."
powershell -ExecutionPolicy Bypass -File $frontendScript
