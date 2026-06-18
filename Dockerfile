# FraudAI — image unique (front React buildé + API FastAPI). Une seule URL.
# Les livrables sont dans rendu/ ; ce Dockerfile (racine) y référence l'app.
# Build :  docker build -t fraudai .
# Run   :  docker run -p 8000:8000 fraudai   ->  http://localhost:8000

# --- Etape 1 : build du frontend ---
FROM node:20-slim AS frontend
WORKDIR /fe
COPY rendu/webapp/frontend/package*.json ./
RUN npm ci
COPY rendu/webapp/frontend/ ./
RUN npm run build

# --- Etape 2 : backend Python + service du front buildé ---
FROM python:3.12-slim
WORKDIR /app

# Dépendances système minimales pour xgboost (libgomp)
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY rendu/webapp/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# On préserve l'arborescence rendu/ : main.py lit le modèle en parents[2] = /app/rendu
COPY rendu/fraudai_model.pkl /app/rendu/fraudai_model.pkl
COPY rendu/webapp/backend/ /app/rendu/webapp/backend/
COPY --from=frontend /fe/dist /app/rendu/webapp/frontend/dist

WORKDIR /app/rendu/webapp/backend
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
