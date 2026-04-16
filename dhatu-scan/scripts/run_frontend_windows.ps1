$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot "src\frontend"
Set-Location -Path $frontendDir

if (-not (Get-Command npm -ErrorAction SilentlyContinue) -and -not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw "npm or pnpm was not found. Install Node.js for Windows first."
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing frontend dependencies ..."
  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm install
  } else {
    npm install
  }
}

Write-Host "Starting frontend dev server ..."
npm run dev
