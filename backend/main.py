from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import check_database_connection
from .routers import (
    admin,
    auth,
    courses,
    mock_exams,
    practice_cases,
    progress,
    quizzes,
    responses,
)


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
app.include_router(mock_exams.router)
app.include_router(progress.router)
app.include_router(responses.router)
app.include_router(practice_cases.router)

@app.get("/")
def root():
    return {"message": "cipher backend is running"}


@app.get("/health")
def health_check():
    # status must be honest: earlier revisions reported "ok" even when the
    # database was down, which convinced a teacher his postgres was healthy
    # while every registration silently failed
    database_connected = check_database_connection()

    return {
        "status": "ok" if database_connected else "degraded",
        "database": "connected" if database_connected else "disconnected",
    }
