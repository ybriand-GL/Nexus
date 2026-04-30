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
- l'application doit etre exploitable sous le chemin virtuel `/newNexus`
- les URLs cibles d'acces sont `http://192.168.60.158/newNexus` et `http://192.168.50.102/newNexus`
- l'application doit etre publiee sous le chemin virtuel `/newNexus`
- les URLs cibles d'acces sont `http://192.168.60.158/newNexus` et `http://192.168.50.102/newNexus`

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

## 2026-04-29 - Premier socle applicatif compatible `/newNexus`

- remplacement du scaffold generique `webapi` dans `NewNexus.Api` par un premier socle HTTP minimal
- prise en charge du `PathBase` applicatif via `App:BasePath=/newNexus`
- preparation de l'acces cible via:
  - `http://192.168.60.158/newNexus`
  - `http://192.168.50.102/newNexus`
- ajout d'une configuration `CORS` de base pour les hotes cibles et locaux
- mise en place des premiers endpoints socle:
  - `GET /`
  - `GET /api/system/info`
  - `GET /api/health`
- remplacement du frontend Vite de demonstration par une premiere coque `NewNexus.Web`
- configuration du frontend avec `base: /newNexus/`
- creation d'une premiere interface premium de cadrage:
  - navigation laterale
  - hero d'accueil
  - cartes d'entree `Administration`, `Exploitation`, `Gestion administrative`
- references projets ajoutees dans `NewNexus.Api.csproj` vers `Domain`, `Data.Postgres` et `Integrations`
- build backend OK: `dotnet build C:\dev\NewNexus\NewNexus.slnx --verbosity minimal`
- build frontend OK: `npm run build`
- prochaine etape:
  - brancher EF Core PostgreSQL
  - creer les premieres entites securite
  - preparer la premiere migration

## 2026-04-29 - Premier socle PostgreSQL securite

- ajout du package `Npgsql.EntityFrameworkCore.PostgreSQL` dans `NewNexus.Data.Postgres`
- ajout du package `Microsoft.EntityFrameworkCore.Design` dans `NewNexus.Api`
- creation des premieres entites domaine de securite:
  - `SecurityModule`
  - `SecurityProfile`
  - `SecurityProfileModuleRight`
  - `UserAccount`
- creation du `NewNexusDbContext`
- ajout du raccordement DI `AddNewNexusPostgres(...)`
- ajout d'une premiere `ConnectionString` de travail dans la configuration API
- suppression de la redirection HTTPS forcee pour rester compatible avec les URLs cibles en `http://.../newNexus`
- generation de la premiere migration EF Core:
  - `20260429144811_InitialSecuritySocle`
- perimetre technique couvert par cette migration:
  - schema PostgreSQL `security`
  - tables `SecurityModule`, `SecurityProfile`, `SecurityProfileModuleRight`, `UserAccount`
  - graines initiales des modules V1
  - graines initiales des profils V1
  - graines initiales des droits par profil / module
- compilation solution OK apres branchement PostgreSQL:
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx --verbosity minimal`
- verification environnement:
  - service local detecte: `postgresql-x64-18` en etat `Running`
  - client `psql` non detecte dans le `PATH`
- prochaine etape:
  - verifier la strategie d'initialisation de la base `NewNexus`
  - appliquer la migration sur l'instance PostgreSQL locale
  - lancer ensuite l'authentification ou le transverse de base

## 2026-04-29 - Initialisation reelle de la base PostgreSQL

- test d'acces PostgreSQL effectue avec le couple fourni `admin / legri00`: echec d'authentification
- test de repli effectue avec `postgres / legri00`: succes
- mise a jour de la `ConnectionString` de travail pour utiliser `postgres / legri00`
- creation de la base locale `NewNexus`
- application de la migration EF Core sur la base locale:
  - `dotnet ef database update --project C:\dev\NewNexus\NewNexus.Data.Postgres\NewNexus.Data.Postgres.csproj --startup-project C:\dev\NewNexus\NewNexus.Api\NewNexus.Api.csproj`
- verification base effectuee via `information_schema`
- objets confirms apres initialisation:
  - `infra.__EFMigrationsHistory`
  - `security.SecurityModule`
  - `security.SecurityProfile`
  - `security.SecurityProfileModuleRight`
  - `security.UserAccount`
- le socle `NewNexus` dispose maintenant d'une base PostgreSQL locale initialisee et migree
- prochaine etape:
  - demarrer l'authentification applicative
  - exposer les premiers endpoints de lecture des modules / profils / comptes
  - ou ouvrir le chantier transverse selon priorite

## 2026-04-29 - Identite visuelle Nexus et premiers endpoints securite

- prise en compte du dossier `C:\Dev\NewNexus\identité visuelle`
- direction retenue confirmee et appliquee:
  - `Concept 4C`
  - palette Nexus
  - typographies `Sora` et `Inter`
- import des assets de marque dans `NewNexus.Web/public`:
  - `nexus-app-icon.svg`
  - `nexus-wordmark-simplified.svg`
  - `favicon.ico`
  - `nexus-icon-192.png`
  - `nexus-icon-512.png`
- mise a jour du shell frontend pour adopter:
  - sidebar navy
  - cartes blanches premium
  - accents Nexus
  - meta / favicon NewNexus
- remplacement du shell statique par un dashboard socle branche sur l'API
- ajout des premiers endpoints de lecture securite dans `NewNexus.Api`:
  - `GET /api/security/modules`
  - `GET /api/security/profiles`
  - `GET /api/security/bootstrap`
- l'ecran d'accueil lit maintenant:
  - les informations systeme
  - les modules V1
  - les profils V1
  - les droits semes dans PostgreSQL
- validation technique:
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx --verbosity minimal` OK
  - `npm run build` OK
- prochaine etape:
  - ajouter une authentification applicative reelle
  - exposer les comptes utilisateurs
  - commencer l'administration securite

## 2026-04-29 - Publication IIS NewNexus et premier endpoint comptes

- creation du script de publication IIS:
  - `C:\dev\NewNexus\scripts\publish_newnexus_iis.ps1`
- le script:
  - build le frontend
  - recopie le `dist` dans `NewNexus.Api\wwwroot`
  - publie l'API dans `C:\inetpub\newnexus`
  - maintient l'application IIS `Localaure/newNexus`
  - utilise `app_offline.htm` pour une publication sans verrou DLL
- publication IIS reelle effectuee sous:
  - `http://192.168.60.158/newNexus`
  - `http://192.168.50.102/newNexus`
- verification HTTP OK sur les 2 URLs cibles
- verification API publiee OK:
  - `GET /newNexus/api/system/info`
  - `GET /newNexus/api/security/bootstrap`
  - `GET /newNexus/api/security/accounts`
- ajout d'un premier endpoint de lecture des comptes:
  - `GET /api/security/accounts`
- point d'exploitation important:
  - le site parent `Localaure` possedait une regle SPA qui reecrivait tout sauf `/backend`
  - ajout de l'exclusion `^/newNexus(/|$)` dans `C:\inetpub\locatif\web.config`
  - sans cette exclusion, l'API `NewNexus` etait detournee vers `index.html`
- prochaine etape:
  - demarrer le vrai lot d'authentification
  - definir le compte courant et la logique de connexion
  - poursuivre l'administration securite

## 2026-04-29 - Lot authentification initial

- ajout d'un hashage de mot de passe local PBKDF2 dans `NewNexus.Domain\Security\PasswordHasher.cs`
- extension du modele `UserAccount` avec:
  - `PasswordHash`
  - `MustChangePassword`
  - `LastLoginAtUtc`
- ajout d'un compte bootstrap d'administration:
  - login `admin`
  - profil `Informatique`
  - mot de passe initial `NewNexus!2026`
  - obligation de changement de mot de passe a terme
- generation et application de la migration:
  - `20260429164708_AuthenticationBootstrap`
- mise en place de l'authentification applicative par cookie dans `NewNexus.Api`
- ajout des endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- protection des endpoints securite par authentification
- endpoint comptes enrichi et maintenu:
  - `GET /api/security/accounts`
- verification fonctionnelle publiee OK:
  - login `admin / NewNexus!2026`
  - `GET /api/auth/me`
  - `GET /api/security/accounts`
- vigilance accents appliquee:
  - textes frontend reecrits avec accents corrects
  - labels seedes remis en UTF-8 propre
- correction logo:
  - abandon du wordmark SVG simplifie pour un asset PNG plus propre
- prochaine etape:
  - ecran de changement de mot de passe
  - regles de droits plus fines par endpoint
  - premiers ecrans d'administration comptes / profils

## 2026-04-29 - Administration initiale des comptes et des droits

- renforcement du controle d'autorisation backend:
  - policy `RequireInformatique`
  - endpoints de securite reserves au profil `Informatique`
- ajout des premiers endpoints d'administration des comptes:
  - `PUT /api/security/accounts/{accountId}/profile`
  - `PUT /api/security/accounts/{accountId}/status`
- regles de securite deja actives:
  - impossible de desactiver son propre compte
  - impossible de retirer son propre profil d'administration
- evolution de l'interface frontend:
  - tableau d'administration des comptes enrichi
  - selection du profil par compte
  - activation / desactivation d'un compte
  - action d'enregistrement par ligne
- vigilance accents confirmee:
  - textes frontend verifies en UTF-8
  - titre publie `NewNexus` controle
  - libelles avec accents presents dans l'ecran connecte
- finition visuelle:
  - wordmark PNG conserve pour eviter le defaut visuel sur le `X`
  - styles completes pour la gestion des comptes
- validation technique:
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
  - `npm run build` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK
- validation fonctionnelle publiee:
  - `POST /newNexus/api/auth/login` OK
  - `GET /newNexus/api/auth/me` OK
  - `GET /newNexus/api/security/accounts` OK
  - `PUT /newNexus/api/security/accounts/{id}/profile` OK
  - `PUT /newNexus/api/security/accounts/{id}/status` OK
- prochaine etape:
  - gestion complete des profils
  - filtrage fin frontend selon les droits reels
  - creation / synchronisation des utilisateurs metier

## 2026-04-29 - Integration du handoff de marque NEXUS premium

- lecture et application du prompt de `identité visuelle\nexus_brand_handoff\PROMPT_A_DONNER_A_CODEX.md`
- integration des tokens officiels dans le frontend:
  - `NewNexus.Web/src/assets/brand/nexus/04_codex/design-tokens.css`
  - `NewNexus.Web/src/assets/brand/nexus/04_codex/design-tokens.json`
- branchement du point d'entree React sur les tokens de marque via `src/main.tsx`
- mise a jour des points d'entree navigateur:
  - favicon
  - icones 16x16 / 32x32 / 180x180
  - manifest web `manifest.webmanifest`
- integration de l'animation post-authentification:
  - composant `NexusPostAuthLoader`
  - stylesheet `nexus-post-auth-loader.css`
  - affichage une seule fois apres connexion reussie
  - respect de `prefers-reduced-motion`
- conservation de la logique metier:
  - aucun changement sur les endpoints d'authentification
  - aucun changement sur les routes fonctionnelles
- documentation ajoutee:
  - `docs\newnexus-brand-handoff-integration.md`
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK
- validation publiee:
  - HTML `/newNexus` contient les liens favicon / manifest attendus
  - `GET /newNexus/manifest.webmanifest` OK
  - `POST /newNexus/api/auth/login` OK
  - `GET /newNexus/api/auth/me` OK

## 2026-04-29 - Reglage fin de l'animation post-authentification

- correction du comportement de transition:
  - suppression du flash du dashboard avant l'animation
  - le loader devient un ecran exclusif pendant la transition
- ajustement de duree:
  - duree globale passee a environ 2,8 s
  - timings internes allonges pour rendre visible la fin de la sequence
- effet attendu apres correction:
  - aucun affichage fugitif du dashboard
  - animation complete visible avant l'arrivee sur l'ecran connecte
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK

## 2026-04-29 - Gestion des profils et filtrage fin par droits

- evolution backend securite:
  - ajout de la gestion complete des profils
  - endpoints admin:
    - `GET /api/security/profiles`
    - `POST /api/security/profiles`
    - `PUT /api/security/profiles/{profileId}`
    - `DELETE /api/security/profiles/{profileId}`
  - regles de suppression:
    - impossible de supprimer un profil systeme
    - impossible de supprimer un profil encore affecte a un compte
- evolution frontend:
  - chargement admin des modules / profils / comptes reserve au profil `Informatique`
  - filtrage de la navigation et du dashboard selon les droits reels du compte connecte
  - ecran d'administration des profils:
    - creation d'un profil
    - edition du libelle
    - activation / desactivation
    - affectation des droits `Aucun / Lecture / Ecriture` par module
  - ecran comptes conserve et aligne avec les profils editables
- validation fonctionnelle:
  - lecture profils publiee OK
  - creation profil publiee OK
  - mise a jour profil publiee OK
  - suppression profil publiee OK
- hygiene de recette:
  - profil temporaire `TEST_TEMP` cree pour validation puis supprime
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK

## 2026-04-29 - Correction creation profil et sortie du mode tout-dashboard

- correction fonctionnelle profils:
  - a la creation d'un profil, seul le libelle est saisi
  - le code technique est maintenant genere automatiquement cote backend
  - gestion des collisions de code ajoutee
- correction ergonomique:
  - abandon du mode "tout sur le dashboard"
  - la navigation laterale pilote des vues distinctes:
    - `Administration`
    - `Exploitation`
    - `Gestion administrative`
  - l'administration profils/comptes reste concentree dans `Administration`
  - les autres entrees affichent uniquement leur espace de travail
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK

## 2026-04-29 - Integration Groupe Laure × Nexus

- lecture et application du prompt de `identité visuelle\nexus_groupe_laure_handoff\03_prompt\PROMPT_A_DONNER_A_CODEX.md`
- nouvelle transition post-authentification:
  - remplacement de `NexusPostAuthLoader`
  - ajout du composant `PostLoginBrandTransition`
  - séquence premium `Groupe Laure × Nexus`
  - affichage unique après login conservé
- evolution de la page d'authentification:
  - intégration du logo Groupe Laure
  - lockup premium `Groupe Laure × Nexus`
  - message d'entrée retravaillé
- hygiene frontend:
  - ancien loader supprimé
  - pas de commentaires inutiles laissés dans les fichiers frontend concernés
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK
- validation fonctionnelle:
  - `POST /newNexus/api/auth/login` OK
  - `GET /newNexus/api/auth/me` OK

## 2026-04-30 - Refonte lisibilite administration

- evolution ergonomique:
  - suppression de la creation inline de profil
  - ajout d'une synthese lisible des profils et de leurs droits par module
  - ajout d'une configuration ciblee sur le profil selectionne
  - ajout d'un bouton `Ajouter un profil` ouvrant une modale de configuration
- correction qualite:
  - correction des libelles FR endommages dans la vue Administration
- validation technique:
  - `npm run build` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK

## 2026-04-30 - Sous-menu administration

- evolution ergonomique:
  - le menu `Administration` est decoupe en sous-menu:
    - `Comptes utilisateurs`
    - `Profils`
    - `Parametres`
    - `Outils`
  - la vue `Profils` conserve la synthese des droits par module, la selection d'un profil et la modale `Ajouter un profil`
  - la vue `Comptes utilisateurs` isole maintenant clairement l'affectation des profils et l'activation des comptes
  - les vues `Parametres` et `Outils` sont posees comme emplacements dedies pour les prochains lots
- correction qualite:
  - correction du libelle `Libelle` dans l'editeur de profil
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK

## 2026-04-30 - Edition directe des profils

- evolution ergonomique:
  - la modification d'un profil ne passe plus par une selection puis une zone de configuration en bas de page
  - chaque carte profil propose maintenant une action directe `Configurer le profil`
  - l'edition complete du profil s'ouvre dans une modale dediee
- simplification de l'ecran:
  - suppression du panneau de configuration inline dans `Administration > Profils`
  - conservation de la synthese des droits par module directement sur les cartes
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK
