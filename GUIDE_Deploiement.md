# Déploiement de FraudAI

L'application = **backend FastAPI** (charge `fraudai_model.pkl`) + **frontend React/Vite**.
Deux modes : *dev* (2 serveurs) ou *production* (1 seul serveur qui sert tout).

---

## Option A — Local, pour la soutenance (recommandé)

Le plus fiable le jour J : aucune dépendance internet.

### A.1 — Un seul serveur (mode production)
```bash
cd rendu/webapp/frontend && npm install && npm run build      # génère dist/
cd ../backend && pip install -r requirements.txt
uvicorn main:app --port 8000
```
👉 Ouvrir **http://localhost:8000** — FastAPI sert le front buildé **et** l'API.

### A.2 — Mode dev (rechargement à chaud) ou clic unique
```powershell
./start.ps1        # lance backend + frontend (dev) et ouvre le navigateur
```
👉 http://localhost:5173

---

## Option B — Docker (image unique, portable)

Tout est empaqueté (front buildé + API + modèle) dans une image.
```bash
docker build -t fraudai .
docker run -p 8000:8000 fraudai
```
👉 http://localhost:8000

C'est l'image à pousser sur n'importe quel hébergeur cloud.

---

## Option C — URL publique gratuite

### C.1 — Render.com (le plus simple avec Docker)
1. Pousser le projet sur GitHub (le `.gitignore` exclut déjà `creditcard.csv` et `node_modules`).
   **Garder `fraudai_model.pkl` dans le dépôt** (577 Ko, indispensable).
2. Sur render.com → *New* → *Web Service* → connecter le repo.
3. *Runtime* : **Docker**. Render détecte le `Dockerfile` et injecte `$PORT` (déjà géré).
4. Déployer → URL publique `https://fraudai-xxxx.onrender.com`.
   (Plan gratuit : le service s'endort après inactivité, ~30 s au réveil.)

### C.2 — Hugging Face Spaces (idéal pour une démo ML)
1. Créer un *Space* → SDK **Docker**.
2. Pousser le repo (avec `Dockerfile` + `fraudai_model.pkl`).
3. Dans le `README.md` du Space, ajouter l'en-tête : `app_port: 8000`.
4. Le Space build et expose une URL publique permanente.

### C.3 — Railway / Fly.io
Même principe : détection du `Dockerfile`, port via `$PORT`. Déploiement en 1 commande
(`railway up` ou `fly launch`).

---

## Points d'attention
- **Modèle** : `fraudai_model.pkl` doit être présent à la racine du projet (le backend le lit en `parents[2]`). Il EST versionné ; ne pas l'oublier.
- **Dataset** : `creditcard.csv` (150 Mo) n'est **pas** nécessaire au déploiement (les chiffres du dashboard sont figés et vérifiés côté API). Il reste exclu de l'image et du dépôt Git.
- **Cohérence** : quel que soit le mode, le score vient du **même `.pkl`** → identique au notebook et au rapport.
- **Sécurité (prod réelle)** : restreindre `allow_origins` du CORS, ajouter une authentification agent, HTTPS (fourni par l'hébergeur). Pour une soutenance, l'état actuel suffit.
