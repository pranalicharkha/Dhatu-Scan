$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "python-backend"
Set-Location $backendDir

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
  throw "Python launcher 'py' was not found. Install Python for Windows first."
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
  Write-Host "Creating virtual environment in python-backend\.venv ..."
  py -m venv .venv
}

Write-Host "Installing backend dependencies ..."
& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt

Write-Host "Starting Python backend on http://127.0.0.1:8000 ..."
& ".\.venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
