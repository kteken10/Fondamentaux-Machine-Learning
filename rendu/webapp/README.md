# FraudAI — Plateforme web (React + FastAPI)

Centre de détection de fraude aux remboursements CPAM, pour les agents contrôleurs.
Design system inspiré de **SDEN Core** : React 18 + Vite + Tailwind 3 + Radix UI,
palette **noir / blanc / orange**, composants faits main (`cn()`, primitives `ui/`).
Le **backend FastAPI charge le même `fraudai_model.pkl`** que le notebook → les scores
et métriques affichés sont strictement identiques au notebook.

```
webapp/
  backend/    API FastAPI (Python) — scoring + SHAP + overview
  frontend/   Vite + React + Tailwind + Radix (JS/JSX)
    src/
      lib/cn.js              cn() = twMerge(clsx())
      api/client.js          axios -> /api
      components/ui/          Button, Card, Input, Badge, StatusDot, Spinner, Tabs (+ index.js)
      components/PageHeader.jsx
      layouts/DashboardLayout.jsx   shell (sidebar + topbar mobile)
      pages/                 DashboardPage, AnalysePage, BatchPage, ModelPage
```

## 1. Backend (port 8000)
```bash
cd webapp/backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Endpoints : `GET /api/meta`, `GET /api/overview`, `POST /api/score`, `POST /api/batch`.
Pré-requis : `fraudai_model.pkl` à la racine du projet.

## 2. Frontend (port 5173)
```bash
cd webapp/frontend
npm install
npm run dev
```
Ouvrir http://localhost:5173 (Vite proxifie `/api` vers le backend).

## Design system (SDEN)
- Palette accent orange `#f97316` (modifiable dans `tailwind.config.js`).
- Cards `rounded-2xl shadow-sm`, boutons/inputs/badges `rounded-lg`, labels `uppercase 11px slate-400`.
- Une seule couleur vive par écran (orange) ; le reste en `slate`. Pas de bleu.
- Pages : tableau de bord (hero noir + halo orange, mini-stats, donut, classement), analyse de dossier (score + SHAP), analyse par lot (CSV), modèle (benchmark + gouvernance en onglets Radix).
