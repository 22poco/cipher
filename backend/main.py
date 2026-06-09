from fastapi import FastAPI

from .database import check_database_connection


app = FastAPI(title="cipher api")

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
