---
title: FraudAI
emoji: 🔍
colorFrom: orange
colorTo: gray
sdk: docker
app_port: 8000
pinned: false
license: mit
---

# FraudAI — Détection de fraude aux remboursements de santé (CPAM)

Projet fil rouge MSc Machine Learning — EPITA 2026.
Système d'aide à la priorisation des contrôles anti-fraude. **L'IA calcule un score de
risque ; la décision finale reste humaine** (RGPD Art. 22 / AI Act Art. 14).

> L'en-tête YAML ci-dessus sert au déploiement **Hugging Face Spaces** (SDK Docker, port 8000).
> Il est ignoré partout ailleurs.

## Contenu du dépôt
| Élément | Description |
|---|---|
| `01_FraudAI_Notebook_Pipeline_ML.ipynb` | Pipeline ML (EDA → modélisation → SHAP), exécuté, déterministe |
| `02_FraudAI_Rapport_BusinessCase_Gouvernance.docx` | Rapport (Business Case + gouvernance), 10 sections |
| `03_FraudAI_Soutenance.md` | Trame de soutenance (~10 min) |
| `fraudai_model.pkl` | Modèle champion XGBoost + scaler + seuils |
| `webapp/` | Application web : **FastAPI** (backend) + **React/Vite/Tailwind** (frontend) |
| `requirements.txt` | Dépendances Python du notebook |
| `Dockerfile` · `render.yaml` | Image unique (front buildé + API) · déploiement Render |
| `GUIDE_Deploiement.md` | Guide de déploiement (local / Docker / Render / Hugging Face) |

## Résultats (test jamais touché)
Champion **XGBoost** · AUC-PR **0,835** · AUC-ROC **0,973** · Recall **80,0 %** · Précision **83,5 %**.
Split anti-fuite train/validation/test 60/20/20 ; seuils calibrés sur la validation.

## Lancer en local
```bash
# Backend + frontend en dev
./start.ps1
# ou un seul serveur (production)
cd webapp/frontend && npm install && npm run build
cd ../backend && pip install -r requirements.txt && uvicorn main:app --port 8000
```
Voir **[GUIDE_Deploiement.md](GUIDE_Deploiement.md)** pour Docker / Render / Hugging Face.
