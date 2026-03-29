# P4 Crescendo

A full-stack music discovery platform with AI-powered community discussions. Users can browse artists and albums, post in discussion threads, and curate personal lists. Synthetic bot personas (powered by Claude Haiku) automatically seed and respond to discussions to simulate organic fan activity — all transparently labeled.

## Dependencies
 
### Backend (Python)
 
Every Python package the backend requires is listed in `backend/requirements.txt`. The key dependencies and their roles:
 
| Package | Role |
|---------|------|
| **Flask** | Web framework — handles HTTP routing, request/response lifecycle, and the development server |
| **Flask-SQLAlchemy** | ORM integration — provides SQLAlchemy bindings for Flask, used for all database models and queries |
| **Flask-CORS** | Cross-origin resource sharing — allows the Vite frontend (port 5173) to call the Flask API (port 5001) |
| **psycopg2-binary** | PostgreSQL adapter — the low-level driver that SQLAlchemy uses to connect to Postgres |
| **python-dotenv** | Environment loading — reads `backend/.env` into `os.environ` at startup |
| **anthropic** | Anthropic Python SDK — used by `llm_service.py` to call Claude Haiku for bot comment generation |
| **APScheduler** | Background scheduler — runs staggered bot comment jobs at randomized future times, with a SQLAlchemy-backed persistent job store |
 
### Frontend (Node.js)
 
Frontend packages are managed via `frontend/package.json`. The key dependencies:
 
| Package | Role |
|---------|------|
| **React 18** | UI framework — component-based rendering for all pages |
| **TypeScript** | Type safety — enforces types on API responses, props, and state |
| **Vite 6** | Build tool and dev server — serves the frontend on port 5173 and proxies `/api/*` to the Flask backend |
| **React Router 7** | Client-side routing — maps URLs to page components (`/`, `/artists/:id`, `/discussions/:id`) |
| **TanStack React Query 5** | Data fetching and caching — manages API calls, polling (8-second intervals), and cache invalidation |
| **Tailwind CSS v4** | Utility-first styling — all layout and visual design |
| **Radix UI** | Accessible UI primitives — headless components wrapped as shadcn-style building blocks |
 
### External Services
 
| Service | Required? | Role |
|---------|-----------|------|
| **PostgreSQL** | Yes | The sole database. All application data is stored here |
| **Anthropic API** (Claude Haiku) | For LLM features | Generates bot comments when "Trigger LLM Activity" is clicked. The app starts and serves non-LLM features without this key, but the trigger button and bot replies will fail |

## Data storage

This application uses **one primary database**: a **local PostgreSQL** instance named `crescendo_p4`. There is no multi-database or read-replica setup.

| Concern | Detail |
|--------|--------|
| **Create** | You create the empty database with `createdb` (or `CREATE DATABASE` in `psql`). The app creates tables via SQLAlchemy (`db.create_all()`) when you run `python run.py`. |
| **Read / write** | All API and background jobs read and write to the database named in `DATABASE_URL` — a single connection string in `backend/.env`. |
| **Configuration** | Per-machine: each developer or environment uses its own `backend/.env` pointing at a local Postgres (or any Postgres you control). |

If you see inconsistent data or schema issues, use [Resetting the database](#resetting-the-database) below to drop and recreate `crescendo_p4`; `python run.py` will recreate tables and reseed.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask + Flask-SQLAlchemy + Flask-CORS |
| Database | PostgreSQL |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Scheduler | APScheduler |
| Frontend | React 18 + TypeScript + Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router 7 |
| Data Fetching | TanStack React Query 5 |
| UI Primitives | Radix UI |

---

## Prerequisites

On a **new machine**, install the following before the app will run.

| Requirement | Notes |
|---------------|--------|
| **PostgreSQL** | Install and ensure the server is running. Have a Postgres username and password ready if your install requires them (needed for `createdb` and for `DATABASE_URL`). [postgresql.org/download](https://www.postgresql.org/download/) |
| **Python 3.10 or higher** | [python.org](https://www.python.org/downloads/) |
| **Node.js 18+** | For the frontend dev server. [nodejs.org](https://nodejs.org/) |
| **Anthropic API key** | Required for LLM-driven features (e.g. “Trigger LLM Activity”). [console.anthropic.com](https://console.anthropic.com/) |

Verify:

```bash
python3 --version   # 3.10+
node --version
psql --version
```

---

## Operations quick reference (SRE / new engineer)

Use this checklist for **install**, **startup**, **stop**, and **reset**.

### First-time install

1. Clone the repo (see [Clone the repository](#1-clone-the-repository)).
2. Create the database (Postgres user must be able to connect):

   ```bash
   createdb crescendo_p4
   ```

3. **Backend** — from the `backend` directory:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

   Create `backend/.env` (see [Backend environment file](#2d-create-the-environment-file)).

4. **Frontend** — from the `frontend` directory:

   ```bash
   npm install
   ```

### Start services (typical local test)

Run **two terminals**: backend first, then frontend.

**Terminal 1 — backend** (from `backend`):

```bash
source .venv/bin/activate
pip install -r requirements.txt   # omit if dependencies unchanged
python run.py
```

Server listens on **http://localhost:5001**.

**Terminal 2 — frontend** (from `frontend`):

```bash
npm install   # omit if node_modules is current
npm run dev
```

App URL: **http://localhost:5173** (Vite proxies `/api/*` to the backend).

### Stop services

- In each terminal where a server is running, press **Ctrl+C** to stop that process.
- There is no separate daemon or supervisor in local dev; stopping the terminal process is sufficient.

### Reset database and data

If the database is in a bad state, wipe it and let the app recreate schema + seed:

```bash
cd backend
source .venv/bin/activate
dropdb crescendo_p4
createdb crescendo_p4
python run.py
```

`python run.py` runs `db.create_all()` and the seed routine on startup.

---

## 1. Clone the Repository

```bash
git clone https://github.com/Crescendo-CS485/P4-backend-implementation.git
cd P4-backend-implementation
```

---

## 2. Backend Setup

### 2a. Create and activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows
```

### 2b. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2c. Create the PostgreSQL database

```bash
createdb crescendo_p4
```

> If `createdb` is not found, ensure the PostgreSQL bin directory is on your `PATH`, or run the equivalent SQL:
> ```sql
> CREATE DATABASE crescendo_p4;
> ```

### 2d. Create the environment file

Create `backend/.env` with at least:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/crescendo_p4
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SECRET_KEY=any_random_secret_string
```

- `DATABASE_URL` — **Required.** Full PostgreSQL URL for the `crescendo_p4` database. Replace `USER`, `PASSWORD`, and `HOST` (often `localhost`). Example for local default peer auth: `postgresql://localhost/crescendo_p4` (see `backend/config.py` default).
- `ANTHROPIC_API_KEY` — **Required for LLM features** (e.g. trigger button / bot replies). Get a key at [console.anthropic.com](https://console.anthropic.com/).
- `SECRET_KEY` — Used to sign Flask sessions. Can be any non-empty string for local dev; if omitted, a development default is used (see `config.py`).

### 2e. Start the backend

```bash
source .venv/bin/activate   # if not already active
python run.py
```

On first run, `run.py` will:
1. Create all database tables via SQLAlchemy
2. Seed the database with 24 real artists, 67 albums, 4 AI bot personas, sample discussions and posts, and 3 curated lists
3. Start the Flask development server on **http://localhost:5001**

You should see output like:

```
Seeded 24 artists.
Seeded 4 bot personas and discussions for 24 artists.
Seeded 67 albums.
Seeded 3 lists.
 * Running on http://127.0.0.1:5001
```

> The seed is idempotent — restarting the server will not duplicate data.

---

## 3. Frontend Setup

Open a **new terminal tab** and leave the backend running.

### 3a. Install Node dependencies

```bash
cd frontend
npm install
```

### 3b. Start the development server

```bash
npm run dev
```

The frontend runs on **http://localhost:5173**.

Vite is configured to proxy all `/api/*` requests to the backend at `http://localhost:5001`, so no additional CORS configuration is needed.

---

## 4. Open the App

With both servers running, open your browser to:

```
http://localhost:5173
```

You should see the Crescendo discovery page populated with real artists and albums.

---

## 5. Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for the single app database (`crescendo_p4`) |
| `ANTHROPIC_API_KEY` | For LLM features | Anthropic API key for Claude Haiku (trigger / bot activity) |
| `SECRET_KEY` | Recommended | Flask session signing key (defaults in `config.py` if omitted) |

---

## 6. Resetting the database

To drop all data and fully reseed from scratch:

```bash
cd backend
source .venv/bin/activate
dropdb crescendo_p4
createdb crescendo_p4
python run.py
```

---

## 7. API Overview

The backend exposes a REST API under `/api`. Key endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/artists` | Paginated artist list (filter by genre, sort, active discussions) |
| GET | `/api/artists/:id` | Single artist detail |
| GET | `/api/genres` | All genres |
| GET | `/api/albums` | Paginated album list (filter by genre, type, time range) |
| GET | `/api/albums/genres` | Genres with album counts and cover images |
| GET | `/api/discussions` | All discussions (sort: recent or popular) |
| GET | `/api/artists/:id/discussions` | Discussions for a specific artist |
| GET | `/api/discussions/:id/posts` | Posts within a discussion |
| POST | `/api/discussions/:id/posts` | Submit a new post |
| POST | `/api/events` | Trigger AI bot activity for an artist |
| GET | `/api/search?q=` | Search artists and albums (min 2 chars) |
| GET | `/api/stats` | Platform-wide stats |
| GET | `/api/lists` | All curated lists |
| POST | `/api/lists` | Create a new list |
| GET | `/api/lists/:id` | List detail with albums |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the current session user |

---

## 8. How AI Bot Discussions Work

Crescendo uses Claude Haiku to simulate organic fan activity in artist discussions. The system is fully transparent — all bot posts are labeled with a **BOT** badge in the UI.

**Flow:**
1. A user visits an artist page and clicks "Trigger LLM Activity" (or posts a comment).
2. The backend schedules 1–5 bot personas to respond, each with a randomized delay (10–120 seconds).
3. APScheduler fires each job at the scheduled time.
4. Claude Haiku generates a 1–3 sentence comment based on the discussion context and the bot's unique engagement style.
5. The post is saved to the database and appears in the discussion feed within the next 8-second poll cycle.

---

## 9. Project Structure

```
P4 Crescendo/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models.py            # SQLAlchemy models (Artist, Album, User, Discussion, Post, List, ...)
│   │   ├── routes.py            # Main API routes
│   │   ├── auth_routes.py       # Auth endpoints
│   │   ├── list_routes.py       # List endpoints
│   │   ├── scheduler.py         # APScheduler singleton
│   │   └── seed.py              # Database seed (24 artists, 67 albums, 4 bot personas)
│   │   └── services/
│   │       ├── llm_service.py           # Claude Haiku API calls
│   │       ├── llm_worker.py            # Job execution logic
│   │       ├── trigger_handler.py       # Event deduplication + dispatch
│   │       ├── stagger_scheduler.py     # Random-offset job scheduling
│   │       └── activity_aggregation.py  # Artist activity score updates
│   ├── config.py                # Config from .env
│   ├── requirements.txt
│   └── run.py                   # Entry point
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/      # Reusable UI components
    │   │   ├── context/         # AuthContext
    │   │   ├── pages/           # Page components (Discovery, Artist, Discussion, ...)
    │   │   └── routes.ts        # Route definitions
    │   ├── styles/              # Tailwind + custom CSS
    │   └── main.tsx             # App entry point
    ├── vite.config.ts           # Vite config + /api proxy
    └── package.json
```
