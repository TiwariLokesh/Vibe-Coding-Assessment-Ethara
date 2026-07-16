# Ethara Seat Allocation & Project Mapping

Ethara Seat Allocation & Project Mapping is a full-stack workspace management app for tracking employees, projects, seats, and seat allocations. The backend is a FastAPI service with SQLAlchemy and SQLite by default, and the frontend is a React + Vite single-page app with routed pages for the main workflows.

## What The App Does

- View a dashboard with allocation and workforce summaries.
- Browse and manage employees and projects.
- Inspect seat inventory by floor, zone, and bay.
- Allocate seats to employees and review allocation state.
- Search across the workspace.
- Use an AI assistant page for assisted workflows.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Frontend: React 19, Vite, React Router
- UI and charts: Tailwind CSS, Lucide React, Recharts
- Data: SQLite by default, with PostgreSQL support through `DATABASE_URL`

## Repository Layout

- `backend/` - FastAPI API, models, services, database, and seed scripts
- `frontend/` - React app, pages, shared components, and API clients

## Prerequisites

- Python 3.11+ recommended
- Node.js 20+ recommended
- npm for the frontend dependencies

## Backend Setup

From the `backend/` folder:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`, with interactive docs at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Backend Seeding

The project includes a seed script that creates sample projects, employees, seats, and allocations.

```bash
python -m app.seed
```

You can also enable seeding on startup by setting `SEED_ON_STARTUP=true` in the backend environment.

## Frontend Setup

From the `frontend/` folder:

```bash
npm install
npm run dev
```

The app runs on Vite's default dev server at `http://localhost:5173`.

## Environment Variables

### Backend

The backend reads configuration from `backend/.env` if present.

- `ENVIRONMENT` - runtime environment name, defaults to `development`
- `DEBUG` - enables FastAPI debug mode, defaults to `false`
- `DATABASE_URL` - SQLAlchemy connection string, defaults to `sqlite:///./ethara.db`
- `ALLOWED_ORIGINS` - comma-separated CORS origins, defaults to local Vite hosts
- `LOG_LEVEL` - logging level, defaults to `INFO`
- `SEED_ON_STARTUP` - seeds the database during startup when `true`

Example backend `.env`:

```env
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=sqlite:///./ethara.db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LOG_LEVEL=INFO
SEED_ON_STARTUP=false
```

### Frontend

The frontend uses `VITE_API_BASE_URL` to point at the API.

- Default value: `http://localhost:8000/api/v1`

Example frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Available Pages

- `/` - Dashboard
- `/employees` - Employees
- `/projects` - Projects
- `/seats` - Seats
- `/allocation` - Seat allocation
- `/search` - Search
- `/ai` - AI assistant
- `/missing` - 404 page

## API Overview

The backend exposes versioned routes under `/api/v1` and includes modules for:

- Health
- Employees
- Projects
- Seats
- Allocations
- Dashboard
- Search
- AI

Health check example:

```bash
GET /api/v1/health
```

## Seed Data

The seed script builds a realistic sample dataset:

- 11 projects
- 5,000 employees
- 5,500 seats
- 4,900 active allocations
- 50 pending allocations

This makes the dashboard and allocation workflows useful immediately after setup.

## Development Notes

- The frontend API client falls back to `http://localhost:8000/api/v1` when `VITE_API_BASE_URL` is not set.
- CORS is configured for local frontend hosts by default.
- The backend uses SQLite by default, so the project works locally without any external database.

## Useful Commands

Backend:

```bash
uvicorn app.main:app --reload
python -m app.seed
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

## License

No license file is included in this repository.
