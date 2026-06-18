# FraudAI — Détection de fraude aux remboursements de santé (CPAM)

**Projet fil rouge — MSc Machine Learning, EPITA 2026.**
Système d'aide à la priorisation des contrôles anti-fraude pour les agents de l'Assurance
Maladie. **L'IA calcule un score de risque ; la décision finale reste humaine**
(RGPD Art. 22 / AI Act Art. 14).

## Contenu du rendu
| Fichier | Description |
|---|---|
| `01_FraudAI_Notebook_Pipeline_ML.ipynb` | Pipeline ML complet (EDA → modélisation → SHAP), exécuté et déterministe |
| `02_FraudAI_Rapport_BusinessCase_Gouvernance.docx` | Rapport : Business Case + gouvernance (10 sections, figures) |
| `03_FraudAI_Soutenance.md` | Trame de soutenance (~10 min) |
| `fraudai_model.pkl` | Modèle champion XGBoost + scaler + seuils |
| `requirements.txt` | Dépendances Python du notebook |
| `webapp/` | Application web : **FastAPI** (backend) + **React / Vite / Tailwind** (frontend) |

## Résultats (mesurés sur le jeu de test jamais touché)
Champion **XGBoost** · AUC-PR **0,835** · AUC-ROC **0,973** · Recall **80,0 %** · Précision **83,5 %**.
Méthodologie anti-fuite : split stratifié **train / validation / test 60/20/20**, seuils
calibrés sur la validation, métriques finales sur le test.

## Exécuter le notebook
> Le dataset `creditcard.csv` (imposé, ULB/Kaggle) **n'est pas inclus** (volumineux).
> Placez-le dans ce dossier `rendu/` à côté du notebook avant de l'exécuter.
```bash
pip install -r requirements.txt
jupyter notebook 01_FraudAI_Notebook_Pipeline_ML.ipynb   # puis Run All
```

## Lancer l'application
```bash
# Terminal 1 — backend (port 8000)
cd webapp/backend && pip install -r requirements.txt && uvicorn main:app --port 8000
# Terminal 2 — frontend (port 5173)
cd webapp/frontend && npm install && npm run dev
```
Le backend charge le **même `fraudai_model.pkl`** que le notebook → score identique.
Détails de déploiement (Docker / Render) : voir `../GUIDE_Deploiement.md`.
