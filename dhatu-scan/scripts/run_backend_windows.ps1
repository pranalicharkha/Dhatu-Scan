$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "python-backend"
Set-Location $backendDir

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
  throw "Python launcher 'py' was not found. Install Python for Windows first."
}

function Get-PythonLauncherArgs {
  $installed = py -0p 2>$null
  if ($installed -match " -V:3\.11") {
    return @("-3.11")
  }
  return @()
}

$pythonLauncherArgs = Get-PythonLauncherArgs
$venvDir = Join-Path $backendDir ".venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"
$venvPip = Join-Path $venvDir "Scripts\pip.exe"
$needsVenv = -not (Test-Path $venvPython)

if (-not $needsVenv) {
  if (-not (Test-Path $venvPip)) {
    Write-Host "Existing virtual environment is missing pip. Recreating python-backend\.venv ..."
    Remove-Item -Recurse -Force $venvDir
    $needsVenv = $true
  }
}

if ($needsVenv) {
  Write-Host "Creating virtual environment in python-backend\.venv ..."
  & py @pythonLauncherArgs -m venv $venvDir
}

Write-Host "Installing backend dependencies ..."
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r requirements.txt

Write-Host "Starting Python backend on http://0.0.0.0:8000 ..."
& $venvPython -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
