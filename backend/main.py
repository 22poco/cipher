from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "cipher backend is running"}