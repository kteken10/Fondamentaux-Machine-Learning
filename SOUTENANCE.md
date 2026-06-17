# FraudAI — Trame de soutenance (~10 min, 11 slides)

> Posture : consultants IA devant un comité décisionnel d'une agence publique (CPAM).
> Fil narratif différenciant : **« nous avons audité notre propre pipeline, détecté une fuite
> de données, et corrigé pour obtenir un recall 80 % HONNÊTE »**. C'est ça qui marque un jury.
> Chiffres ci-dessous = ceux du notebook/rapport (test jamais touché). Tous cohérents.

---

## Slide 1 — Titre (30 s)
**FraudAI — Détection de fraude aux remboursements de santé (CPAM)**
Sous-titre : *L'IA aide l'agent, la décision reste humaine.*
Équipe · MSc Machine Learning EPITA 2026.
> Accroche orale : « Nous sommes missionnés par l'Assurance Maladie pour aider ses agents à prioriser les contrôles anti-fraude — sans jamais automatiser la décision finale. »

## Slide 2 — Le problème (1 min)
- Fraude aux finances publiques : **~20 Md€ détectés en 2024**, objectif 40 Md€/an d'ici 2029.
- Assurance Maladie : **723 M€ de fraude détectée en 2025 (+15 %)**.
- Pourquoi la CPAM : enjeu financier documenté · données ultra-sensibles (gouvernance maximale) · **coût humain du faux positif** (suspecter à tort un assuré).
> « On choisit UN type de fraude, le plus exigeant en gouvernance. »

## Slide 3 — Du dataset au cas CPAM (45 s)
- Dataset ULB (284 807 transactions, 0,17 % de fraude) = **proxy anonymisé** d'un flux de remboursements.
- Table de transposition : Amount → montant remboursé · V1–V28 (ACP) → profil anonymisé (secret médical) · Class → fraude avérée après contrôle.
- **Problème métier** : prioriser automatiquement les dossiers à risque, augmenter la détection, réduire les contrôles inutiles — *sans déléguer la décision*.

## Slide 4 — Business Case (1 min)
| KPI | Cible | Obtenu (test) |
|---|---|---|
| Recall | ≥ 80 % | **80,0 %** |
| Précision | — | **83,5 %** |
| AUC-PR | > 0,80 | **0,835** |
- Budget pilote : **700 k€ / 8 mois**. ROI 3 ans : **≈ ×7,8** (hypothèses conservatrices).
> « Le modèle est aligné sur la cible institutionnelle de 80 % de détection. »

## Slide 5 — Données & EDA (1 min)
- 284 807 → **283 726 après retrait de 1 081 doublons** (sinon fuite train/test).
- Déséquilibre extrême : **1 fraude pour ~600** → métriques adaptées (AUC-PR, Recall), **pas l'accuracy**.
- Montant médian fraude **9,82 €** vs 22,00 € (signature des tests de petits montants).
- *Figure : déséquilibre + distribution montants + fraude par heure.*

## Slide 6 — Méthodologie anti-fuite (1 min 30) ⭐
CRISP-DM, et surtout **rigueur anti-fuite** :
- Split stratifié **train / validation / test = 60 / 20 / 20** AVANT toute transformation.
- Scaler ajusté sur le **train seul** ; SMOTE testé **uniquement sur le train**.
- **Stratégie, champion et seuils choisis sur la VALIDATION** ; métriques finales sur le **test jamais touché**.
> « Trois jeux de données : on ne mesure jamais sur ce qui a servi à régler le modèle. »

## Slide 7 — Ce que notre audit a révélé (1 min 30) ⭐⭐ *(slide qui fait gagner des points)*
- **Piège n°1 — double-correction** : SMOTE + `scale_pos_weight` → seuil pathologique ~1,0. Comparé et **écarté** (AUC-PR 0,852 vs 0,886).
- **Piège n°2 — fuite de seuil** : en réglant le seuil directement sur le test, on obtenait un « 80 % » à 97 % de précision… **illusoire**. Corrigé via le jeu de validation.
- **Résultat honnête** : Recall **80,0 %** au prix d'une précision de **83,5 %** (15 faux positifs sur 56 746). C'est le vrai compromis.
> « On a audité notre propre travail : le premier 80 % était surévalué. Le vrai chiffre, défendable, c'est celui-ci. »

## Slide 8 — Modélisation & résultats (1 min)
- 3 modèles à pied d'égalité ; champion **XGBoost** (AUC-PR validation).

| Modèle | AUC-PR | AUC-ROC |
|---|---|---|
| Régression Logistique | 0,689 | 0,964 |
| Random Forest | 0,786 | 0,950 |
| **XGBoost (champion)** | **0,835** | **0,973** |

- Deux points de fonctionnement : **F1-optimal** (Recall 72,6 % / Préc. 94,5 %) et **déploiement** (Recall 80,0 % / Préc. 83,5 %). *Figures : courbes ROC/PR + matrices de confusion.*

## Slide 9 — Explicabilité & IA responsable (1 min)
- **SHAP** : importance globale + explication **locale par dossier** (ex. dossier score 92/100 → V14, V10, V12 dominants). L'agent voit *pourquoi*.
- **Analyse des biais** : socio-économique (petits montants), temporel, opacité ACP → mesures correctives (audit d'équité, SHAP obligatoire).

## Slide 10 — Gouvernance RGPD & AI Act (1 min)
- **Système à haut risque** (AI Act Annexe III).
- RGPD **Art. 22** (décision non 100 % automatisée) · AI Act **Art. 9/13/14/17**.
- Data lineage · monitoring (KS-test, alerte recall −5 %/30 j, retraining trimestriel) · **roadmap gouvernance 12 mois** · recours citoyen.
> « La conformité n'est pas un addendum, c'est dans l'architecture. »

## Slide 11 — Démo, déploiement & recommandation (1 min)
- **Plateforme web** (React + Tailwind + FastAPI) — *démo live* : tableau de bord → analyser un dossier → score + SHAP. Même modèle que le notebook → chiffres identiques.
- Déployable en 1 image Docker (Render / Hugging Face).
- **Recommandation au comité** : valider un **pilote CPAM régional, 700 k€ / 8 mois**, sous 3 conditions — réentraînement sur données réelles, audit de biais indépendant, **supervision humaine garantie**.
> Clôture : « L'IA priorise. L'agent décide. »

---

### Conseils de présentation
- **Slides 6-7 = votre atout** : insistez sur la rigueur anti-fuite, c'est rare et très valorisé.
- Gardez la **démo live courte** (1 dossier à risque élevé) ; ayez une **capture de secours** (Figures 5-6 du rapport) si le réseau lâche.
- Question probable du jury : *« Votre seuil est calibré sur quoi ? »* → Réponse : **« Sur la validation, mesuré sur un test jamais touché — d'où un 80 % défendable, pas surévalué. »**
- Répartition oratoire : 1 personne business (2-4), 1 personne ML (5-8), 1 personne gouvernance/démo (9-11).
