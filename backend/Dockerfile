FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

EXPOSE 8000

# entrypoint keeps the schema current and seeds baseline course content on
# first boot, then uvicorn takes over as pid 1
CMD ["sh", "-c", "python -m backend.entrypoint && exec python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
