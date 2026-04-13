$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot "src\frontend"
Set-Location $frontendDir

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm was not found. Install Node.js for Windows first."
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing frontend dependencies ..."
  npm install
}

Write-Host "Starting frontend dev server ..."
npm run dev
