from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import create_tables
from app.routers import auth, projects, drawings, materials, estimation, boq, reports
from app.routers import exports, revisions, tenders
import os

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Construction Material Estimation Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # open for local dev
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(projects.router, prefix=settings.API_PREFIX)
app.include_router(drawings.router, prefix=settings.API_PREFIX)
app.include_router(materials.router, prefix=settings.API_PREFIX)
app.include_router(estimation.router, prefix=settings.API_PREFIX)
app.include_router(boq.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(exports.router, prefix=settings.API_PREFIX)
app.include_router(revisions.router, prefix=settings.API_PREFIX)
app.include_router(tenders.router, prefix=settings.API_PREFIX)

# Mount static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Initialize database tables and seed data on startup."""
    create_tables()
    await seed_initial_data()


async def seed_initial_data():
    """Seed database with demo data if empty."""
    from app.core.database import SessionLocal
    import app.models  # ensure all models loaded
    from app.models.user import User
    from app.models.material import Material
    from app.models.project import Project
    from app.utils.auth import hash_password
    from datetime import datetime

    db = SessionLocal()
    try:
        # Seed demo user
        if db.query(User).count() == 0:
            demo_user = User(
                name="Rajesh Kumar",
                email="demo@aimatesti.com",
                password_hash=hash_password("demo1234"),
                role="admin",
                is_active=True,
            )
            db.add(demo_user)

            admin_user = User(
                name="Admin User",
                email="admin@aimatesti.com",
                password_hash=hash_password("admin1234"),
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()

        # Seed materials
        if db.query(Material).count() == 0:
            materials_data = [
                # Cement
                {"name": "OPC Cement (53 Grade)", "category": "Cement", "unit": "bag", "rate": 420, "location": "Bangalore"},
                {"name": "PPC Cement", "category": "Cement", "unit": "bag", "rate": 395, "location": "Bangalore"},
                {"name": "White Cement", "category": "Cement", "unit": "bag", "rate": 850, "location": "Bangalore"},
                # Steel
                {"name": "TMT Steel (Fe 500)", "category": "Steel", "unit": "kg", "rate": 75, "location": "Bangalore"},
                {"name": "Mild Steel", "category": "Steel", "unit": "kg", "rate": 68, "location": "Bangalore"},
                {"name": "Stainless Steel Rods", "category": "Steel", "unit": "kg", "rate": 180, "location": "Bangalore"},
                # Sand
                {"name": "River Sand (Fine)", "category": "Sand", "unit": "cft", "rate": 55, "location": "Bangalore"},
                {"name": "M-Sand (Manufactured)", "category": "Sand", "unit": "cft", "rate": 45, "location": "Bangalore"},
                {"name": "Plaster Sand", "category": "Sand", "unit": "cft", "rate": 40, "location": "Bangalore"},
                # Aggregates
                {"name": "20mm Aggregates", "category": "Aggregates", "unit": "cft", "rate": 45, "location": "Bangalore"},
                {"name": "40mm Aggregates", "category": "Aggregates", "unit": "cft", "rate": 40, "location": "Bangalore"},
                {"name": "6mm Aggregates", "category": "Aggregates", "unit": "cft", "rate": 50, "location": "Bangalore"},
                # Masonry
                {"name": "Red Clay Bricks", "category": "Masonry", "unit": "nos", "rate": 8, "location": "Bangalore"},
                {"name": "AAC Blocks (600x200x200)", "category": "Masonry", "unit": "nos", "rate": 65, "location": "Bangalore"},
                {"name": "Hollow Concrete Blocks", "category": "Masonry", "unit": "nos", "rate": 35, "location": "Bangalore"},
                # Flooring
                {"name": "Vitrified Tiles (600x600)", "category": "Flooring", "unit": "sqft", "rate": 65, "location": "Bangalore"},
                {"name": "Ceramic Floor Tiles", "category": "Flooring", "unit": "sqft", "rate": 45, "location": "Bangalore"},
                {"name": "Marble Flooring", "category": "Flooring", "unit": "sqft", "rate": 120, "location": "Bangalore"},
                {"name": "Granite Flooring", "category": "Flooring", "unit": "sqft", "rate": 95, "location": "Bangalore"},
                # Finishing
                {"name": "Interior Wall Paint", "category": "Finishing", "unit": "ltr", "rate": 180, "location": "Bangalore"},
                {"name": "Exterior Paint", "category": "Finishing", "unit": "ltr", "rate": 220, "location": "Bangalore"},
                {"name": "Primer", "category": "Finishing", "unit": "ltr", "rate": 120, "location": "Bangalore"},
                {"name": "Waterproofing Chemical", "category": "Finishing", "unit": "ltr", "rate": 280, "location": "Bangalore"},
                # Woodwork
                {"name": "Teak Wood Door Frame", "category": "Woodwork", "unit": "nos", "rate": 4500, "location": "Bangalore"},
                {"name": "UPVC Window Frame", "category": "Woodwork", "unit": "nos", "rate": 3200, "location": "Bangalore"},
                {"name": "Flush Door", "category": "Woodwork", "unit": "nos", "rate": 2800, "location": "Bangalore"},
                # Electrical
                {"name": "Copper Wiring (1.5 sq mm)", "category": "Electrical", "unit": "mtr", "rate": 35, "location": "Bangalore"},
                {"name": "PVC Conduit Pipe", "category": "Electrical", "unit": "mtr", "rate": 18, "location": "Bangalore"},
                {"name": "Switch & Socket", "category": "Electrical", "unit": "nos", "rate": 250, "location": "Bangalore"},
                # Plumbing
                {"name": "CPVC Pipe (1 inch)", "category": "Plumbing", "unit": "mtr", "rate": 120, "location": "Bangalore"},
                {"name": "PVC Pipe (4 inch)", "category": "Plumbing", "unit": "mtr", "rate": 85, "location": "Bangalore"},
                {"name": "GI Pipe (1 inch)", "category": "Plumbing", "unit": "mtr", "rate": 160, "location": "Bangalore"},
            ]
            for mat_data in materials_data:
                mat = Material(**mat_data, is_active=1)
                db.add(mat)
            db.commit()

        # Seed demo projects
        if db.query(Project).count() == 0:
            projects_data = [
                {
                    "name": "Skyline Residency - Phase 1",
                    "client_name": "Mr. Arun Sharma",
                    "project_type": "Residential",
                    "location": "Whitefield, Bangalore",
                    "built_up_area": 2400,
                    "floors": 3,
                    "construction_type": "RCC",
                    "description": "3-storey residential building with modern amenities",
                    "status": "estimation_done",
                    "owner_id": 1,
                },
                {
                    "name": "Green Valley Villas",
                    "client_name": "Mrs. Priya Reddy",
                    "project_type": "Residential",
                    "location": "Sarjapur Road, Bangalore",
                    "built_up_area": 1800,
                    "floors": 2,
                    "construction_type": "RCC",
                    "description": "Independent villa with garden and parking",
                    "status": "in_progress",
                    "owner_id": 1,
                },
                {
                    "name": "TechPark Office Complex",
                    "client_name": "Innovate Corp Pvt Ltd",
                    "project_type": "Commercial",
                    "location": "Electronic City, Bangalore",
                    "built_up_area": 15000,
                    "floors": 5,
                    "construction_type": "Steel",
                    "description": "5-floor IT office complex with parking basement",
                    "status": "planning",
                    "owner_id": 1,
                },
                {
                    "name": "Cauvery Bridge Renovation",
                    "client_name": "BBMP",
                    "project_type": "Infrastructure",
                    "location": "Mysore Road, Bangalore",
                    "built_up_area": 5000,
                    "floors": 1,
                    "construction_type": "RCC",
                    "description": "Bridge renovation and strengthening project",
                    "status": "in_progress",
                    "owner_id": 1,
                },
                {
                    "name": "Mega Warehouse - Phase 2",
                    "client_name": "Logistics Hub Ltd",
                    "project_type": "Industrial",
                    "location": "Tumkur Road, Bangalore",
                    "built_up_area": 25000,
                    "floors": 1,
                    "construction_type": "Steel",
                    "description": "Large industrial warehouse with loading docks",
                    "status": "planning",
                    "owner_id": 1,
                },
            ]
            for proj_data in projects_data:
                project = Project(**proj_data)
                db.add(project)
            db.commit()

    finally:
        db.close()


@app.get("/api/health")
async def health_check():
    return {
        "status": "success",
        "message": "AI MatEsti API is running",
        "version": settings.APP_VERSION,
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to AI MatEsti API",
        "docs": "/docs",
        "health": "/api/health",
    }
