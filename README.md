# AI MatEsti — AI-Powered Construction Estimation Platform

> A full-stack MVP web application for construction material estimation, BOQ generation, and project cost analysis.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router, Axios |
| Backend    | Python, FastAPI, Uvicorn            |
| Database   | SQLite, SQLAlchemy ORM              |
| Charts     | Recharts                            |
| UI         | Custom CSS (Sky Blue theme)         |
| Auth       | JWT (python-jose, passlib/bcrypt)   |

## Project Structure

```
AI-MatEsti/
├── frontend/          React + Vite application
├── backend/           FastAPI + Python application
├── database/          Schema SQL + seed scripts
├── api/               API documentation
├── docs/              Architecture + setup guides
├── tests/             Test files
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd AI-MatEsti/backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: http://localhost:8000
Swagger: http://localhost:8000/docs

### 2. Frontend (new terminal)

```bash
cd AI-MatEsti/frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Demo Credentials

| Email                  | Password   |
|------------------------|------------|
| demo@aimatesti.com     | demo1234   |
| admin@aimatesti.com    | admin1234  |

## Core Workflow

```
Login → Create Project → Upload Drawing → Analyze Drawing
→ Calculate Materials → View Cost Breakdown → Generate BOQ
→ Generate Report → Print/Export
```

## Features

- **Dashboard** — KPI cards, charts, recent projects
- **Projects** — Full CRUD with search and filtering
- **Drawing Analysis** — Upload + simulated AI analysis
- **Material Estimation** — Auto-calculate 13+ materials per project
- **Cost Estimation** — Material + Labor + Equipment + Tax breakdown
- **BOQ Generation** — Auto-generate from estimations, edit inline
- **Reports** — Full project report with all data, print-ready
- **Materials DB** — 30+ seeded materials with INR pricing
- **Settings** — Profile, preferences, security

## Estimation Engine

Uses coefficient-based calculation (IS code norms) per sqft of built-up area.
The engine calculates Cement, Steel, Sand, Aggregates, Bricks, Tiles, Paint, etc.

> **Future AI integration:** Replace `estimation_service.py::calculate_estimation()`  
> with ML model inference for data-driven quantity predictions.

## AI Integration Roadmap

| Component            | Current (MVP)         | Future Integration        |
|----------------------|-----------------------|---------------------------|
| Drawing Analysis     | Simulated analysis    | CV + OCR pipeline         |
| Quantity Estimation  | Coefficient engine    | ML regression model       |
| BOQ Generation       | Rule-based            | NLP + knowledge engine    |
| Cost Prediction      | Fixed ratios          | Historical data model     |
| AI Assistant         | Not implemented       | LLM (GPT/Gemini)          |
