# Excito Project Structure

This repository uses a monorepo layout:

- `backend/` -> Django project (`excito_backend`) and app (`store`)
- `frontend/` -> Next.js frontend (directory junction to the existing frontend folder)
- `manage.py` -> root Django entrypoint (wrapper), so Django commands work from repository root

## Run Backend (Django)

From repository root:

```powershell
& .\.venv\Scripts\python.exe manage.py runserver 8000
```

## Run Frontend (Next.js)

From repository root:

```powershell
Set-Location frontend
npm run dev
```

## Useful Django Commands (from root)

```powershell
& .\.venv\Scripts\python.exe manage.py check
& .\.venv\Scripts\python.exe manage.py makemigrations
& .\.venv\Scripts\python.exe manage.py migrate
& .\.venv\Scripts\python.exe manage.py createsuperuser
```
