# Run Without WSL (Windows Only)

This project now supports a pure Windows setup for active development (Python backend + React frontend).

## Recommended location

Use a local non-OneDrive path to avoid file permission issues:

- `C:\dev\dhatu-scan`

## Prerequisites

- Python 3.10+ (with `py` launcher)
- Node.js 20 LTS (includes `npm`)

## One-command dev start

From repo root:

```powershell
npm run dev:windows
```

This opens:

- Python backend at `http://127.0.0.1:8000`
- Frontend Vite dev server in current terminal

If you need manual PowerShell startup, use PowerShell-friendly navigation like this:

```powershell
Set-Location -Path 'C:\Dhatu-Scan\dhatu-scan\src\frontend'
npm run dev
```

> Note: `cd /d ...` is a valid CMD command, but not a PowerShell command. Use `Set-Location -Path ...` in PowerShell.

## Run separately (optional)

Backend:

```powershell
npm run dev:backend:windows
```

Frontend:

```powershell
npm run dev:frontend:windows
```

## Health check

Open:

- `http://127.0.0.1:8000/health`
