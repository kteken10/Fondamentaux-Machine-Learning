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
| `FraudAI_MSc_EPITA_Notebook.ipynb` | Pipeline ML (EDA → modélisation → SHAP), exécuté, déterministe |
| `FraudAI_Business_Case_Gouvernance.docx` | Rapport (Business Case + gouvernance), 10 sections |
| `fraudai_model.pkl` | Modèle champion XGBoost + scaler + seuils |
| `webapp/` | Application web : **FastAPI** (backend) + **React/Vite/Tailwind** (frontend) |
| `requirements.txt` | Dépendances Python du notebook |
| `Dockerfile` | Image unique (front buildé + API) |
| `AUDIT_FraudAI.md` | Rapport d'audit du projet |
| `DEPLOIEMENT.md` · `SOUTENANCE.md` | Guide de déploiement · trame de soutenance |

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
Voir **[DEPLOIEMENT.md](DEPLOIEMENT.md)** pour Docker / Render / Hugging Face.
