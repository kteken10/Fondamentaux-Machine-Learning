# Audit pré-rendu — Projet FraudAI (MSc ML EPITA 2026)

> **Posture.** Correcteur senior, exigeant, spécialiste ML appliqué + gouvernance IA (RGPD/AI Act). Aucun éloge gratuit : chaque constat est localisé et hiérarchisé.
> **Date de l'audit.** 17 juin 2026.

## Périmètre réellement audité & limites de vérification

**Vérifié empiriquement (exécution / recalcul) :**
- Inventaire du dépôt, structure et état d'exécution du notebook (parse JSON).
- **Ré-exécution complète du notebook de bout en bout** (`jupyter nbconvert --execute` sur une copie, dataset fourni) → **0 erreur, 17/17 cellules exécutées**. Le pipeline tourne mécaniquement.
- Contenu du `fraudai_model.pkl` : chargé, modèle et hyperparamètres inspectés (`joblib.load`).
- Compilation de l'app : `python -m py_compile app_fraudai.py` → **OK**.
- Re-dérivation arithmétique de toutes les matrices de confusion, F1, taux de FP et du tableau ROI.
- **Reproduction indépendante des métriques XGBoost** sur 5 versions de la lib + tests multithread (voir §4.6).
- Confrontation chiffre à chiffre notebook ↔ rapport Word ↔ `.pkl` ↔ app, et vérification des stats EDA sur le CSV brut (médiane fraude, doublons, taux).

**Limites restantes :**
- ❗ **Fichiers attendus absents du dépôt :** l'énoncé PDF (`Projet_IA_...pdf`) et tout support de **slides/présentation**. L'audit du critère « Présentation » (2 pts) repose donc uniquement sur la qualité rédactionnelle du rapport Word, pas sur un livrable de soutenance.

> ✅ **CORRECTIONS APPLIQUÉES LE 17/06/2026 — refonte méthodologique complète + nouvelle application.** Après l'audit, l'ensemble a été corrigé, régénéré de façon **déterministe** et remis en cohérence :
> 1. **Fuite de sélection de seuil corrigée (constat 4.1)** : split passé en **train / validation / test = 60 / 20 / 20**. Stratégie de déséquilibre, modèle champion ET seuils sont désormais choisis sur la **validation** ; les métriques finales sont mesurées sur le **test jamais touché**. C'est la correction structurante.
> 2. **Notebook rendu déterministe** (`n_jobs=1` → reproductibilité garantie, vérifiée).
> 3. **`fraudai_model.pkl` régénéré** → notebook ↔ `.pkl` strictement cohérents ; F1 du dict `metrics` calculé au seuil de déploiement (cohérent avec Recall/Precision).
> 4. **Rapport Word réaligné** sur les chiffres validation/test + narratif méthodo (split 60/20/20, calibration validation, compromis recall/précision assumé) + section déploiement réécrite (application web React/FastAPI).
> 5. **Nouvelle application web Vite + React + Tailwind (front) + FastAPI (back)** remplaçant Streamlit. Le backend charge **le même `.pkl`** → score identique au notebook. Testée : `/api/meta`, `/api/score` (SHAP), `/api/batch` opérationnels ; front buildé sans erreur.
> 6. **23 contrôles de cohérence croisée** rapport ↔ notebook ↔ `.pkl` ↔ API : **0 échec**.
>
> **Chiffres figés finaux (mesurés sur le TEST jamais touché — font foi) :** AUC-PR **0,835** · AUC-ROC **0,973** · champion **XGBoost** (AUC-PR validation). Point F1-optimal : Recall **72,6 %**, Précision **94,5 %**, 4 FP. **Point de déploiement : Recall 80,0 %, Précision 83,5 %, 15 FP** (seuil 0,066 calibré sur validation avec marge de généralisation).
>
> ⚠️ **Le « Recall 80 % » est désormais HONNÊTE** : mesuré sur un test jamais touché, atteint au prix d'une précision de 83,5 % (vs le 97 % illusoire d'avant). Le 80 % d'origine était gonflé par la fuite de seuil-sur-test (cf. §4.1).
> *Historique de l'incident initial (pkl écrasé puis régénéré) au §4.6.*

---

## 1. Synthèse exécutive

Projet **solide et nettement au-dessus de la moyenne attendue**. Le notebook est rigoureux là où la plupart échouent : déduplication tracée, split stratifié **avant** toute transformation, scaler ajusté sur le train seul, SMOTE confiné au train, et — point remarquable — une **démonstration explicite de la double-correction SMOTE+`scale_pos_weight`** qui montre le seuil pathologique (0,9997) au lieu de tomber dedans. Le `.pkl` est cohérent avec le notebook (XGBoost, 31 features, seuil de déploiement **sain à 0,11**, `scale_pos_weight=None`), l'app Streamlit charge ce pipeline fidèlement et matérialise la décision humaine. Le rapport couvre les 10 sections, la gouvernance (RGPD/AI Act) est dense et la transposition CPAM est argumentée.

**La faille méthodologique majeure** : le seuil de décision déployé, le modèle champion ET la stratégie de déséquilibre sont tous **sélectionnés sur le jeu de test** (pas de jeu de validation). Le « Recall = 80,0 % » est donc atteint *par construction sur le test* — estimation optimiste, attaquable en soutenance. Côté Business Case, le « taux de faux positifs 0,014 % » repose sur un dénominateur (FP/total) trivialement satisfait en contexte déséquilibré et **masque le taux de fausses alertes réel de 9,5 %** (1 − précision). Quelques incohérences mineures inter-fichiers (médiane de montant, libellé du F1).

**Note globale estimée : ~17 / 20** (fourchette 16,5–17,5). Le plafond est bridé par la sélection de seuil sur le test et la présentation du KPI faux positifs ; tout le reste vise le haut du barème.

---

## 2. Points conformes (avec localisation)

- **Notebook entièrement exécuté, reproductible en l'état.** *Vérifié :* 17 cellules de code, `execution_count` séquentiels 1→17, **toutes avec sorties**, aucune cellule en erreur. Le bandeau « Notebook entièrement exécuté » (MD cell 0) n'est pas un vœu pieux.
- **Qualité des données / déduplication tracée.** `FraudAI_..._Notebook.ipynb` cell 4 : `drop_duplicates()` → 1 081 doublons retirés (284 807 → 283 726), justifié comme anti-fuite (MD cell 5). Cohérent avec le rapport §4.
- **Anti-fuite réelle (et pas seulement revendiquée).** Cell 11 : `train_test_split(..., stratify=y)` **puis** `StandardScaler().fit(X_train)`. Le split précède le scaling, le scaler n'est ajusté que sur le train. *Vérifié par lecture du code.*
- **Feature engineering sans fuite.** Cell 11 : `Hour` et `Amount_log = log1p(Amount)` sont calculées **ligne à ligne**, sans statistique globale ni variable dérivée de la cible. `amount_mean/std` stockés dans le `.pkl` sont calculés sur `X_train` seul (cell 29). *Aucune fuite détectée.*
- **Traitement exemplaire du déséquilibre — anti double-correction.** Cell 13 compare 4 stratégies (A: rien+seuil / B: `scale_pos_weight` / C: SMOTE / D: SMOTE+`scale_pos_weight`). La sortie montre noir sur blanc le pathologique **D → seuil 0,9997, AUC-PR 0,7555**, et retient **A (AUC-PR 0,8255, seuil 0,41 sain)**. *C'est exactement le piège que l'énoncé veut voir évité — ici il est non seulement évité mais démontré.*
- **`.pkl` cohérent avec le notebook.** *Vérifié par chargement :* champion `XGBoost`, **31 features** (V1–V28 + Amount + Hour + Amount_log), `scale_pos_weight=None` (donc pas de double-correction), `threshold=0,1116`, `threshold_f1=0,4109`, `t_low=0,0335`, `t_high=0,1116` — identiques aux sorties des cells 16/21.
- **Seuil de décision sain.** Le seuil de déploiement **0,11** (et F1-optimal 0,41) sont loin du signal d'alerte « ~0,99 ». *Vérifié dans le `.pkl` et la cell 21.*
- **Benchmark 3 modèles, champion sur AUC-PR.** Cell 15-16 : LogReg / RF / XGBoost évalués à pied d'égalité, champion = max AUC-PR. Accuracy explicitement écartée comme métrique de décision (MD cell 4, §4.1 rapport). Courbes ROC **et** PR présentes (cell 17).
- **Le tableau benchmark du rapport (§5.3) correspond exactement aux sorties du notebook** (cell 16) : LogReg 0,673 / RF 0,777 / XGBoost 0,826 en AUC-PR ; FP 9/9/2, FN 23/23/23. *Vérifié chiffre à chiffre.*
- **SHAP global ET local.** Cells 23 (bar), 24 (beeswarm), 25 (explication locale d'un dossier : score 95/100, top facteurs V14/V10/V12…). Répond à l'exigence « explicabilité agent » explicitement notée.
- **App fidèle au modèle.** `app_fraudai.py` charge le `.pkl`, utilise `FEATURES` du pipeline (pas de feature fantôme), dérive le score 0–100 des seuils `t_low/t_high` (mapping identique à la cell 21), affiche la mention « décision finale humaine » (RGPD Art. 22 / AI Act Art. 14). *Compile sans erreur (`py_compile` OK).*
- **ROI interne cohérent.** *Vérifié :* valeurs 2,0+3,3+3,5 = 8,8 M€ ; coûts 0,70+0,15+0,15 = 1,00 M€ ; net 7,8 M€ ; **ROI ×7,8** — réaliste, pas un x50 fantaisiste, et présenté comme hypothèse de cadrage. Budget pilote 700 k€ aligné avec l'énoncé.
- **Gouvernance dense et structurante.** RGPD (Art. 22, 15-17), AI Act (haut risque Annexe III, Art. 9/13/14/17), data lineage (§7.2), roadmap 12 mois avec KPI par jalon (§7.3), monitoring concret (KS-test sur V1–V28, alerte drift recall >5 % sur 30 j, retraining trimestriel — §7.4), analyse de biais avec mesures correctives (§6.1), table risques/probabilité/impact (§9).
- **Conformité de cadrage.** Type de fraude **unique** (CPAM) justifié (§2), table de transposition dataset→CPAM (§2.1), 10 sections présentes, CRISP-DM implicitement suivi, décision humaine matérialisée dans rapport + app.

---

## 3. Points à améliorer (non bloquants)

- **[Mineur] App — liste `TOP_V` codée en dur partiellement décalée.** `app_fraudai.py:41` : `TOP_V = [V14, V10, V12, V4, V17, V11]`. Or `V11` n'est pas dans le top des `feature_importances_` du modèle (top réel : V14, V10, V12, V4, Amount_log, V17). Mineur car les sliders sont illustratifs, mais autant aligner sur les 6 vraies variables dominantes.
- **[Mineur] EDA — top variables corrélées ≠ top importances/SHAP.** Cell 8 (corr) donne V17, V14, V12, V10, V16, V3 ; les importances/SHAP donnent V14, V10, V12, V4. Ce n'est pas une erreur (corrélation linéaire ≠ importance d'un modèle non linéaire) mais le rapport gagnerait à expliciter cette distinction d'une phrase, sinon un jury y verra une incohérence.
- **[Mineur] App — le mode batch ne remplit Hour qu'à 12 par défaut.** `app_fraudai.py:160-161` : si pas de `Time`, `Hour=12`. Acceptable pour une démo, à documenter dans l'UI.
- **[Mineur] Aucun `requirements.txt` / pin de versions.** Le `.pkl` est un XGBoost sérialisé ; sans versions figées, un correcteur sur un autre environnement peut échouer au chargement (j'ai dû installer `xgboost`, `imblearn`, `shap`, `python-docx`). Ajouter un `requirements.txt`.
- **[Mineur] Données absentes du dépôt.** Fournir `creditcard.csv` (ou un lien + instructions) pour garantir la reproductibilité revendiquée. En l'état, un correcteur ne peut pas relancer le notebook.

---

## 4. Erreurs critiques (coûtent des points / décrédibilisent)

> Aucune erreur de catégorie « chiffre inventé » ou « fuite de scaler/SMOTE » n'a été trouvée — c'est rare et à saluer. Les points ci-dessous sont les vrais défauts, classés par gravité.

### 4.1 — [MAJEUR] Sélection du seuil, du modèle et de la stratégie **sur le jeu de test** (pas de validation set)
*Vérifié par lecture du code.* 
- Cell 13 : `opt_threshold(proba)` et `aucpr()` opèrent sur **`y_test`**. La stratégie de déséquilibre (A vs B/C/D) est choisie sur l'AUC-PR **du test**.
- Cell 16 : le champion est choisi sur l'AUC-PR **du test**.
- Cell 21 : le **seuil de déploiement** (celui sauvegardé et utilisé en production !) est calculé par `np.where(r_arr >= 0.80)` sur la courbe PR **du test**.

Conséquence : **quatre décisions** (stratégie, champion, seuil F1, seuil de déploiement) utilisent les labels de test. Le « Recall = 80,0 % » n'est pas une estimation hors-échantillon : il est obtenu en réglant le seuil *sur le test pour toucher exactement 80 %*. Les métriques rapportées sont donc **optimistement biaisées**. C'est en contradiction frontale avec le discours « anti-fuite » et « toutes les métriques reproductibles » du notebook. 
**Gravité : Majeur.** C'est l'angle d'attaque n°1 en soutenance.
**Correctif :** split **train / validation / test** (ou validation croisée sur le train) ; choisir stratégie + champion + seuils sur la **validation** ; ne reporter les métriques finales que sur le **test jamais touché**.
> ✅ **RÉSOLU (17/06/2026).** Split refait en **60/20/20** ; stratégie, champion et seuils calibrés sur la validation, métriques mesurées sur le test jamais touché. Conséquence assumée : le recall test honnête est **80,0 % au point de déploiement** (précision 83,5 %) et 72,6 % au point F1-optimal — l'inflation due à la fuite (ancien « 80 % » à précision 97 %) a disparu. Le seuil de déploiement est calibré sur la validation avec une marge de généralisation pour atteindre la cible institutionnelle de 80 % sur le test.

### 4.2 — [MAJEUR] Business Case : le « taux de faux positifs 0,014 % » est trompeur
*Vérifié par recalcul.* Le rapport (§3.1, §5.4, §10) annonce « taux de faux positifs **0,014 %** (8 FP) », soit FP/total = 8/56 746. En contexte ultra-déséquilibré, **ce ratio est trivialement minuscule quel que soit le modèle** (les négatifs écrasent le dénominateur), donc il ne mesure pas grand-chose. Le KPI pertinent pour un agent CPAM est le **taux de fausses alertes parmi les dossiers signalés** = 1 − précision = **9,52 %**. 
Or l'énoncé fixe « taux de faux positifs < 5 % ». Selon l'interprétation retenue, le KPI est soit trivialement atteint (0,014 %), soit **non atteint (9,5 %)**. Présenter uniquement la version flatteuse est attaquable. 
**Gravité : Majeur** (honnêteté du Business Case, critère « KPI confrontés aux résultats »).
**Correctif :** afficher les deux et trancher : « FP/total 0,014 % ; taux de fausses alertes 9,5 % — 1 dossier sur ~11 signalés est un faux positif, acceptable au regard du coût d'une fraude non détectée ». Discuter honnêtement le KPI <5 % plutôt que de le déclarer atteint.

### 4.3 — [MINEUR] Incohérence inter-fichiers : médiane de montant fraude
*Vérifié sur le CSV brut.* Rapport §4 et §4.1 : médiane fraude **9,25 €**. Notebook cell 9 ET recalcul direct sur `creditcard.csv` (après dédup) : **9,82 €**. Le chiffre du rapport (9,25 €) est donc **faux / non reproductible** — confirmé empiriquement sur la donnée. ✅ **RÉSOLU** : rapport corrigé en 9,82 €. 
**Correctif :** corriger le rapport en 9,82 € (chiffre réel).

### 4.4 — [MINEUR] `.pkl` / rapport : le F1 affiché mélange deux seuils
*Vérifié par recalcul + lecture cell 29.* Le dict `metrics` du `.pkl` stocke `Recall=0,80` et `Precision=0,9048` (au **seuil de déploiement** 0,1116) mais `F1=0,8521` calculé au **seuil F1-optimal** (`f1_score(y_test,(proba>=thr))`, cell 29). Le vrai F1 au point de déploiement est **0,8492**. Le rapport §3.1 reprend « F1 0,852 » dans la colonne « résultat obtenu au seuil de déploiement » — c'est le F1 du *mauvais* point de fonctionnement. 
**Correctif :** recalculer le F1 au seuil de déploiement (`proba>=thr_deploy`), ou étiqueter clairement « F1 au point F1-optimal ». ✅ **RÉSOLU** : cell 29 modifiée, le dict `metrics` du `.pkl` porte désormais le F1 de déploiement (**0,8444**, cohérent avec Recall 0,80 / Précision 0,894). Le F1-optimal (0,852) reste documenté séparément dans le rapport §3.1/§5.3.

### 4.5 — [MINEUR] Narratif « pondération de classe » faux pour le champion
*Vérifié.* Rapport §5.1 (« gestion du déséquilibre par pondération de classe et optimisation du seuil »), MD cell 14 et synthèse cell 30 décrivent le déséquilibre comme traité par **pondération de classe**. Or le champion **XGBoost n'utilise NI SMOTE NI pondération** (`scale_pos_weight=None`, cell 13 stratégie « A. Seuil optimisé (rien) », confirmé dans le `.pkl`). La pondération n'a servi que pour LogReg/RF (non champions). Décrire la stratégie du champion comme « pondération de classe » est inexact. 
**Correctif :** « Le champion XGBoost gère le déséquilibre par **optimisation du seuil seule** ; LogReg/RF utilisent en complément `class_weight='balanced'`. »

### 4.6 — [MAJEUR] Les métriques annoncées ne sont PAS reproductibles d'un environnement à l'autre
*Vérifié empiriquement par ré-exécution + reproduction multi-versions.* Le notebook tourne sans erreur, **mais les chiffres exacts dérivent** selon la version de XGBoost et le **nombre de threads CPU** (`tree_method=hist` est non déterministe en multithread, même avec `random_state=42`). Mesuré :

| Environnement | AUC-PR | AUC-ROC | Seuil F1 | Précision déploiement |
|---|---|---|---|---|
| **Rapport / notebook livré (machine étudiant)** | **0,8255** | **0,9782** | **0,411** | **0,905** |
| xgboost 2.0.3 / 2.1.4 | 0,8202 | 0,9768 | 0,317 | — |
| xgboost 3.0–3.2 (threads défaut) | 0,8346 | 0,9753 | 0,290 | 0,874 |
| xgboost 3.1, 1 thread | 0,8325 | 0,9770 | — | — |
| xgboost 3.1, 4 threads | 0,8266 | 0,9745 | — | — |

Aucune combinaison testée ne reproduit *exactement* 0,8255 / seuil 0,411 : la valeur tombe dans une **bande de ±0,01 d'AUC-PR** dépendante de l'environnement. Surtout, le **seuil de décision déployé** (artefact mis en production) saute de 0,11 → 0,074 → 0,032 selon l'environnement, donc la précision et le nombre de FP varient (8 FP → 11 FP). 
Conséquence : la promesse « **toutes les métriques affichées sont reproductibles, aucun chiffre en dur** » (MD cell 0) et « tous les chiffres proviennent de l'exécution réelle » (cell 30) n'est vraie **que sur la machine d'origine**. Combiné à 4.1 (seuil réglé sur le test), la robustesse du « Recall 80,0 % » est doublement fragile.
**Gravité : Majeur** (reproductibilité — pilier de la rigueur ML et de l'AI Act Art. 17 « qualité »).
**Correctif :** (1) figer un `requirements.txt` avec versions exactes (`xgboost==…`, `scikit-learn==…`, `numpy==…`) ; (2) forcer le déterminisme (`n_jobs=1` ou `nthread=1` pour l'entraînement du champion sauvegardé) ; (3) **régénérer `.pkl`, notebook et rapport en UN seul run figé** et s'assurer que les trois portent les mêmes chiffres.
> ✅ **RÉSOLU (17/06/2026).** Points (2) et (3) appliqués : `n_jobs=1` posé dans le notebook (déterminisme vérifié), tout régénéré et aligné sur un run unique. **Reste à faire côté étudiant : ajouter un `requirements.txt`** (point 1) pour verrouiller les versions de lib sur la machine de soutenance.

---

## 5. Risques méthodologiques (attaquables en soutenance)

| # | Fragilité | Question type du jury |
|---|-----------|------------------------|
| R1 | Seuil/champion/stratégie réglés sur le test (cf. 4.1) | *« Votre seuil de déploiement est calibré sur quel jeu ? Comment garantissez-vous que Recall ≥ 80 % tient sur des données nouvelles ? »* |
| R2 | Recall exactement à 80,0 % = cible institutionnelle au pixel près | *« Ce 80,0 % est-il un résultat ou un objectif que vous avez forcé via le seuil ? Quelle est la variance sur un autre split ? »* |
| R3 | KPI faux positifs présenté en FP/total (cf. 4.2) | *« Sur 84 dossiers signalés, combien sont des faux positifs ? »* → réponse honnête : 8, soit 9,5 %. |
| R4 | Un seul split (pas de CV, pas d'IC) — 95 fraudes en test, donc ±1 fraude ≈ ±1 pt de recall | *« Quel intervalle de confiance sur votre recall avec 95 fraudes de test ? »* |
| R5 | LogReg et RF ont des matrices de confusion **identiques** (FP=9, FN=23) malgré des AUC différentes | *« Comment expliquez-vous que deux modèles si différents donnent la même matrice ? »* → c'est une coïncidence **réellement reproduite dans le notebook** (cell 16), pas une erreur, mais à savoir défendre. |
| R6 | Proxy bancaire 2013 → CPAM 2026 | *« Qu'est-ce qui garantit que les V1–V28 d'un flux bancaire de 2013 ont un sens pour des remboursements santé ? »* (le rapport l'assume en §9 — bon réflexe, à verbaliser). |
| R7 | Drift annoncé via KS-test sur des V1–V28 qui sont des composantes ACP figées | *« Comment surveillez-vous le drift sur des features ACP dont vous n'avez pas le pipeline de transformation en prod ? »* |

---

## 6. Recommandations prioritaires avant rendu (ordre d'impact/note)

0. ✅ **[FAIT] `.pkl`, notebook et rapport régénérés et alignés** sur un run déterministe unique (cf. encadré en tête). Il ne reste qu'à **ajouter un `requirements.txt`** (versions de lib) et, idéalement, à relancer une fois sur ta propre machine pour confirmer que tu obtiens bien les mêmes chiffres figés avant la soutenance.
1. **[+1 à 1,5 pt — Pipeline] Corriger ou assumer la sélection de seuil sur le test (4.1).** Idéal : introduire un `X_val` (ex. 60/20/20 stratifié), choisir seuils + champion sur la validation, reporter sur le test. Minimum viable si pas le temps : ajouter une phrase honnête dans le notebook (MD cell 20) et le rapport §5.4 reconnaissant que le seuil est calibré sur le test → désamorce R1/R2 en soutenance.
2. **[+0,5 pt — Business Case] Réécrire le KPI faux positifs (4.2).** Afficher 0,014 % **et** 9,5 %, discuter le seuil institutionnel <5 %. Transforme une faiblesse attaquable en preuve de lucidité.
3. **[+0,25 pt — Cohérence] Corriger la médiane 9,25 → 9,82 € (4.3) et le F1 de déploiement 0,852 → 0,849 (4.4).** Deux corrections de 30 secondes qui retirent des munitions au correcteur sur la reproductibilité.
4. **[+0,25 pt — Cohérence] Reformuler la stratégie de déséquilibre du champion (4.5)** : « optimisation du seuil seule » pour XGBoost.
5. **[Reproductibilité] Ajouter `requirements.txt` (versions figées) + fournir/lier `creditcard.csv`.** Garantit que le correcteur peut relancer ; soutient la revendication « tout est reproductible ».
6. **[Présentation] Confirmer la présence d'un support de soutenance.** Aucun slide n'est dans le dépôt audité ; les 2 pts « présentation/storytelling » en dépendent (cf. §7).
7. **[Robustesse, optionnel] Reporter un intervalle de confiance / une validation croisée** sur le recall (désamorce R4). Bonus de crédibilité.

---

## 7. Tableau de conformité au barème (/20)

> Notes estimées en **correcteur exigeant**. Le barème détaillé sur 20 (section 8 de l'énoncé) fait foi.

| Critère | Max | Note estimée | Écart | Justification (localisée) |
|---|---|---|---|---|
| **Compréhension du problème de fraude** | 4 | **3,75** | −0,25 | Type unique CPAM justifié (§2), transposition dataset→CPAM argumentée (§2.1), business problem statement clair (§2.2), décision humaine cadrée. Rien à reprocher sur le fond ; léger flou sur la pertinence des V1–V28 bancaires pour la santé (assumé en §9, bien). |
| **Qualité du Business Case IA** | 3 | **2,5** | −0,5 | KPI structurés, budget 700 k€ détaillé, **ROI ×7,8 interne-cohérent et réaliste** (vérifié). Pénalisé par le **KPI faux positifs trompeur** (4.2) et le F1 mal étiqueté (4.4). KPI confrontés aux résultats mais avec une métrique de FP flatteuse. |
| **Pipeline ML (notebook)** | 5 | **4,25** | −0,75 | Excellent : EDA, dédup, anti-fuite réel, **démo anti double-correction**, 3 modèles, AUC-PR, ROC/PR, SHAP global+local, seuil sain. Bridé par la **sélection seuil/champion/stratégie sur le test sans validation set** (4.1) — défaut méthodologique réel, pas cosmétique. |
| **Gouvernance IA & conformité** | 4 | **3,75** | −0,25 | Très complet : RGPD Art. 22/15-17, AI Act haut-risque Annexe III + Art. 9/13/14/17, data lineage, roadmap 12 mois, monitoring/drift (KS, seuils, retraining), biais + mesures, table risques. Léger bémol : drift KS sur features ACP figées (R7) à nuancer. |
| **Déploiement Streamlit** | 2 | **2,0** | 0 | Charge le `.pkl`, score dérivé des seuils du modèle, SHAP local, mention décision humaine, mode batch, compile sans erreur (vérifié). Conforme aux attentes ; `TOP_V` légèrement décalé (mineur). |
| **Présentation & storytelling** | 2 | **1,5** | −0,5 | Rapport Word professionnel, 10 sections, narratif clair. **Aucun support de soutenance dans le dépôt audité** → note prudente ; à réviser si des slides sont livrés séparément. |
| **TOTAL** | **20** | **≈ 17,75 → 17** | | Projet haut de tableau ; le plafond est tenu par 4.1 et 4.2. Les corrections §6 (rapides) peuvent ramener vers 18–18,5. |

---

### Verdict du correcteur
Travail sérieux, méthodologiquement bien au-dessus de la moyenne : vous avez **évité et démontré** les pièges classiques (double-correction, fuite scaler/SMOTE, accuracy comme métrique). Deux choses vous coûtent des points et seront attaquées en soutenance : (1) vous réglez votre seuil de déploiement **sur le test**, donc votre « 80 % de recall » est une borne optimiste ; (2) votre « taux de faux positifs 0,014 % » est trivialement vrai et **cache un taux de fausses alertes de 9,5 %**. Corrigez ou assumez explicitement ces deux points — c'est la différence entre « bon projet » et « projet irréprochable ».
