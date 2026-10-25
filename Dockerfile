# Multi-stage build for React Frontend + FastAPI Backend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Python 3.11 lightweight runtime for Cloud Run
FROM python:3.11-slim
WORKDIR /app

# Install system utilities if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy repository
COPY . .

# Copy compiled frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PORT=8080 \
    PYTHONUNBUFFERED=1

WORKDIR /app/src

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
