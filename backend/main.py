from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import check_database_connection
from .routers import admin, auth, courses, progress, quizzes


app = FastAPI(title="cipher api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(admin.router)
app.include_router(quizzes.router)
app.include_router(progress.router)

@app.get("/")
def root():
    return {"message": "cipher backend is running"}


@app.get("/health")
def health_check():
    database_connected = check_database_connection()

    return {
        "status": "ok",
        "database": "connected" if database_connected else "disconnected",
    }
