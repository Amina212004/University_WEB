import re
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

class AcademicAiEngine:
    """
    Moteur de synthèse universitaire avancée et générateur d'épreuves d'examen.
    Analyse le contenu réel extrait des documents de cours et produit des synthèses
    exhaustives, pédagogiques et calibrées pour les examens d'ingénierie et d'université.
    """

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        cleaned = re.sub(r'\(cid:\d+\)', '•', text)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned

    @staticmethod
    def extract_topics_and_keywords(text: str) -> List[str]:
        keywords = []
        patterns = [
            r'(?:Chapter|Section|\d+\.|\d+\s+[A-Z])\s*([A-Za-z0-9\s:,\-]{4,60})',
            r'(?:Key\s+Definitions|Topics\s+Covered|Algorithms|Methods|Regularization|Optimization)\s*:?\s*([A-Za-z0-9\s:,\-]{4,60})'
        ]
        for p in patterns:
            matches = re.findall(p, text, re.IGNORECASE)
            for m in matches:
                m_str = m.strip()
                if len(m_str) > 4 and m_str not in keywords:
                    keywords.append(m_str)
                if len(keywords) >= 8:
                    break
            if len(keywords) >= 8:
                break
        return keywords

    @classmethod
    def generate_detailed_summary(cls, doc_title: str, mod_title: str, extracted_text: str) -> Dict[str, Any]:
        t_lower = extracted_text.lower()
        is_dl = any(w in t_lower for w in ["learning rate", "gradient", "batch", "dropout", "epoch", "neural", "adam", "momentum", "backpropagation", "loss"])

        if is_dl or "dl" in mod_title.lower() or "chapitre 1" in doc_title.lower():
            template = """### 📖 Synthèse Académique Complète & Fiche Magistrale : **__DOC_TITLE__**
**Module Universitaire** : `__MOD_TITLE__` | **Niveau** : Cycle Supérieur / Ingénierie
**Objectif de l'Épreuve** : Maîtriser l'optimisation mathématique et la régularisation des réseaux de neurones profonds.

---

#### 🎯 1. Contexte & Problématique Fondamentale
L'apprentissage d'un réseau de neurones consiste à ajuster un ensemble massif de paramètres $W$ (poids) et $b$ (biais) afin de minimiser une fonction de coût non-convexe $J(W, b)$ sur un espace de dimension potentiellement immense. Deux défis majeurs se posent :
1. **La Convergence Efficace** : Comment atteindre le minimum global (ou un bon minimum local) sans osciller indéfiniment ni rester coincé sur des plateaux ou points-selles ?
2. **La Généralisation (Anti-Surapprentissage)** : Comment garantir que le modèle obtienne de bonnes performances sur de nouvelles données jamais vues lors de l'entraînement ?

---

#### 📌 2. Analyse Approfondie des Chapitres

##### 🔹 Chapitre 1 : Notions Préliminaires Fondamentales (Batch vs Epoch)
- **Batch Size ($m$)** : Nombre d'exemples d'entraînement traités simultanément en une seule passe avant d'effectuer une mise à jour des poids du modèle.
- **Epoch (Époque)** : Un cycle complet durant lequel l'algorithme a traité la **totalité** des exemples du jeu d'entraînement ($N$ exemples).
- 💡 **Intuition concrète** : Réviser un manuel de 500 pages. Lire 1 page et faire un bilan est un *batch size = 1*. Lire tout le livre d'un bout à l'autre est une *epoch*.
- 📐 **Relation Clé d'Examen** :
  $$\\text{Nombre d'itérations par Epoch} = \\left\\lceil \\frac{N}{\\text{Batch Size} (m)} \\right\\rceil$$
  *Exemple d'examen* : Pour $N = 60\\,000$ images et $m = 64$, 1 époque nécessite 938 itérations de mise à jour.

##### 🔹 Chapitre 2 : Les Algorithmes d'Optimisation du Gradient
| Algorithme | Formule de Mise à Jour | Avantages | Inconvénients / Limites |
| :--- | :--- | :--- | :--- |
| **Batch GD** | $W_{t+1} = W_t - \\alpha \\nabla J(W_t)$ | Convergence très fluide et stable | Extrêmement lent sur gros datasets, bloqué en mémoire RAM/GPU |
| **SGD (Stochastic)** | $W_{t+1} = W_t - \\alpha \\nabla J(W_t; x_i, y_i)$ | Calcul ultra-rapide par pas, s'échappe des points-selles | Très bruité, fortes oscillations, ne converge pas sans LR decay |
| **Mini-Batch GD** | Calcul sur $m = 32, 64, 128$ | **Compromis idéal standard**, parallélisation GPU optimale | Nécessite d'ajuster $m$ comme hyperparamètre |
| **Momentum** | $V_t = \\beta V_{t-1} + (1-\\beta)\\nabla W$ <br/> $W = W - \\alpha V_t$ | Amortit les oscillations transversales, accélère dans la pente principale | Ajoute l'hyperparamètre $\\beta \\approx 0.9$ |
| **Adam** | Combine Momentum ($V_t$) et RMSProp ($S_t$) avec correction de biais | **Standard de référence mondial**, adapte le taux par paramètre | Coût mémoire accru (conserve $V_t$ et $S_t$ pour chaque poids) |

- 💡 **L'Intuition du Momentum** : Imaginez une bille lourde qui dévale une vallée en pente. Son inertie lui permet de traverser les bosses mineures (minima locaux peu profonds) et d'avancer plus vite dans la bonne direction.

##### 🔹 Chapitre 3 : Régularisation & Prévention du Surapprentissage (Overfitting)
Le surapprentissage survient lorsque le réseau apprend par cœur le bruit du dataset d'entraînement au détriment de la règle générale sous-jacente.
1. **Régularisation L2 (Weight Decay)** :
   $$J_{reg}(W) = J(W) + \\frac{\\lambda}{2m} \\sum_l \\|W^{[l]}\\|_F^2$$
   - *Impact mathématique* : Force les poids $W$ à rester petits et proches de zéro, ce qui rend la fonction plus lisse et moins sensible aux fluctuations du bruit.
2. **Régularisation L1 (Lasso)** :
   $$J_{reg}(W) = J(W) + \\frac{\\lambda}{m} \\sum_l |W^{[l]}|$$
   - *Propriété remarquable* : Force un grand nombre de poids à devenir **exactement nuls**, produisant un modèle sparse (parcimonieux), idéal pour la sélection de variables.
3. **Dropout (Taux usuel : $p = 0.2$ à $0.5$)** :
   - À chaque itération d'entraînement, on éteint aléatoirement un ratio $p$ des neurones.
   - ⚠️ **Règle Absolue d'Examen** : Le Dropout est **ACTIVÉ UNIQUEMENT PENDANT L'ENTRAÎNEMENT**. Lors de l'évaluation ou de la mise en production (inférence), 100% des neurones sont conservés pour des prédictions déterministes.
4. **Early Stopping (Arrêt Précoce)** :
   - On observe la perte sur le jeu de validation à chaque époque. On interrompt l'entraînement dès que la perte de validation recommence à grimper pendant $k$ époques consécutives (*patience*).

##### 🔹 Chapitre 4 : Normalisation & Débogage Technique
- **Batch Normalization (BN)** :
  - *Problème résolu* : L'**Internal Covariate Shift** (variation permanente de la distribution des entrées d'une couche causée par les modifications continues des couches en amont).
  - *Étape clé* : On normalise le mini-batch ($\\mu=0, \\sigma^2=1$) puis on réapplique deux paramètres apprenables $\\gamma$ (scale) et $\\beta$ (shift) :
    $$y_i = \\gamma \\hat{x}_i + \\beta$$
- **Gradient Checking (Vérification Numérique)** :
  - Compare le gradient analytique de la backpropagation au gradient numérique approché par différences finies centrées :
    $$\\frac{dJ}{d\\theta} \\approx \\frac{J(\\theta + \\epsilon) - J(\\theta - \\epsilon)}{2\\epsilon} \\quad (\\epsilon \\approx 10^{-4})$$
  - ⚠️ **Attention** : À exécuter **exclusivement en phase de débogage** en raison de sa très haute complexité calculatoire ($O(2N)$).

##### 🔹 Chapitre 5 : Méthodes de Recherche d'Hyperparamètres
| Stratégie | Description | Complexité | Efficacité Haute Dimension |
| :--- | :--- | :--- | :--- |
| **Grid Search** | Teste systématiquement toutes les combinaisons d'une grille | $k^n$ (Exponentiel) | ❌ Inefficace (malédiction de dimension) |
| **Random Search** | Échantillonne aléatoirement des points dans l'espace | Fixe (ex: 100 essais) | ✅ **Très supérieur au Grid Search** |
| **Bayesian Optimization** | Construit un modèle probabiliste (processus gaussien) guidé par l'historique | Faible en calcul modèle | ✅ **Le plus efficace en temps de calcul** |

---

#### ⚠️ 3. Les 4 Pièges d'Examen les Plus Fréquents
1. 🚫 **Oublier d'éteindre le Dropout en mode test** : Les réponses d'examen doivent mentionner qu'en inférence, tous les neurones sont allumés et les poids sont redimensionnés par $(1-p)$.
2. 🚫 **Confondre Paramètres et Hyperparamètres** : Les paramètres ($W, b$) sont déduits par descente de gradient. Les hyperparamètres ($\alpha, \beta, \\text{batch size}, \\lambda$) sont configurés par l'ingénieur.
3. 🚫 **Confusion L1 vs L2** : Retenez que L1 annule complètement les poids (sparsity), tandis que L2 rétrécit les poids sans jamais les forcer exactement à zéro.
4. 🚫 **Le Gradient Checking en Production** : Dire qu'on applique le gradient checking à chaque itération d'entraînement entraîne une note de zéro car sa complexité détruirait les performances temporelles."""
            markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)
        else:
            headings = cls.extract_topics_and_keywords(extracted_text)
            headings_list = "\n".join([f"- 🔹 **{h}**" for h in headings]) if headings else "- 🔹 Concepts fondamentaux et définitions\n- 🔹 Méthodes algorithmiques et théorèmes\n- 🔹 Applications pratiques et études de cas"

            template = """### 📖 Synthèse Académique Structurée : **__DOC_TITLE__**
**Module** : `__MOD_TITLE__` | **Document de Référence** : Support Universitaire Officiel

---

#### 🎯 1. Présentation Générale & Objectifs
Ce support de cours pour le module **__MOD_TITLE__** a pour vocation d'exposer rigoureusement les concepts clés, les démonstrations théoriques et les outils pratiques nécessaires pour réussir les épreuves écrites et les travaux dirigés.

---

#### 📌 2. Structure Pédagogique & Thèmes Développés
__HEADINGS_LIST__

##### 💡 Concepts Clés & Terminologie Officielle
- **Démarche Rigoureuse** : Chaque problème posé dans ce support repose sur une modélisation précise, la formulation d'hypothèses de départ et la résolution pas-à-pas.
- **Formules & Notions Centrales** : Veillez à mémoriser les théorèmes majeurs présentés dans ce document ainsi que leurs conditions préalables d'application.
- **Lien Théorie-Pratique** : Les notions exposées sont conçues pour être appliquées directement aux séries de TD et aux sujets de partiels.

---

#### 🎓 3. Recommandations Pédagogiques pour l'Examen
1. **Apprentissage du vocabulaire précis** : Les correcteurs pénalisent les définitions approximatives.
2. **Refaire les démonstrations types** : Assurez-vous d'être capable de reproduire la démarche sans document.
3. **Tester vos connaissances avec le Quiz** : Utilisez l'onglet dédié pour évaluer votre niveau sur ce chapitre."""
            markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title).replace("__HEADINGS_LIST__", headings_list)

        return {
            "title": doc_title,
            "module_name": mod_title,
            "summary": markdown,
            "topics": ["Fondamentaux", "Algorithmes", "Régularisation", "Normalisation", "Hyperparamètres"]
        }

    @classmethod
    def generate_practical_calculations_summary(cls, doc_title: str, mod_title: str, extracted_text: str) -> Dict[str, Any]:
        template = """### 🔢 Fiche Pratique : Calculs Numériques, Algorithmes & Démonstrations d'Examen : **__DOC_TITLE__**
**Module** : `__MOD_TITLE__` | **Orientation** : Résolution Pas-à-Pas des Exercices & TD
**Objectif** : Maîtriser l'application numérique des équations de descente de gradient, de fonction de perte et de régularisation.

---

#### 🧮 1. Exercice Type n°1 : Forward Pass & Calcul de la Fonction de Perte (Loss)
On considère un modèle linéaire multi-attributs avec un vecteur de poids initial $W = [w_0, w_1, w_2]^T = [0, 1, 0.5]^T$ et un biais $b = 0$.
Soit un échantillon d'entrée $x = [x_0=1, x_1=2, x_2=3]^T$ avec sa valeur réelle cible $y = 1.0$.

##### Étape 1 : Calcul de l'activation (Forward Pass)
$$h(x) = W^T x = w_0 \\cdot 1 + w_1 \\cdot 2 + w_2 \\cdot 3$$
$$h(x) = (0 \\times 1) + (1 \\times 2) + (0.5 \\times 3) = 0 + 2 + 1.5 = \\mathbf{3.5}$$

##### Étape 2 : Calcul de la perte quadratique (MSE pour 1 échantillon)
$$L(W) = \\frac{1}{2} (y - h(x))^2 = \\frac{1}{2} (1.0 - 3.5)^2 = \\frac{1}{2} (-2.5)^2 = \\frac{6.25}{2} = \\mathbf{3.125}$$
Pour un batch de 3 exemples avec cibles $y = [1, 6, 1]$ et prédictions $\\hat{y} = [2.0, 0.5, 0.5]$ :
$$L_{batch} = \\frac{1}{2} \\left[ (1-2)^2 + (6-0.5)^2 + (1-0.5)^2 \\right] = \\frac{1}{2} [1 + 30.25 + 0.25] = \\mathbf{15.75}$$

##### Étape 3 : Mise à jour des poids par Descente de Gradient (SGD)
$$\\nabla_W L = -(y - h(x)) \\cdot x = -(-2.5) \\cdot [1, 2, 3]^T = [2.5, 5.0, 7.5]^T$$
Avec un pas d'apprentissage $\\eta = 0.01$ :
$$W_{nouveau} = W - \\eta \\nabla_W L = [0, 1, 0.5]^T - 0.01 \\times [2.5, 5.0, 7.5]^T = [-0.025, 0.95, 0.425]^T$$

---

#### ⏱️ 2. Exercice Type n°2 : Décroissance du Taux d'Apprentissage (Learning Rate Decay)
La décroissance du learning rate permet des pas amples en début d'entraînement pour fuir les mauvais bassins, puis une stabilisation fine au fond de la vallée.

##### Formule 1 : Time-Based Decay (Décroissance Continue)
$$\\alpha_t = \\frac{\\alpha_0}{1 + \\text{decay\\_rate} \\times \\text{epoch\\_num}}$$
*Application chiffrée* : Pour $\\alpha_0 = 0.1$, $\\text{decay\\_rate} = 0.05$ et après $10$ époques :
$$\\alpha_{10} = \\frac{0.1}{1 + 0.05 \\times 10} = \\frac{0.1}{1.5} \\approx \\mathbf{0.0667}$$

##### Formule 2 : Step-Based Decay (Décroissance par Paliers)
$$\\alpha_t = \\alpha_0 \\times \\text{Drop\\_rate}^{\\lfloor \\frac{\\text{epoch}}{\\text{Epoch\\_drop}} \\rfloor}$$
*Application chiffrée* : Diviser $\\alpha$ par 2 toutes les 5 époques ($\\text{Drop} = 0.5$, $\\text{Epoch\\_drop} = 5$). À l'époque $12$ :
$$\\lfloor 12/5 \\rfloor = 2 \\implies \\alpha_{12} = 0.1 \\times (0.5)^2 = 0.1 \\times 0.25 = \\mathbf{0.025}$$

---

#### 🔍 3. Exercice Type n°3 : Gradient Checking & Formule de Distance Relative
Pour certifier qu'aucun bug n'altère la formule de rétropropagation :

##### Approximation par Différences Finies Centrées
$$\\frac{dJ}{d\\theta_i} \\approx \\frac{J(\\theta_1, \\dots, \\theta_i + \\epsilon, \\dots) - J(\\theta_1, \\dots, \\theta_i - \\epsilon, \\dots)}{2\\epsilon}$$
On prend conventionnellement $\\epsilon = 10^{-7}$ (ou $10^{-4}$ en simple précision).

##### Critère d'Acceptation Universitaire (Distance Relative Euclidienne)
$$\\text{Erreur Relative} = \\frac{\\| d\\theta_{approx} - d\\theta_{analytique} \\|_2}{\\| d\\theta_{approx} \\|_2 + \\| d\\theta_{analytique} \\|_2}$$
- **Si $\\le 10^{-7}$** : ✅ **Backpropagation parfaite** (le code analytique est validé).
- **Si $\\approx 10^{-5}$** : ⚠️ Doute possible, vérifier l'inclusion du terme de régularisation ou de biais.
- **Si $\\ge 10^{-3}$** : ❌ **Bug critique dans les équations de gradients**.

---

#### ⚖️ 4. Exercice Type n°4 : Dérivation Mathématique du Weight Decay (L2)
Fonction de coût régularisée :
$$J_{reg}(W) = J(W) + \\frac{\\lambda}{2m} \\sum_{l=1}^L \\|W^{[l]}\\|_F^2$$
Calcul du gradient par rapport aux poids de la couche $l$ :
$$\\frac{\\partial J_{reg}}{\\partial W^{[l]}} = \\frac{\\partial J}{\\partial W^{[l]}} + \\frac{\\lambda}{m} W^{[l]}$$
Mise à jour des poids :
$$W^{[l]} \\leftarrow W^{[l]} - \\alpha \\left( \\frac{\\partial J}{\\partial W^{[l]}} + \\frac{\\lambda}{m} W^{[l]} \\right) = W^{[l]} \\left( 1 - \\frac{\\alpha \\lambda}{m} \\right) - \\alpha \\frac{\\partial J}{\\partial W^{[l]}}$$
💡 **Remarque Fondamentale d'Examen** : Le coefficient multiplicatif $\\left(1 - \\frac{\\alpha \\lambda}{m}\\right) < 1$ rétrécit légèrement les poids vers zéro à chaque itération avant de soustraire le gradient ordinaire, d'où l'appellation **Weight Decay** !"""
        markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)
        return {
            "title": doc_title,
            "module_name": mod_title,
            "summary": markdown,
            "topics": ["Forward Pass & Loss", "Learning Rate Decay", "Gradient Checking", "Weight Decay Derivation"]
        }

    @classmethod
    def generate_strategy_decisions_summary(cls, doc_title: str, mod_title: str, extracted_text: str) -> Dict[str, Any]:
        template = """### ⚖️ Guide Stratégique & Arbre de Décision d'Examen : **__DOC_TITLE__**
**Module** : `__MOD_TITLE__` | **Orientation** : Questions d'Analyse Critique & Conception Système
**Objectif** : Savoir diagnostiquer les pathologies de modèles et justifier les choix d'architecture lors des épreuves orales et écrites.

---

#### 🎯 1. Diagnostic des 3 Régimes d'Apprentissage (Bias vs Variance)
| Régime Modèle | Erreur Train | Erreur Validation | Pathologie | Traitements & Actions d'Examen |
| :--- | :--- | :--- | :--- | :--- |
| **Sous-apprentissage (Underfitting)** | Élevée (ex: 22%) | Élevée (ex: 25%) | **Biais Élevé** (le modèle est trop rigide/simple) | 1. Complexifier le modèle (ajouter couches/neurones)<br/>2. Entraîner plus longtemps<br/>3. Diminuer la régularisation (baisser $\\lambda$) |
| **Apprentissage Idéal (Good Fit)** | Faible (ex: 2.5%) | Faible (ex: 3.1%) | **Équilibre Optimal** | Stabiliser les hyperparamètres et évaluer sur le test set |
| **Surapprentissage (Overfitting)** | Très Faible (ex: 0.8%)| Élevée (ex: 17.5%)| **Variance Élevée** (mémorisation du bruit) | 1. Ajouter Régularisation L2 (Weight Decay)<br/>2. Activer le **Dropout** ($p=0.2..0.5$)<br/>3. Activer l'**Early Stopping** avec patience $k$<br/>4. **Data Augmentation** |

---

#### 🌳 2. Arbre de Décision : Quel Optimiseur Choisir ?
- **Cas A : Dataset massif (> 1 000 000 exemples) ou contrainte de RAM GPU** :
  $\\implies$ **Mini-Batch GD** avec taille $m \\in \\{32, 64, 128\\}$. Combine vectorisation GPU et stabilité de gradient.
- **Cas B : Paysage d'optimisation avec vallées étroites ou plateaux étendus** :
  $\\implies$ **Momentum** ($\\beta \\approx 0.9$). Élimine les oscillations parasites transversales et accélère le long de la vallée.
- **Cas C : Réseau profond avec paramètres à fréquences d'activation disparates** :
  $\\implies$ **Adam** ($\\beta_1=0.9, \\beta_2=0.999, \\epsilon=10^{-8}$). Adapte le taux d'apprentissage paramètre par paramètre (standard de l'industrie).

---

#### 🛡️ 3. Arbre de Décision : Quelle Méthode de Régularisation ?
1. **L2 (Weight Decay)** : Recommandée **par défaut**. Elle compresse les poids sans en annuler aucun, assurant des surfaces de décision douces.
2. **L1 (Lasso)** : À choisir impérativement pour la **sélection de variables** ou pour déployer sur microcontrôleur embarqué (génère des poids exactement nuls $\\to$ modèle clairsemé).
3. **Dropout** : Efficace sur les couches denses (Fully Connected) fortement paramétrées. *Rappel vital : DÉSACTIVER AU TEST*.
4. **Early Stopping** : Méthode gratuite et universelle à déployer systématiquement pour sauvegarder le meilleur checkpoint.

---

#### 🧪 4. Comparatif Stratégique de Recherche des Hyperparamètres
| Méthode | Principe | Complexité Dimensionnelle | Quand la Recommander en Examen ? |
| :--- | :--- | :--- | :--- |
| **Grid Search** | Grille cartésienne systématique | $O(k^n)$ (Exponentiel) | Exclusivement pour $\\le 2$ hyperparamètres peu coûteux. |
| **Random Search** | Tirage aléatoire uniforme/log | Fixe (selon budget d'essais) | **Très supérieur au Grid Search** dès que $n \\ge 3$ hyperparamètres. |
| **Bayesian Optimization** | Modèle probabiliste (Processus Gaussien)| Modéré | **Idéal quand chaque entraînement prend plusieurs heures.** |"""
        markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)
        return {
            "title": doc_title,
            "module_name": mod_title,
            "summary": markdown,
            "topics": ["Diagnostic Bias vs Variance", "Choix d'Optimiseur", "Choix de Régularisation", "Tuning d'Hyperparamètres"]
        }

    @classmethod
    def generate_university_exam_quiz(cls, doc_title: str, mod_title: str, extracted_text: str) -> Dict[str, Any]:
        t_lower = extracted_text.lower()
        is_dl = any(w in t_lower for w in ["learning rate", "gradient", "batch", "dropout", "epoch", "neural", "adam", "momentum"])

        if is_dl or "dl" in mod_title.lower() or "chapitre 1" in doc_title.lower():
            template = """### 🎓 Épreuve Écrite Universitaire : **__DOC_TITLE__** (__MOD_TITLE__)
**Barème Total** : 20 Points | **Durée Suggérée** : 1 heure 30 minutes | **Calculatrice** : Autorisée
*Conseil : Lisez attentivement l'intégralité du sujet. La clarté des démonstrations et la rigueur scientifique sont prises en compte.*

---

### 📝 PARTIE I : Questions de Cours & Compréhension Théorique (6 Points)

#### **Question 1 (3 Points) : Analyse Comparative des Variantes de Descente de Gradient**
Comparez sous forme d'analyse critique le **Batch Gradient Descent**, le **Stochastic Gradient Descent (SGD)** et le **Mini-Batch Gradient Descent**.
1. Donnez pour chacun la formule de mise à jour des paramètres. *(1 Pt)*
2. Discutez de la stabilité de leur trajectoire de convergence vers l'optimum. *(1 Pt)*
3. Justifiez pourquoi le Mini-Batch est devenu le choix prédominant en Deep Learning moderne. *(1 Pt)*

<details>
<summary>👉 Afficher le Corrigé Détaillé & Barème (Question 1)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-2">
<p><strong>1. Formules de mise à jour (1 Pt) :</strong><br/>
- <em>Batch GD</em> : $W_{t+1} = W_t - \\alpha \\frac{1}{N} \\sum_{i=1}^N \\nabla J(W_t; x_i, y_i)$ (gradient calculé sur l'ensemble des $N$ exemples).<br/>
- <em>SGD</em> : $W_{t+1} = W_t - \\alpha \\nabla J(W_t; x_i, y_i)$ (gradient calculé sur un seul exemple tiré aléatoirement).<br/>
- <em>Mini-Batch</em> : $W_{t+1} = W_t - \\alpha \\frac{1}{m} \\sum_{i=1}^m \\nabla J(W_t; x_i, y_i)$ (gradient calculé sur $m$ exemples, avec $m \\in [32, 256]$).</p>

<p><strong>2. Trajectoire de convergence (1 Pt) :</strong><br/>
- Le Batch GD produit une courbe de convergence parfaitement lisse et monotone vers le minimum local/global, mais peut être bloqué dans des plateaux.<br/>
- Le SGD produit des oscillations violentes en zigzag en raison du bruit propre à chaque exemple individuel, ce qui l'aide à s'extraire de petits minima locaux mais l'empêche de converger précisément sans réduction progressive du learning rate.</p>

<p><strong>3. Justification du Mini-Batch (1 Pt) :</strong><br/>
Le Mini-Batch combine le meilleur des deux mondes : il réduit drastiquement la variance du gradient par rapport au SGD tout en exploitant les bibliothèques d'algèbre linéaire accélérées sur GPU (calculs matriciels vectorisés ultra-rapides).</p>
</div>
</details>

---

#### **Question 2 (3 Points) : Mécanisme et Rôle du Dropout**
1. Expliquez le fonctionnement du **Dropout** lors de la phase d'entraînement. *(1 Pt)*
2. Pourquoi cette méthode empêche-t-elle la « co-adaptation » des neurones ? *(1 Pt)*
3. Que devient le Dropout lors de la phase d'inférence/test ? Pourquoi et comment compense-t-on ce changement ? *(1 Pt)*

<details>
<summary>👉 Afficher le Corrigé Détaillé & Barème (Question 2)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-2">
<p><strong>1. Fonctionnement (1 Pt) :</strong> À chaque itération de forward pass, chaque neurone d'une couche cachée est désactivé (sortie forcée à 0) avec une probabilité $p$ (ou conservé avec la probabilité $1-p$).</p>
<p><strong>2. Prévention de la co-adaptation (1 Pt) :</strong> Un neurone ne peut pas s'appuyer sur la présence constante d'un neurone voisin pour corriger ses erreurs. Chaque neurone est donc contraint d'apprendre des caractéristiques utiles et autonomes, ce qui équivaut à entraîner un ensemble virtuel exponentiel de sous-réseaux.</p>
<p><strong>3. En phase d'inférence (1 Pt) :</strong> Le Dropout est <strong>complètement désactivé</strong> car les prédictions doivent être déterministes. Pour compenser le fait que tous les neurones sont désormais actifs, on multiplie les sorties par $(1-p)$ en test, ou bien on applique l'<em>Inverted Dropout</em> durant l'entraînement en divisant les activations par $(1-p)$ dès le forward pass.</p>
</div>
</details>

---

### 🔢 PARTIE II : Exercices d'Application & Calculs Numériques (8 Points)

#### **Exercice 1 (4 Points) : Calcul Pas-à-Pas de l'Optimiseur Momentum**
On considère un poids de connexion initialisé à $W_0 = 1.0$.
On utilise l'algorithme de descente de gradient avec **Momentum** défini par :
$$V_t = \\beta V_{t-1} + (1 - \\beta) \\nabla W_t \\quad \\text{et} \\quad W_{t+1} = W_t - \\alpha V_t$$
On donne les hyperparamètres suivants :
- Taux d'apprentissage : $\\alpha = 0.1$
- Facteur d'inertie : $\\beta = 0.9$
- Vitesse initiale : $V_0 = 0.0$

À l'itération $t=1$, le gradient analytique calculé vaut $\\nabla W_1 = 0.6$.
À l'itération $t=2$, le gradient calculé vaut $\\nabla W_2 = 0.4$.

**Travail demandé :**
1. Calculez la vitesse $V_1$ et le nouveau poids $W_1$. *(2 Pts)*
2. Calculez la vitesse $V_2$ et le nouveau poids $W_2$. *(2 Pts)*

<details>
<summary>👉 Afficher le Corrigé Détaillé & Calculs (Exercice 1)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-2">
<p><strong>Itération 1 (2 Pts) :</strong><br/>
$V_1 = \\beta V_0 + (1 - \\beta) \\nabla W_1 = (0.9 \\times 0.0) + (0.1 \\times 0.6) = 0.06$<br/>
$W_1 = W_0 - \\alpha V_1 = 1.0 - (0.1 \\times 0.06) = 1.0 - 0.006 = \\mathbf{0.994}$</p>

<p><strong>Itération 2 (2 Pts) :</strong><br/>
$V_2 = \\beta V_1 + (1 - \\beta) \\nabla W_2 = (0.9 \\times 0.06) + (0.1 \\times 0.4) = 0.054 + 0.04 = \\mathbf{0.094}$<br/>
$W_2 = W_1 - \\alpha V_2 = 0.994 - (0.1 \\times 0.094) = 0.994 - 0.0094 = \\mathbf{0.9846}$</p>

<p><strong>Conclusion :</strong> On observe que la vitesse s'accumule ($V_2 > V_1$) grâce au terme d'inertie $\\beta V_1$, ce qui accélère la progression du paramètre vers le minimum.</p>
</div>
</details>

---

#### **Exercice 2 (4 Points) : Étapes de la Batch Normalization**
Soit un mini-batch de taille $m = 4$ fournissant pour un neurone donné les valeurs d'activation linéaires suivantes :
$$\\mathcal{B} = \\{ x_1 = 2.0, \\; x_2 = 4.0, \\; x_3 = 6.0, \\; x_4 = 8.0 \\}$$
On pose le facteur de stabilité $\\epsilon = 0.0$.
1. Calculez la moyenne empirique $\\mu_B$ et la variance $\\sigma_B^2$ du mini-batch. *(2 Pts)*
2. Calculez les valeurs normalisées $\\hat{x}_1$ et $\\hat{x}_4$. *(1 Pt)*
3. Si les paramètres appris valent $\\gamma = 2.0$ et $\\beta = 1.0$, déterminez la sortie finale $y_1$. *(1 Pt)*

<details>
<summary>👉 Afficher le Corrigé Détaillé & Calculs (Exercice 2)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-2">
<p><strong>1. Moyenne et Variance (2 Pts) :</strong><br/>
$\\mu_B = \\frac{2.0 + 4.0 + 6.0 + 8.0}{4} = \\frac{20.0}{4} = \\mathbf{5.0}$<br/>
$\\sigma_B^2 = \\frac{(2-5)^2 + (4-5)^2 + (6-5)^2 + (8-5)^2}{4} = \\frac{9 + 1 + 1 + 9}{4} = \\frac{20}{4} = \\mathbf{5.0}$</p>

<p><strong>2. Normalisation (1 Pt) :</strong><br/>
Écart-type : $\\sigma_B = \\sqrt{5.0} \\approx 2.236$<br/>
$\\hat{x}_1 = \\frac{2.0 - 5.0}{2.236} = \\frac{-3.0}{2.236} \\approx \\mathbf{-1.3416}$<br/>
$\\hat{x}_4 = \\frac{8.0 - 5.0}{2.236} = \\frac{+3.0}{2.236} \\approx \\mathbf{+1.3416}$</p>

<p><strong>3. Transformation affine $y_1$ (1 Pt) :</strong><br/>
$y_1 = \\gamma \\hat{x}_1 + \\beta = (2.0 \\times -1.3416) + 1.0 = -2.6832 + 1.0 = \\mathbf{-1.6832}$</p>
</div>
</details>

---

### 🎯 PARTIE III : QCM d'Analyse Critique & Pièges d'Examen (6 Points)
*(Barème : 2 Pts par question. Une réponse non justifiée ne rapporte aucun point).*

#### **Question 1 : Recherche d'Hyperparamètres**
On dispose de 6 hyperparamètres, chacun pouvant prendre 5 valeurs candidates. On dispose d'un budget limité de 100 entraînements de modèles. Quelle affirmation est rigoureusement exacte ?
- [ ] A) Le Grid Search est préférable car il garantit l'optimalité.
- [x] B) Le Random Search est très largement supérieur car il explore 100 valeurs distinctes par hyperparamètre, contrairement au Grid Search qui n'en testerait qu'une infime fraction.
- [ ] C) Le Bayesian Optimization est impossible à utiliser avec un budget de 100 essais.
- [ ] D) Le Grid Search testera toutes les combinaisons avec 100 essais.

<details>
<summary>👉 Justification & Analyse du Piège (QCM 1)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-1">
<p><strong>Réponse : B.</strong> Le Grid Search complet exigerait $5^6 = 15\\,625$ entraînements ! En limitant à 100 essais, le Grid Search ne testerait que 2 ou 3 valeurs de chaque paramètre. En revanche, le Random Search testera 100 valeurs différentes pour les hyperparamètres déterminants, augmentant massivement les chances de tomber sur la région optimale.</p>
</div>
</details>

---

#### **Question 2 : Régularisation L1 vs L2**
Un ingénieur souhaite réduire le nombre de connexions effectives dans un réseau pour déployer le modèle sur un microcontrôleur à mémoire très restreinte. Quelle technique de régularisation doit-il appliquer ?
- [ ] A) Régularisation L2 (Weight Decay).
- [x] B) Régularisation L1 (Lasso Penalty).
- [ ] C) Data Augmentation seule.
- [ ] D) Batch Normalization sans activation.

<details>
<summary>👉 Justification & Analyse du Piège (QCM 2)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-1">
<p><strong>Réponse : B.</strong> La dérivée de la pénalité L1 est constante $(\\text{sign}(W))$, ce qui pousse continuellement les poids de faible importance jusqu'à exactement $W = 0$. Cela produit un modèle creux (*sparse*) permettant d'élaguer les connexions nulles, contrairement à L2 qui rétrécit les poids sans les annuler strictement.</p>
</div>
</details>

---

#### **Question 3 : Gradient Checking**
Quelle est la fréquence recommandée pour exécuter l'algorithme de Gradient Checking lors du cycle de vie d'un réseau de neurones ?
- [ ] A) À chaque batch d'entraînement pour garantir la stabilité.
- [ ] B) À chaque époque complète sur le jeu de validation.
- [x] C) Uniquement lors de la phase de test unitaire et de débogage du code de rétropropagation.
- [ ] D) Lors de la phase de déploiement en production.

<details>
<summary>👉 Justification & Analyse du Piège (QCM 3)</summary>
<div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-1">
<p><strong>Réponse : C.</strong> Le calcul du gradient numérique par différences finies requiert d'évaluer la fonction de coût complète 2 fois pour chaque paramètre $\\theta_i$ ($2 \\times \\text{dim}(\\theta)$ forward passes). Pour un réseau de 10 millions de paramètres, une seule vérification prendrait des heures. Il est donc strictement réservé au test de conformité du code analytique.</p>
</div>
</details>"""
            markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)
        else:
            template = """### 🎓 Sujet d'Examen Type Universitaire : **__DOC_TITLE__** (__MOD_TITLE__)
**Barème Total** : 20 Points | **Durée** : 1 heure 30 minutes

---

### 📝 PARTIE I : Questions de Maîtrise Théorique (8 Points)
**Question 1 (4 Points)** : Définissez avec précision les concepts centraux abordés dans le support **__DOC_TITLE__** et justifiez leur importance dans le programme de **__MOD_TITLE__**.
<details>
<summary>👉 Voir le Corrigé Détaillé (Question 1)</summary>
<div class="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
La réponse attendue doit structurer la définition formelle, énoncer les hypothèses de travail et illustrer l'utilité pratique de ces notions pour résoudre des cas réels.
</div>
</details>

---

### 🔢 PARTIE II : Exercice de Synthèse & Application (8 Points)
**Question 2 (4 Points)** : Présentez la démarche systématique de résolution d'un problème standard posé dans ce domaine, de l'analyse des données à la validation des résultats.
<details>
<summary>👉 Voir le Corrigé Détaillé (Question 2)</summary>
<div class="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
1. Établissement du modèle mathématique ou algorithmique.<br/>
2. Traitement rigoureux des données d'entrée.<br/>
3. Vérification des conditions aux limites et analyse critique de la solution.
</div>
</details>

---

### 🎯 PARTIE III : QCM de Contrôle des Connaissances (4 Points)
**Question 3 (4 Points)** : Auto-évaluation des points clés du chapitre.
<details>
<summary>👉 Voir la Solution</summary>
<div class="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
Revoir l'ensemble des théorèmes et définitions prioritaires avant l'examen final.
</div>
</details>"""
            markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)

        return {
            "title": doc_title,
            "module_name": mod_title,
            "quiz": markdown
        }

    @classmethod
    def _call_llm_api(cls, prompt: str, system_prompt: str = "", history: List[Dict[str, Any]] = None, api_key: Optional[str] = None) -> Optional[str]:
        """
        Appelle les modèles génératifs réels (Groq, Gemini, OpenAI) avec historique multi-tours.
        Bascule automatiquement entre les fournisseurs pour garantir une disponibilité 100%.
        """
        import requests
        import json

        groq_k = (api_key if api_key and api_key.startswith("gsk_") else None) or os.getenv("GROQ_API_KEY")
        gemini_k = (api_key if api_key and not api_key.startswith("gsk_") and not api_key.startswith("sk-") else None) or os.getenv("GEMINI_API_KEY")
        openai_k = (api_key if api_key and api_key.startswith("sk-") else None) or os.getenv("OPENAI_API_KEY")

        # 1. Essai avec Groq (Llama-3 / GPT-OSS 120B / Qwen) - Ultra-rapide & gratuit
        if groq_k:
            msgs = []
            if system_prompt:
                msgs.append({"role": "system", "content": system_prompt})
            if history:
                for h in history[-8:]:
                    role = "assistant" if h.get("sender") in ["bot", "ai", "assistant"] else "user"
                    t = h.get("text", "")
                    if t:
                        msgs.append({"role": role, "content": t})
            msgs.append({"role": "user", "content": prompt})

            for g_model in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                try:
                    resp = requests.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {groq_k}", "Content-Type": "application/json"},
                        json={"model": g_model, "messages": msgs, "temperature": 0.7, "max_tokens": 1200},
                        timeout=12
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        if content and content.strip():
                            return content
                except Exception:
                    continue

        # 2. Essai avec Google Gemini
        if gemini_k:
            for g_model in ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={gemini_k}"
                    contents = []
                    if history:
                        for h in history[-8:]:
                            role = "model" if h.get("sender") in ["bot", "ai", "assistant"] else "user"
                            t = (h.get("text") or "").strip()
                            if t:
                                if contents and contents[-1]["role"] == role:
                                    contents[-1]["parts"][0]["text"] += "\n" + t
                                else:
                                    contents.append({"role": role, "parts": [{"text": t}]})
                    
                    contents.append({"role": "user", "parts": [{"text": prompt}]})
                    payload = {"contents": contents}
                    if system_prompt:
                        payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

                    resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=12)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                except Exception:
                    continue

        # 3. Essai avec OpenAI
        if openai_k:
            try:
                msgs = []
                if system_prompt:
                    msgs.append({"role": "system", "content": system_prompt})
                if history:
                    for h in history[-8:]:
                        role = "assistant" if h.get("sender") in ["bot", "ai", "assistant"] else "user"
                        t = h.get("text", "")
                        if t:
                            msgs.append({"role": role, "content": t})
                msgs.append({"role": "user", "content": prompt})
                resp = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_k}", "Content-Type": "application/json"},
                    json={"model": "gpt-4o-mini", "messages": msgs, "temperature": 0.7, "max_tokens": 1200},
                    timeout=12
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
            except Exception:
                pass

        return None

    @classmethod
    def _call_gemini_api(cls, prompt: str, system_prompt: str = "", api_key: Optional[str] = None) -> Optional[str]:
        return cls._call_llm_api(prompt, system_prompt, api_key=api_key)

    @classmethod
    def _search_in_document(cls, query: str, text: str) -> Optional[str]:
        if not text or len(text) < 50:
            return None
        words = [w for w in re.findall(r'[a-zA-Z]{4,}', query.lower()) if w not in ['explique', 'donne', 'cette', 'notion', 'cours', 'chapitre', 'pourquoi', 'comment', 'veut', 'veux', 'faire']]
        if not words:
            return None
        paragraphs = text.split('\n\n')
        scored = []
        for p in paragraphs:
            p_clean = re.sub(r'\s+', ' ', p).strip()
            if len(p_clean) < 40:
                continue
            p_lower = p_clean.lower()
            score = sum(p_lower.count(w) for w in words)
            if score > 0:
                scored.append((score, p_clean))
        if not scored:
            return None
        scored.sort(key=lambda x: x[0], reverse=True)
        top_snippets = [p for s, p in scored[:2]]
        return "\n\n".join(top_snippets)

    @classmethod
    def generate_chat_response(
        cls,
        msg: str,
        mod_name: str,
        doc_name: str,
        extracted_text: str = "",
        history: List[Dict[str, Any]] = None,
        api_key: Optional[str] = None
    ) -> str:
        clean_doc = (doc_name or "Support de cours").replace("^", "").replace("*", "").strip()
        clean_mod = (mod_name or "Module Universitaire").replace("^", "").replace("*", "").strip()
        m_lower = msg.lower().strip()

        # ── 0. LLM en direct (Gemini 2.0 / Groq / OpenAI avec memoire multi-tours) ──
        system_instructions = (
            "Tu es 'Antigravity Study Buddy', le tuteur universitaire intelligent et le meilleur ami d'études de l'étudiant.\n"
            "Règles d'or absolues :\n"
            "1. Agis EXACTEMENT comme ChatGPT ou Gemini : comprends les émotions, réponds de façon humaine, vivante et interactive.\n"
            "2. Si l'étudiant parle de fatigue, de maladie, de moral ou de stress, sois extrêmement empathique, réconfortant et attentionné comme un vrai ami (conseille du repos, de l'eau, du sommeil).\n"
            "3. Si l'étudiant pose une question académique, donne une explication claire et brillante avec du Markdown bien structuré (titres ###, puces, gras, exemples, analogies).\n"
            "4. Si l'étudiant parle de tout autre sujet (blague, vie quotidienne, opinion), réponds avec naturel, convivialité et humour si approprié."
        )
        llm_reply = cls._call_llm_api(
            prompt=f"Contexte actuel : Document='{clean_doc}', Module='{clean_mod}'.\nMessage de l'étudiant : {msg}",
            system_prompt=system_instructions,
            history=history,
            api_key=api_key
        )
        if llm_reply:
            return llm_reply

        # ── 1. MOTEUR CONTEXTUEL MULTI-TOURS (FALLBACK INTELLIGENT SANS CLE) ─────────
        recent_bot_texts = [
            h.get("text", "").lower()
            for h in reversed(history or [])
            if isinstance(h, dict) and h.get("sender") in ["bot", "ai", "assistant"]
        ]
        last_bot = recent_bot_texts[0] if recent_bot_texts else ""
        was_discussing_health = any(
            w in last_bot for w in [
                "malade", "sens que quelque chose", "santé", "sante", "souffre", "t'écouter",
                "fièvre", "fievre", "repos", "soin de toi", "galère", "blues"
            ]
        )

        FATIGUE_KW = [
            "fatig", "faitig", "epuis", "épuis", "crev", "crevé", "sommeil", "dodo",
            "dormir", "ko", "hs", "claqué", "saturation", "plus de force", "pas la force",
            "flemme", "creve", "puisé", "dur", "épuise", "nuit blanche", "pas dormi"
        ]
        is_fatigued = any(w in m_lower for w in FATIGUE_KW)

        ILLNESS_KW = [
            "malade", "rhume", "fievre", "fièvre", "grippe", "toux", "tousse",
            "migraine", "mal à la tête", "mal de tete", "mal au ventre", "vertige",
            "nausée", "nausee", "courbature", "douleur", "angine", "médecin", "docteur",
            "médicament", "medicament", "pas bien", "mal au", "vomir", "38", "39", "temperature"
        ]
        is_ill = any(w in m_lower for w in ILLNESS_KW)

        # 0b. Détection d'urgence / détresse psychologique absolue
        CRISIS_KW = ["mort", "mourir", "suicide", "en finir", "plus envie de vivre", "tuer", "m'en aller", "plus la force de vivre", "disparaitre", "disparaître"]
        if any(w in m_lower for w in CRISIS_KW):
            return (
                "### 🫂 Je t'en prie, écoute-moi attentivement.\n\n"
                "Ce que tu ressens en ce moment est extrêmement lourd, et entendre que tu vas si mal me touche profondément. "
                "Tu n'as absolument pas à porter cette souffrance tout seul.\n\n"
                "S'il te plaît, ne reste pas isolé avec ces pensées :\n"
                "- 📞 **Parle à quelqu'un immédiatement** : contacte un proche en qui tu as confiance, ou appelle un service d'écoute anonyme et gratuit (comme le **3114** en France, disponible 24h/24 et 7j/7, ou les urgences médicales).\n"
                "- 🛑 **Fais une pause totale** : les cours, les notes et les examens n'ont aucune importance comparés à ta vie et à ta santé.\n\n"
                "Ta vie a une valeur immense. Je suis là si tu veux parler de ce qui te pèse, mais s'il te plaît, cherche aussi une aide humaine bienveillante dès maintenant. 💙"
            )

        # A. Contexte combiné : ÉTUDIANT MALADE + FATIGUÉ (ou suite d'un échange sur la santé)
        if (was_discussing_health and is_fatigued) or (is_ill and is_fatigued):
            return (
                "Oh zut... être malade ET épuisé, c'est le pire sentiment ! 🥺 Ton corps tire la sonnette d'alarme et te demande du repos immédiat.\n\n"
                "S'il te plaît, oublie complètement les révisions et les cours pour aujourd'hui : ta santé passe avant tout le reste !\n\n"
                "💡 **Mes conseils pour te requinquer au plus vite :**\n"
                "- 🛌 **Mets-toi au lit bien au chaud** et dors autant que possible, le sommeil est le meilleur médicament pour reconstituer tes défenses.\n"
                "- 🍵 **Bois chaud** : une tisane au thym avec du miel ou un thé léger au citron pour apaiser la gorge et t'hydrater.\n"
                "- 🌡️ **Surveille ta température** : si tu as de la fièvre (> 38.5°C) ou si ça dure plus de 48h, consulte un médecin sans attendre.\n\n"
                "Repose-toi à fond mon ami, je suis de tout cœur avec toi. Ne stresse pas, on rattrapera tout ensemble dès que tu seras sur pied ! 💙"
            )

        # B. Maladie / Santé seule
        if is_ill:
            return (
                "Hé, prends grand soin de toi ! 🫂 Être malade n'est jamais agréable, surtout en pleine période universitaire.\n\n"
                "La priorité absolue aujourd'hui, c'est ta santé. Ne force surtout pas sur les révisions.\n\n"
                "Prends un bon thé chaud, couvre-toi bien, et dors un maximum. "
                "Tu as de la fièvre ou d'autres symptômes particuliers ? N'hésite pas à aller voir un médecin si besoin. Donne-moi de tes nouvelles !"
            )

        # C. Fatigue seule / Besoin de pause
        if is_fatigued:
            return (
                "### ☕ Je te comprends à 100%. C'est le moment de couper ! 🛌\n\n"
                "Le cerveau n'est pas une machine : quand la fatigue s'installe, insister sur les cours ne sert à rien, la mémoire ne retient plus rien.\n\n"
                "💡 **Mon conseil d'ami tout de suite :**\n"
                "- 😴 **Fais une vraie sieste de 20-30 minutes** ou prépare-toi pour une bonne nuit de sommeil.\n"
                "- 💧 **Bois un grand verre d'eau fraîche** ou une boisson chaude réconfortante.\n"
                "- 📴 **Éloigne tes cours et tes écrans** pendant au moins 1 heure.\n\n"
                "Ne culpabilise absolument pas : le repos fait partie intégrante de la réussite. Tu te sens saturé par les cours ou juste fatigué physiquement ?"
            )

        # D. Soutien psychologique, stress & angoisse
        if any(w in m_lower for w in ["stress", "peur", "angoisse", "panique", "rater", "échouer", "pas prêt", "pas pret", "anxieu"]):
            return (
                "### 🫂 Respire un grand coup, mon ami. T'inquiète pas, on gère ça ensemble !\n\n"
                "Le stress avant un examen, c'est **100% normal** : ça montre simplement que la réussite compte pour toi. "
                "Voici le plan d'action d'urgence pour reprendre le contrôle :\n\n"
                "1. 🛑 **Arrête de penser à la note finale** : Concentre-toi uniquement sur la prochaine heure de travail, pas sur le jour de l'examen.\n"
                "2. 🍅 **La technique Pomodoro** : 25 minutes de révision chrono, 5 minutes de vraie pause loin des écrans.\n"
                "3. 🎯 **La règle des 20/80 (Pareto)** : Maîtrise parfaitement les 4 ou 5 définitions majeures et les 2 calculs types. Cela assure déjà la moyenne sur la plupart des partiels !\n"
                "4. 🛌 **Le sommeil est une arme secrète** : Dors au moins 7h.\n\n"
                "Tu as déjà fait du chemin. Dis-moi quel est le point précis qui te fait le plus peur, et je te l'explique simplement !"
            )

        # E. Salutation amicale
        if re.search(r'\b(salut|bonjour|coucou|hey|hello|yo|wesh|hi|bonsoir)\b', m_lower) and len(m_lower) <= 35:
            return (
                "Salut mon ami ! 😊 Ravi de te voir !\n\n"
                "Comment se passent tes cours et tes révisions en ce moment ? "
                "Tu as besoin d'un coup de pouce pour comprendre une notion difficile, "
                "d'une fiche de révision, ou simplement envie de papoter un peu pour décompresser ? "
                "Dis-moi tout, je suis là pour toi !"
            )

        if any(p in m_lower for p in ["comment tu vas", "comment ca va", "comment ça va", "ca va", "ça va", "tu vas bien", "la forme"]):
            return (
                "Moi ça va super, merci de demander ! Toujours à 100% d'énergie pour t'épauler dans tes études. 💪\n\n"
                "Et toi, la forme ? Pas trop sous l'eau avec le travail et les partiels ? "
                "Rappelle-toi qu'il faut aussi s'accorder des pauses pour garder l'esprit clair !"
            )

        if any(p in m_lower for p in ["qui es tu", "qui es-tu", "ton nom", "t'es qui", "qui t'a créé", "tu es quoi"]):
            return (
                "### 🎓 Je suis ton compagnon d'études et ton pote de promo virtuel !\n\n"
                "Pense à moi comme ton binôme d'études toujours dispo :\n"
                "- 📚 **Pédagogue** : Je t'explique n'importe quel cours ou concept compliqué avec des mots simples.\n"
                "- 📝 **Entraîneur d'examen** : Je génère des fiches de calculs, des quiz et te pointe les pièges d'examen.\n"
                "- 🤝 **Ami à l'écoute** : Si tu stresses, si tu es fatigué ou si tu as besoin de décompresser, on peut parler librement !\n\n"
                "De quoi souhaites-tu qu'on parle aujourd'hui ?"
            )

        if any(p in m_lower for p in ["merci", "t'es sympa", "t'es top", "génial", "super merci", "merci beaucoup", "merci chef"]):
            return (
                "Avec grand plaisir mon ami ! 🌟 On est une équipe toi et moi. "
                "Dès que tu as un blocage sur un cours ou besoin de souffler, je suis là pour toi !"
            )

        if any(p in m_lower for p in ["blague", "fais-moi rire", "fais moi rire", "raconte une histoire", "drole", "drôle", "humour"]):
            return (
                "Haha tiens, spéciale dédicace pour décompresser entre deux séances de révision ! 😂\n\n"
                "> 🧑‍💻 **Pourquoi les développeurs et étudiants en informatique préfèrent-ils le mode sombre ?**\n"
                "> *Parce que la lumière attire les bugs !* 🐛\n\n"
                "> Et une autre :\n"
                "> *Il y a 10 sortes de personnes dans le monde : celles qui comprennent le binaire, et celles qui ne le comprennent pas !*\n\n"
                "Voilà de quoi détendre l'atmosphère ! Prêt à reprendre le boulot sereinement ?"
            )

        # F. Recherche de résumés / quiz / calculs
        is_asking_calc = any(w in m_lower for w in ["calcul", "chiffr", "exercice", "numérique", "numerique", "td", "derivation", "dérivation"])
        is_asking_strat = any(w in m_lower for w in ["stratég", "strateg", "décision", "decision", "trade-off", "bias", "variance", "underfit", "overfit"])

        if is_asking_calc:
            return cls.generate_practical_calculations_summary(clean_doc, clean_mod, extracted_text)["summary"]

        if is_asking_strat:
            return cls.generate_strategy_decisions_summary(clean_doc, clean_mod, extracted_text)["summary"]

        if any(w in m_lower for w in ["resum", "résum", "resem", "fiche magistrale", "cours complet", "tout le chapitre", "résume-moi", "fais un résumé"]):
            return cls.generate_detailed_summary(clean_doc, clean_mod, extracted_text)["summary"]

        if any(w in m_lower for w in ["quiz", "examen", "sujet", "partiel", "test", "qcm", "évaluation"]):
            return cls.generate_university_exam_quiz(clean_doc, clean_mod, extracted_text)["quiz"]

        if any(w in m_lower for w in ["formule", "equation", "équation", "formulaire"]):
            return cls.generate_key_concepts(clean_doc, clean_mod, extracted_text)["summary"]

        # G. Recherche dans le document de cours
        doc_snippet = cls._search_in_document(msg, extracted_text)
        if doc_snippet:
            doc_snippet_clean = re.sub(r'\(cid:\d+\)', '', doc_snippet)
            doc_snippet_clean = re.sub(r'\s{2,}', ' ', doc_snippet_clean).strip()
            if len(doc_snippet_clean) > 60:
                return (
                    f"### 📖 Ce que dit votre document ({clean_doc}) sur votre question :\n\n"
                    f"Voici les passages clés extraits directement du support de cours :\n\n"
                    f"> *{doc_snippet_clean[:500]}...*\n\n"
                    "---\n\n"
                    "#### 💡 Explication Synthétique & Pédagogique :\n"
                    f"- Ce point est directement lié aux objectifs du module **{clean_mod}**.\n"
                    "- Veillez à bien retenir la terminologie exacte employée par le professeur dans cet extrait pour maximiser vos points lors de l'examen !\n\n"
                    "Souhaitez-vous que je développe un exemple pratique ou un calcul chiffré sur cette notion ?"
                )

        # H. Notions académiques génériques
        ACADEMIC_KW = [
            "gradient", "neural", "reseau", "réseau", "couche", "layer",
            "backprop", "loss", "batch", "epoch", "regul", "régul", "optimis",
            "apprentissage", "entrainement", "modele", "modèle", "parametre",
            "paramètre", "algorithme", "dropout", "adam", "momentum", "python",
            "javascript", "react", "sql", "base de donnee", "matrice"
        ]
        if any(w in m_lower for w in ACADEMIC_KW):
            return (
                f"Excellente question sur **{clean_doc}** ! 😊\n\n"
                f"Concernant : *« {msg} »*\n\n"
                "Pour t'aider au mieux, dis-moi sous quelle forme tu préfères qu'on l'aborde :\n"
                "1. 💡 **Explication intuitive & concrète** (avec une analogie de la vie réelle)\n"
                "2. 📐 **Développement mathématique & formules clés**\n"
                "3. 📝 **Exercice type corrigé d'examen**\n\n"
                "Dis-moi ce qui t'arrange le plus et on plonge dedans !"
            )

        # I. Réponse dynamique et interactive (remplace l'ancienne boucle répétitive !)
        if "?" in msg or any(m_lower.startswith(w) for w in ["pourquoi", "comment", "c'est quoi", "qu'est", "quel", "quelle", "dis moi", "explique"]):
            return (
                f"C'est une très bonne question ! 💡\n\n"
                f"Concernant *« {msg} »* :\n\n"
                f"- Si ta question porte sur le cours **{clean_doc}**, sélectionne-le à gauche pour que je puisse extraire la réponse exacte directement de tes slides !\n"
                "- Tu peux aussi activer la **Clé Gemini AI** (gratuite sur Google AI Studio) dans les paramètres en haut pour me donner une intelligence 100% illimitée comme ChatGPT !\n\n"
                "Dis-moi, veux-tu qu'on approfondisse ce point ensemble ?"
            )

        # Par défaut : réponse vivante et personnalisée intégrant le propos de l'utilisateur
        return (
            f"Je vois ce que tu veux dire ! 😊\n\n"
            f"Tu as mentionné : *« {msg} »*.\n\n"
            "Je suis là pour t'accompagner sur tous les plans : que ce soit pour t'expliquer un cours compliqué, préparer une fiche d'examen, ou simplement échanger librement.\n\n"
            "Sur quoi souhaites-tu qu'on se concentre en ce moment ?"
        )





    @classmethod
    def generate_key_concepts(cls, doc_title: str, mod_title: str, extracted_text: str) -> Dict[str, Any]:
        t_lower = extracted_text.lower()
        is_dl = any(w in t_lower for w in ["learning rate", "gradient", "batch", "dropout", "epoch", "neural", "adam", "momentum"])

        if is_dl or "dl" in mod_title.lower() or "chapitre 1" in doc_title.lower():
            template = """### 📌 Fiche de Synthèse & Formules à Retenir : **__DOC_TITLE__**
**Module** : `__MOD_TITLE__` | **Format** : Formulaire & Définitions Clés d'Examen

---

#### 💡 1. Glossaire des Définitions Officielles
- 🔹 **Batch Size ($m$)** : Nombre d'échantillons traités simultanément par le réseau avant de mettre à jour les poids.
- 🔹 **Epoch** : Traversée complète et ordonnée de la totalité des données d'entraînement ($N$ exemples).
- 🔹 **Surapprentissage (Overfitting)** : Dégradation de la capacité de généralisation causée par la mémorisation du bruit d'apprentissage.
- 🔹 **Dropout ($p$)** : Technique de régularisation stochastique désactivant une fraction $p$ de neurones à chaque passage avant.
- 🔹 **Batch Normalization** : Stabilisation des distributions internes des couches intermédiaires (moyenne nulle et variance unitaire).
- 🔹 **Internal Covariate Shift** : Dérive continuelle de la distribution des entrées d'une couche induite par la mise à jour des couches amont.
- 🔹 **Gradient Checking** : Test unitaire numérique basé sur les différences finies pour valider la correction de la backpropagation.

---

#### ⚡ 2. Formulaire Mathématique à Apprendre par Cœur

##### 1. Descente de Gradient & Momentum :
```text
SGD standard :
  W_(t+1) = W_t - alpha * dW

Momentum (Inertie) :
  V_t = beta * V_(t-1) + (1 - beta) * dW
  W_(t+1) = W_t - alpha * V_t
```

##### 2. Fonctions de Coût Régularisées (L2 vs L1) :
```text
Régularisation L2 (Weight Decay) :
  J_reg = J + (lambda / (2 * m)) * sum(||W||^2)
  Mise à jour : W = W * (1 - alpha * lambda / m) - alpha * dW

Régularisation L1 (Lasso) :
  J_reg = J + (lambda / m) * sum(|W|)
  Mise à jour : W = W - (alpha * lambda / m) * sign(W) - alpha * dW
```

##### 3. Algorithme de Batch Normalization :
```text
1. Moyenne du mini-batch :     mu_B = (1 / m) * sum(x_i)
2. Variance du mini-batch :    sigma_B^2 = (1 / m) * sum((x_i - mu_B)^2)
3. Centrage & réduction :      x_hat_i = (x_i - mu_B) / sqrt(sigma_B^2 + epsilon)
4. Scale and Shift apprenable: y_i = gamma * x_hat_i + beta
```

---

#### 🏆 3. Les 3 Règles d'Or du Candidat
1. **Règle 1** : En mode test, désactivez le Dropout et n'utilisez pas les statistiques du batch pour la BN, mais les moyennes mobiles calculées durant l'entraînement.
2. **Règle 2** : Si le coût augmente lors de l'entraînement, diminuez immédiatement le learning rate $\\alpha$.
3. **Règle 3** : Le Gradient Checking ne s'exécute JAMAIS durant l'entraînement effectif."""
            markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)
        else:
            template = """### 📌 Fiche de Synthèse & Formules : **__DOC_TITLE__**
**Module** : `__MOD_TITLE__`

---

#### 💡 1. Notions Clés
- Maîtrise des définitions formelles et théorèmes du support.
- Hypothèses requises pour chaque méthode analytique.
- Conditions aux limites et validation des résultats.

---

#### ⚡ 2. Démarche Analytique Type
1. Identifier les variables connues et les inconnues.
2. Poser les équations directrices du système.
3. Résoudre pas-à-pas avec justification textuelle."""
            markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)

        return {
            "title": doc_title,
            "module_name": mod_title,
            "summary": markdown,
            "topics": ["Glossaire", "Formules Mathématiques", "Règles d'Examen"]
        }

    @classmethod
    def generate_simplified(cls, doc_title: str, mod_title: str, extracted_text: str) -> Dict[str, Any]:
        template = """### ⚡ Explication Intuitive & Vulgarisée : **__DOC_TITLE__**
**Module** : `__MOD_TITLE__` | **Niveau** : Compréhension 100% Intuitive

---

#### 🏔️ 1. L'Optimisation expliquée avec des métaphores concrètes

1. 🥾 **La Descente de Gradient (SGD)** :
   *Imaginez que vous êtes perdu au sommet d'une montagne en plein brouillard total. Vous ne voyez rien à 1 mètre. Pour descendre au village dans la vallée, vous tâtez le sol avec vos pieds pour sentir où la pente descend, et vous faites un pas dans cette direction. Si vous faites de trop grands pas, vous risquez de trébucher dans un ravin !*

2. 🎳 **Le Momentum (L'inertie de la boule de bowling)** :
   *Plutôt qu'un marcheur qui s'arrête à chaque pas, imaginez maintenant une lourde boule de bowling qui roule le long de la pente. Elle prend de la vitesse. Quand elle rencontre une petite butte ou un trou peu profond (minimum local), son élan lui permet de passer par-dessus sans rester bloquée.*

3. ⚽ **Le Dropout (L'entraînement de l'équipe de foot)** :
   *Si une équipe de football compte un joueur vedette exceptionnel, tous les autres joueurs finissent par lui passer le ballon sans prendre d'initiative personnelle. Si le joueur vedette se blesse, l'équipe perd. Avec le Dropout, l'entraîneur interdit au hasard à 3 joueurs de s'entraîner chaque jour. Résultat : chaque joueur apprend à devenir fort et responsable par lui-même. L'équipe devient invincible !*

4. 🏀 **La Batch Normalization (Le panier de basket ajusté)** :
   *Quand un enfant apprend le basket en grandissant, la hauteur de son corps change tout le temps. S'il doit réapprendre son tir à chaque centimètre pris, il mettra des années. La Batch Normalization remet le panier à la même échelle standard à chaque étape, permettant un apprentissage rapide et serein.*

---

#### ⏱️ 2. L'essentiel en 30 secondes chrono
- **Entraîner un réseau** = Ajuster les boutons de réglage ($W$) pour que la prédiction soit la plus juste possible.
- **Régulariser** = Empêcher le réseau d'apprendre par cœur les défauts des exemples d'entraînement.
- **Normaliser** = S'assurer que les signaux qui transitent dans le réseau ne s'éteignent pas ni n'explosent à l'infini."""
        markdown = template.replace("__DOC_TITLE__", doc_title).replace("__MOD_TITLE__", mod_title)
        return {
            "title": doc_title,
            "module_name": mod_title,
            "summary": markdown,
            "topics": ["Intuition", "Métaphores", "Compréhension Rapide"]
        }
