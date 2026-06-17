# FraudAI — image unique (front React buildé + API FastAPI). Une seule URL.
# Build :  docker build -t fraudai .
# Run   :  docker run -p 8000:8000 fraudai   ->  http://localhost:8000

# --- Etape 1 : build du frontend ---
FROM node:20-slim AS frontend
WORKDIR /fe
COPY webapp/frontend/package*.json ./
RUN npm ci
COPY webapp/frontend/ ./
RUN npm run build

# --- Etape 2 : backend Python + service du front buildé ---
FROM python:3.12-slim
WORKDIR /app

# Dépendances système minimales pour xgboost (libgomp)
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY webapp/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Le backend lit le modèle a la racine du projet (parents[2] de main.py).
COPY fraudai_model.pkl /app/fraudai_model.pkl
COPY webapp/backend/ /app/webapp/backend/
COPY --from=frontend /fe/dist /app/webapp/frontend/dist

WORKDIR /app/webapp/backend
ENV PORT=8000
EXPOSE 8000
# host 0.0.0.0 + port fourni par l'hébergeur (Render/HF/Railway exposent $PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
