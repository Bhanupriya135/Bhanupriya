# AI MatEsti - Architecture

## System Architecture

```
┌─────────────────────────────────────┐
│         React Frontend               │
│         Vite + React Router          │
│         Axios API Client             │
│         http://localhost:5173         │
└──────────────┬──────────────────────┘
               │ REST API (JSON)
               ▼
┌─────────────────────────────────────┐
│         FastAPI Backend              │
│         Uvicorn ASGI Server          │
│         http://localhost:8000         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     REST Routers             │    │
│  │  auth / projects / drawings  │    │
│  │  estimation / boq / reports  │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌─────────────────────────────┐    │
│  │     Service Layer            │    │
│  │  EstimationEngine            │    │  ← Future: ML Model
│  │  DrawingService              │    │  ← Future: CV/OCR
│  │  CostService                 │    │
│  │  BOQService                  │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌─────────────────────────────┐    │
│  │     SQLAlchemy ORM           │    │
│  │     SQLite Database          │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Future AI Integration Points

1. **Drawing Analysis** (`drawing_service.py`)
   - Replace `_perform_simulated_analysis()` with CV pipeline
   - OCR: Extract dimensions and text annotations
   - Semantic Segmentation: Detect walls, columns, rooms

2. **Estimation Engine** (`estimation_service.py`)
   - Replace coefficient-based logic with ML inference
   - Input: Project params + drawing analysis
   - Output: Material quantities with confidence

3. **Construction Knowledge Engine**
   - Material specifications database
   - Local code compliance rules (IS codes)
   - Regional pricing intelligence

4. **AI Assistant** (Future)
   - LLM-powered chat for estimation queries
   - Natural language report generation
