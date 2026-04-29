# Contexte NewNexus
Auteur du suivi: Codex
Derniere mise a jour: 2026-04-29

## Objet du chantier

Creation de `NewNexus` comme nouveau produit distinct de `Nexus`, avec:

- nouvelle base PostgreSQL
- nouvelle ergonomie plus premium, moderne et audacieuse
- socle securite / droits reconcu
- reutilisation selective des integrations et des regles metier utiles de Nexus

## Decisions structurantes deja prises

- `NewNexus` n'est pas un portage direct de `Locatif.Api`
- la gestion des droits V1 se fait par module avec 3 niveaux: `Aucun`, `Lecture`, `Ecriture`
- les droits sont portes par les profils
- un compte utilisateur est rattache a un seul profil
- la navigation V1 comporte 3 entrees: `Administration`, `Exploitation`, `Gestion administrative`
- l'ordre alphabetique est obligatoire dans les menus et sous-menus
- un tableau de bord adapte au profil utilisateur fait partie du perimetre V1

## Perimetre V1 retenu

### Socle

- structure de base
- parametres systeme
- securite
- gestion des droits
- outils d'administration utiles

### Transverse

- interfaces
- salaries
- materiels
- tiers
- societes
- analytiques
- exploitations

### Fonctionnel lot 1

- indicateurs conducteurs
- gestion des contraventions
- carte des points chargements/dechargements
- indicateurs des tracteurs

## Navigation V1

### Entrees principales

1. `Administration`
2. `Exploitation`
3. `Gestion administrative`

### Modules rattaches

#### Exploitation

1. `Carte des points chargements/dechargements`
2. `Les indicateurs conducteurs`
3. `Les indicateurs des tracteurs`

#### Gestion administrative

1. `Gestion des contraventions`

## Profils V1 retenus

- `Informatique`
- `Direction`
- `Exploitation`
- `Administratif`

## Versionnement et montee de version

### Regle generale

`NewNexus` doit suivre un versionnement applicatif explicite et trace dans le contexte.

Format retenu a ce stade:

- `MAJEUR.MINEUR.CORRECTIF`

Interpretation:

- `MAJEUR`: rupture structurelle, evolution d'architecture ou lot majeur changeant fortement le produit
- `MINEUR`: ajout fonctionnel significatif, nouveau module, nouvelle integration, evolution transverse importante
- `CORRECTIF`: correction, ajustement, stabilisation sans extension forte de perimetre

### Modalites de montee de version

- passage de `0.1.0` pour le demarrage du socle NewNexus
- incrementation `MINEUR` pour chaque lot fonctionnel ou transverse notable livre
- incrementation `CORRECTIF` pour chaque vague de stabilisation ou correctifs internes entre deux lots
- le contexte doit toujours mentionner la version cible ou la version atteinte lors des etapes importantes

### Regle de tracabilite

A chaque jalon important, renseigner dans ce fichier:

- la date
- la version cible ou atteinte
- les lots concernes
- les artefacts techniques crees ou modifies
- l'etat de build / scaffold / migration si applicable

## Strategie de branches

### Principe

Le code doit etre organise autour:

- d'une branche `socle`
- d'une branche `transverse`
- d'une branche par module metier

### Modele recommande

- `socle`
- `transverse`
- `module-contraventions`
- `module-carte-chargement-dechargement`
- `module-indicateurs-conducteurs`
- `module-indicateurs-tracteurs`

### Regle d'usage

- `socle` porte l'infrastructure commune, securite, auth, navigation de base, conventions et outillage minimal
- `transverse` porte societes, analytiques, exploitations, salaries, tiers, materiels, interfaces
- chaque branche `module-*` porte le developpement isole d'un module fonctionnel
- les modules se rebasent ou fusionnent depuis `socle` puis `transverse` selon besoin

### Regle de progression

Ordre cible de construction:

1. `socle`
2. `transverse`
3. branches `module-*`

## Journal de session

## 2026-04-29 - Initialisation du cadrage NewNexus

- creation du repertoire `C:\dev\NewNexus`
- creation des dossiers de travail: `contexte`, `docs`, `decisions`, `backlog`, `NewNexus.Api`, `NewNexus.Web`, `NewNexus.Domain`, `NewNexus.Data.Postgres`, `NewNexus.Integrations`
- redaction des documents de cadrage suivants dans `docs/`:
  - cadrage initial
  - modele de droits V1
  - schema transverse V1
  - matrice des modules V1
  - profils V1
  - premier schema PostgreSQL V1
  - cadrage UX V1
  - wireframes V1
- ajout dans le perimetre du tableau de bord adapte au profil utilisateur
- decision de demarrer le chantier par documentation structurante avant scaffold technique

## 2026-04-29 - Mise en place du pilotage vivant

- creation du present contexte de session
- creation d'un backlog detaille avec statut par fonctionnalite
- formalisation des modalites de montee de version
- formalisation de la strategie de branches `socle`, `transverse`, `module-*`
- prochaine etape: scaffold technique de la solution `NewNexus`

## 2026-04-29 - Scaffold technique initial

- initialisation du depot Git `NewNexus` sur la branche `socle`
- creation de la solution `.NET` `NewNexus.slnx`
- creation des projets:
  - `NewNexus.Api`
  - `NewNexus.Domain`
  - `NewNexus.Data.Postgres`
  - `NewNexus.Integrations`
  - `NewNexus.Web`
- creation d'un `.gitignore` racine
- raccordement des projets .NET a la solution `.slnx`
- installation des dependances frontend Vite/React
- build backend OK: `dotnet build NewNexus.slnx`
- build frontend OK: `npm run build`
- version de depart retenue pour le socle: `0.1.0`
- prochaine etape: remplacer les squelettes generiques par la structure socle NewNexus et brancher PostgreSQL / EF Core

## 2026-04-29 - Initialisation Git du chantier

- commit initial cree sur `socle`: `dd64997`
- branches creees:
  - `socle`
  - `transverse`
  - `module-contraventions`
  - `module-carte-chargement-dechargement`
  - `module-indicateurs-conducteurs`
  - `module-indicateurs-tracteurs`
- depot de depart propre pour lancer maintenant la vraie implementation du socle applicatif
