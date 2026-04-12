# Dhatu-Scan Python Backend

## Start server

```bash
cd python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

## API endpoints

- `GET /health`
- `POST /guidance`
- `POST /assessment`
- `GET /reports`
- `GET /reports/{report_id}`
- `DELETE /reports/{report_id}`

## Frontend integration

Frontend calls this backend through `src/frontend/src/lib/backendApi.ts`.

Default URL:

- `http://127.0.0.1:8000`

Optional override:

- set `VITE_PY_BACKEND_URL` before running frontend.
