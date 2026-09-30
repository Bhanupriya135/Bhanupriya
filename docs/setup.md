# AI MatEsti - Setup Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

## Backend Setup

```bash
cd AI-MatEsti/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
Swagger UI: http://localhost:8000/docs

## Frontend Setup

```bash
cd AI-MatEsti/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: http://localhost:5173

## Demo Credentials

| Email                  | Password   | Role    |
|------------------------|------------|---------|
| demo@aimatesti.com     | demo1234   | Admin   |
| admin@aimatesti.com    | admin1234  | Admin   |

## Workflow

1. Login → demo@aimatesti.com / demo1234
2. Dashboard shows project overview
3. Create Project → enter details (area, floors, type)
4. Upload Drawing → select project, upload PDF/image
5. Analyze Drawing → click Analyze button
6. Material Estimation → select project → Calculate
7. Cost Estimation → view auto-calculated cost breakdown
8. BOQ → Generate BOQ → edit items
9. Reports → Generate Report → View/Print
