"""
Standalone seed script for AI MatEsti database.
Run: python database/seed_data.py (from backend/ directory)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')

from app.core.database import create_tables, SessionLocal
from app.models.user import User
from app.models.material import Material
from app.models.project import Project
from app.utils.auth import hash_password

def seed():
    create_tables()
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users = [
                User(name="Rajesh Kumar", email="demo@aimatesti.com", password_hash=hash_password("demo1234"), role="admin"),
                User(name="Priya Sharma", email="priya@aimatesti.com", password_hash=hash_password("demo1234"), role="engineer"),
            ]
            for u in users: db.add(u)
            db.commit()
            print("✓ Seeded users")

        if db.query(Material).count() == 0:
            print("✓ Materials will be seeded on API startup")

        print("Seed complete. Run the FastAPI server to initialize all data.")
    finally:
        db.close()

if __name__ == '__main__':
    seed()
