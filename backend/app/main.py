from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.routes import auth, chat, services, admin
from backend.app.services.mock_services import seed_initial_outages

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed initial tables
db = SessionLocal()
try:
    seed_initial_outages(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For ease of development, allow all origins
    allow_credentials=False, # We use Bearer tokens, not cookies, so credentials aren't needed. This avoids CORS errors with wildcard origins.
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(services.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to the APDCL AI Assistant API. Everything is running smoothly!"}
