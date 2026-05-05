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
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-BOero0j2.css` et `index-BNVeubKI.js`

## 2026-05-05 - Recherche SIRENE par nom ville code postal

- demande:
  - la recherche SIRENE doit etre disponible en saisissant seulement un nom et/ou une ville et/ou un code postal
  - la modale d'ajout societe ne proposait que le SIREN
- backend:
  - ajout de `GET /api/settings/companies/sirene-search`
  - criteres acceptes: `name`, `city`, `postalCode`
  - appel de l'API publique Recherche d'Entreprises avec resultats limites, dedoublonnes par SIREN et filtres sur ville/code postal si renseignes
  - enrichissement du DTO SIRENE avec `postalCode` et `city`
- frontend:
  - ajout d'un bloc `Recherche par criteres` dans la modale `Ajouter une societe`
  - champs `Nom`, `Ville`, `Code postal`
  - affichage des resultats SIRENE sous forme de cartes selectionnables
  - selection d'un resultat: renseigne SIREN, nom affiche, raison sociale et valide la societe avant creation
  - la recherche directe par SIREN reste disponible
- backlog:
  - item `Societes Groupe Laure` precise avec recherche SIREN et recherche nom/ville/code postal
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-BE9Hlo43.css` et `index-CaWevmG6.js`

## 2026-05-05 - Disponibilite recherche SIRENE en creation Societe

- demande:
  - en ajout de societe, la recherche SIRENE n'etait pas disponible
- diagnostic:
  - le bouton etait desactive tant que le champ ne contenait pas exactement 9 caracteres
  - un SIREN colle avec espaces, points ou tirets pouvait etre tronque par `maxLength=9` avant normalisation
  - test direct de l'API publique Recherche d'Entreprises sur `552100554`: HTTP 200
- correction:
  - suppression du verrou bloquant sur la longueur pour le bouton `Rechercher SIRENE`
  - la recherche reste cliquable et affiche le message metier si le SIREN normalise ne contient pas 9 chiffres
  - `maxLength` du champ SIREN augmente pour accepter les collages avec espaces/separateurs
  - aide de saisie ajoutee sous le champ SIREN
- backlog:
  - item `Societes Groupe Laure` precise avec bouton SIRENE disponible et saisie tolerante
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-B60YdiUg.css` et `index-DnQ12cYL.js`

## 2026-05-05 - Accordéon premium et listes déroulantes sombres

- demande:
  - adoucir l'ouverture des accordéons de navigation latérale
  - retirer `Accueil` des sous-menus car le clic sur le menu mere affiche deja l'accueil
  - corriger les listes déroulantes dont le fond gris ne respecte pas la charte
- correction:
  - sous-menus lateraux conserves dans le DOM et animes via `max-height`, opacite et translation verticale
  - sous-entrees `Accueil` retirees des accordéons lateraux
  - clic sur un menu mere conserve l'ouverture de son accueil de rubrique
  - styles sombres ajoutes sur les `select` et leurs `option` dans les formulaires, modales et pages d'administration
- backlog:
  - item `Navigation alphabetique absolue` precise avec accordéon anime et sans entree Accueil
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-CR47EbIp.css` et `index-NGWJKcpM.js`

## 2026-05-05 - Accordéon de navigation latérale

- demande:
  - les sous-menus lateraux doivent etre masques par defaut
  - le clic sur un menu mere ouvre uniquement son accordéon
  - le clic sur un autre menu mere replie l'accordéon precedent
- correction:
  - ajout de l'etat `expandedSidebarMenu`
  - les sous-menus ne sont rendus que lorsque leur menu mere est ouvert
  - clic sur un parent avec sous-menu: ouvre ce parent ou le replie si deja ouvert
  - clic sur un parent sans sous-menu: replie tous les accordéons
  - attributs `aria-expanded` et `aria-controls` ajoutes aux menus parents
- backlog:
  - item `Navigation alphabetique absolue` precise avec accordéon ferme par defaut
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundle publie: `index-CBrLA0Vs.css` et `index-_1Qy3qcp.js`
  - controle source/publie sans `Vos acces sont proteges`, `Connexion securisee`, `Socle premium`, `Importer depuis Nexus`, `admin`/`NewNexus!2026` pre-remplis
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

## 2026-04-30 - Accueil et synthese administration

- evolution navigation:
  - `Tableau de bord` est renomme en `Accueil`
  - `Accueil` devient l'entree de tete et la page d'arrivee apres connexion
- evolution administration:
  - suppression de la pastille `Mon profil` dans `Administration > Profils`
  - transformation de `Synthese` en bandeau horizontal premium pleine largeur
  - ajout d'une liste cliquable des profils configures pour defiler directement vers la vignette correspondante
  - suppression du doublon visuel dans les vignettes profil
- validation metier:
  - version validee par l'utilisateur
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK

## 2026-04-30 - Perimetre Parametres

- decision fonctionnelle:
  - les referentiels `Societes Groupe Laure`, `Analytiques` et `Exploitations` seront integres dans `Administration > Parametres`
- impact backlog:
  - le prochain lot transverse a developper doit donc etre pense comme un lot `Parametres`
  - l'entree `Parametres` n'est plus un simple placeholder d'administration, mais le point d'entree des premiers referentiels transverses

## 2026-04-30 - Premier lot Parametres transverse

- evolution backend:
  - ajout des entites `Company`, `Analytic` et `Exploitation`
  - ajout des mappings EF Core PostgreSQL associes
  - ajout des `DbSet` transverse dans `NewNexusDbContext`
  - ajout des endpoints:
    - `GET /api/settings/bootstrap`
    - `POST /api/settings/analytics`
    - `PUT /api/settings/analytics/{id}`
    - `POST /api/settings/exploitations`
    - `PUT /api/settings/exploitations/{id}`
- evolution base:
  - migration `TransverseSettingsSocle` generee
  - migration appliquee sur la base locale `NewNexus`
  - schemas et tables en place:
    - `transverse.Company`
    - `transverse.Analytic`
    - `transverse.Exploitation`
- evolution frontend:
  - remplacement du placeholder `Administration > Parametres` par une vue de synthese lisible
  - affichage des compteurs et des listes:
    - societes Groupe Laure
    - analytiques
    - exploitations
  - positionnement volontaire sur un premier lot de lecture, sans ecran d'edition avancee a ce stade
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release` OK
  - `dotnet ef database update` OK
  - publication IIS via `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` OK
  - `GET /newNexus/api/system/info` OK
  - `GET /newNexus/api/settings/bootstrap` retourne bien `401` hors connexion, conforme a la protection attendue

## 2026-05-04 - Edition Parametres analytiques et exploitations

- reprise du contexte et du backlog pour relancer le chantier `Administration > Parametres`
- evolution frontend:
  - ajout des formulaires de creation pour `Analytiques` et `Exploitations`
  - ajout de l'edition inline des analytiques existants:
    - code
    - libelle
    - societe de rattachement
    - statut actif / inactif
  - ajout de l'edition inline des exploitations existantes:
    - code
    - libelle
    - societe de rattachement
    - statut actif / inactif
  - affichage d'un bloc d'alerte si aucune societe Groupe Laure n'est disponible
- conservation du cadrage:
  - les societes restent en lecture dans cette passe
  - la creation des societes via SIRENE reste a brancher
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS non relancee pendant cette passe

## 2026-05-04 - Saisie controlee des societes Parametres

- evolution backend:
  - ajout de `POST /api/settings/companies`
  - ajout de `PUT /api/settings/companies/{companyId}`
  - validation SIREN:
    - 9 chiffres obligatoires
    - unicite du SIREN
  - validation des libelles:
    - nom d'affichage obligatoire
    - raison sociale obligatoire
- evolution frontend:
  - ajout d'un formulaire de creation des societes dans `Administration > Parametres`
  - ajout de l'edition inline des societes existantes:
    - SIREN
    - nom affiche
    - raison sociale
    - statut actif / inactif
  - le message de blocage des analytiques/exploitations est maintenant rattache a l'absence de societe disponible
- cadrage conserve:
  - cette saisie est une saisie controlee transitoire
  - le branchement SIRENE reel reste a developper
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
  - frontend reconstruit et recopie dans `NewNexus.Api\wwwroot`
  - API publiee dans `C:\inetpub\newnexus`
  - application IIS `Localaure/newNexus` maintenue
- validation publication:
  - `GET /newNexus/` retourne `200`
  - `GET /newNexus/api/system/info` retourne `200`
  - `GET /newNexus/api/settings/bootstrap` retourne `401` hors connexion, conforme a la protection attendue

## 2026-05-04 - Correction connexion URL sans slash final

- anomalie constatee:
  - depuis la page de connexion, erreur JSON `Unexpected token '<', "<!doctype "... is not valid JSON`
  - cause probable confirmee par test HTTP: les appels relatifs `./api/...` peuvent sortir de `/newNexus` lorsque la page est ouverte sans slash final
  - dans ce cas, IIS renvoie du HTML du site parent au lieu du JSON API attendu
- correction frontend:
  - ajout d'un helper `apiPath(...)`
  - construction des appels API avec `import.meta.env.BASE_URL`
  - les appels ciblent maintenant explicitement `/newNexus/api/...`
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- prochaine etape:
  - publication IIS
  - verification login publie
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus` retourne `200 text/html`
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/auth/me` avec le cookie de session retourne `200 application/json`
  - compte confirme: `admin`, profil `Informatique`, droits V1 en `Write`

## 2026-05-04 - Accueils Administration / Parametres et comptes utilisateurs

- correction ergonomique Administration:
  - l'entree `Administration` n'ouvre plus directement `Profils`
  - ajout d'un accueil Administration avec cartes de choix:
    - `Comptes utilisateurs`
    - `Profils`
    - `Parametres`
    - `Outils`
- correction ergonomique Parametres:
  - ajout d'un mini-accueil `Parametres`
  - separation des vues:
    - `Societes`
    - `Analytiques`
    - `Exploitations`
  - l'objectif est d'eviter l'ecran fouillis avec tous les referentiels sur une seule vue
- evolution backend comptes:
  - ajout de `POST /api/security/accounts`
  - ajout de `PUT /api/security/accounts/{accountId}`
  - validation:
    - login obligatoire et unique
    - nom affiche obligatoire
    - email basiquement valide si renseigne
    - profil actif si selectionne
    - mot de passe initial de 10 caracteres minimum a la creation
    - nouveau mot de passe de 10 caracteres minimum si renseigne en edition
  - protections conservees:
    - impossible de retirer son propre profil d'administration
    - impossible de desactiver son propre compte
- evolution frontend comptes:
  - ajout d'un formulaire de creation de compte
  - ajout de cartes d'edition inline pour les comptes existants:
    - login
    - nom affiche
    - email
    - matricule
    - profil
    - statut actif / inactif
    - obligation de changement de mot de passe
    - reinitialisation optionnelle du mot de passe
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- prochaine etape:
  - publication IIS
  - verification HTTP et login publie
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/security/accounts` avec cookie de session retourne `200 application/json`

## 2026-05-04 - Alignement visuel Comptes utilisateurs sur Profils

- evolution frontend comptes:
  - la vue `Administration > Comptes utilisateurs` reprend le visuel de `Profils`
  - liste des comptes presentee en cartes de synthese
  - bouton principal `Ajouter un compte` ouvrant une modale de creation
  - bouton `Configurer le compte` sur chaque carte ouvrant une modale d'edition
  - les champs de configuration restent complets:
    - login
    - nom affiche
    - email
    - matricule
    - profil
    - statut actif / inactif
    - obligation de changement de mot de passe
    - nouveau mot de passe optionnel
- correction mineure:
  - fermeture de la modale de configuration apres enregistrement du compte
  - retrait d'un effet de bord inutile dans la creation de societe
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/security/accounts` avec cookie de session retourne `200 application/json`

## 2026-05-04 - Correction modale ajout de compte

- anomalie constatee:
  - les zones de saisie de la modale `Ajouter un compte` se superposaient
- correction frontend:
  - passage de la grille comptes en deux colonnes dans les modales
  - exclusion des checkbox des styles reserves aux champs texte/select
  - alignement explicite des lignes de bascule `Compte actif` et `Changement de mot de passe requis`
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/security/accounts` avec cookie de session retourne `200 application/json`

## 2026-05-04 - Changement de mot de passe utilisateur

- evolution backend:
  - ajout de `POST /api/auth/change-password`
  - validation du mot de passe actuel
  - nouveau mot de passe de 10 caracteres minimum
  - confirmation obligatoire du nouveau mot de passe
  - remise a `false` de `MustChangePassword` apres changement valide
- evolution frontend:
  - ecran bloquant tant que le compte connecte a `mustChangePassword = true`
  - formulaire mot de passe actuel / nouveau mot de passe / confirmation
  - retour utilisateur sur les erreurs de validation
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `POST /newNexus/api/auth/change-password` avec mot de passe actuel invalide retourne `400`, validation backend active

## 2026-05-04 - Ergonomie comptes et profils

- evolution frontend:
  - ajout d'un etat vide sur `Administration > Profils`
  - ajout d'un etat vide sur `Administration > Comptes utilisateurs`
  - ajout d'une alerte dans la modale `Ajouter un compte` lorsqu'aucun profil n'est disponible
- cadrage:
  - aucune action de suppression n'a ete ajoutee cote UI pendant cette passe
  - les controles backend existants restent inchanges
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/security/accounts` avec cookie de session retourne `200 application/json`

## 2026-05-04 - Recherche SIRENE societes

- source officielle verifiee:
  - API Recherche d'Entreprises ouverte sur data.gouv.fr
  - limite annoncee: 7 appels / seconde
  - donnees disponibles: denomination, SIREN, SIRET, NAF notamment
- evolution backend:
  - ajout du client HTTP `Sirene`
  - ajout de `GET /api/settings/companies/sirene/{siren}`
  - recherche par SIREN 9 chiffres via l'API Recherche d'Entreprises
  - retour controle pour pre-remplir la societe: SIREN, SIRET, nom affiche, raison sociale, NAF, source
- evolution frontend:
  - bouton `Rechercher SIRENE` dans `Administration > Parametres > Societes`
  - pre-remplissage du nom affiche et de la raison sociale
  - conservation de la saisie controlee en secours
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/settings/companies/sirene/552100554` avec cookie de session retourne `200 application/json`

## 2026-05-04 - Outils diagnostics administration

- evolution backend:
  - ajout de `GET /api/admin/diagnostics`
  - endpoint protege par le profil `Informatique`
  - expose application, base PostgreSQL, securite, parametres et integrations
- evolution frontend:
  - remplacement du placeholder `Administration > Outils`
  - cartes de synthese diagnostics
  - bouton de rafraichissement
  - message d'erreur dedie si les diagnostics sont indisponibles
- validation technique:
  - `npm run build` OK
  - `dotnet build C:\dev\NewNexus\NewNexus.slnx -c Release --verbosity minimal` OK
- prochaine etape:
  - publication IIS
  - verification HTTP publiee
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `POST /newNexus/api/auth/login` avec `admin / NewNexus!2026` retourne `200 application/json`
  - `GET /newNexus/api/admin/diagnostics` avec cookie de session retourne `200 application/json`
  - `GET /newNexus/api/security/accounts` avec cookie de session retourne `200 application/json`

## 2026-05-04 - Outils cles API et import Nexus legacy

- evolution backend:
  - ajout de l'entite `IntegrationCredential` dans le schema PostgreSQL `transverse`
  - migration `IntegrationCredentials` generee et appliquee
  - stockage des valeurs avec DataProtection NewNexus
  - ajout de `GET /api/admin/integrations/credentials`
  - ajout de `POST /api/admin/integrations/credentials`
  - ajout de `POST /api/admin/integrations/credentials/import-nexus`
  - ajout du mode CLI local `--import-legacy-credentials` pour executer l'import sans dependance a une session web
- import legacy:
  - lecture de `LOCATIF_DEV.app.ParametreSysteme`
  - trousseau legacy lu depuis `C:\inetpub\locatif-backend\App_Data\DataProtection-Keys`
  - deprotection legacy avec l'application DataProtection `Locatif`
  - fournisseurs couverts: SIRENE, Lucca, TruckOnline, YellowBox, suivi tracteurs, cles admin legacy
  - placeholders visibles pour Geoapify, Google Maps et OpenStreetMap lorsque la configuration legacy ne contient pas de valeur
  - import effectue depuis le binaire publie IIS pour rechiffrer avec le trousseau `C:\inetpub\newnexus\App_Data\DataProtection-Keys`
  - resultat import: 22 valeur(s) importee(s), 10 ignoree(s), 0 echec
- evolution frontend:
  - ajout d'un bloc `Cles API & acces externes` dans `Administration > Outils`
  - bouton `Importer depuis Nexus`
  - liste des fournisseurs connus avec valeurs masquees pour les secrets
  - formulaire de declaration / mise a jour d'une cle ou d'une valeur d'integration
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK


- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK via `powershell.exe -ExecutionPolicy Bypass -File`
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `GET /newNexus/api/settings/companies/sirene/552100554` retourne `401 Unauthorized` sans authentification, attendu
  - bundle publie: `index-C2iMSue1.js`

## 2026-05-05 - Ergonomie Societes et separation Transverse

- demande:
  - rendre `Rechercher SIRENE` operationnel dans Societes
  - interdire la creation d'une societe sans validation SIRENE
  - aligner Societes sur l'ergonomie liste + bouton + modale ajouter/modifier
  - sortir Tiers et Salaries de Parametres car ils appartiennent au socle transverse
- corrections API:
  - mutualisation de la recherche SIRENE dans `LookupSireneCompanyAsync`
  - `GET /api/settings/companies/sirene/{siren}` retourne maintenant le detail d'indisponibilite SIRENE
  - `POST /api/settings/companies` verifie obligatoirement le SIREN via SIRENE avant creation
  - creation refusee si le SIREN n'est pas retrouve dans SIRENE, meme en contournant l'UI
- corrections UI:
  - ajout de l'entree principale `Transverse`
  - `Administration > Parametres` limite a `Societes`, `Analytiques`, `Exploitations`
  - `Transverse` regroupe `Salaries`, `Tiers`, `Materiels`
  - `Administration > Parametres > Societes` passe en liste de cartes + bouton `Ajouter une societe`
  - creation/modification Societes via modale
  - bouton `Rechercher SIRENE` pre-remplit la modale et deverrouille le bouton de creation uniquement apres validation
- backlog:
  - Societes, SIRENE, Salaries, Tiers et Materiels mis a jour avec le nouvel emplacement fonctionnel
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK via `powershell.exe -ExecutionPolicy Bypass -File`
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `POST /newNexus/api/settings/employees/import-lucca` retourne `401 Unauthorized` sans authentification, attendu
  - bundles publies: `index-DCYKUqRU.css` et `index-CcTKVuIe.js`

## 2026-05-05 - Diagnostic import Lucca

- demande:
  - message utilisateur: `Import Lucca impossible`
- diagnostic:
  - l'import precedent appelait uniquement l'API Lucca v5 `/lucca-api/employees` avec authentification Bearer
  - les cles reprises depuis Nexus legacy sont tres probablement des cles applicatives Lucca historiques
  - l'UI affichait seulement le titre `Import Lucca impossible` et masquait le detail technique renvoye par l'API
- corrections API:
  - chemin Lucca par defaut repasse sur `/api/v3/users?...&paging=0,1000`
  - authentification legacy ajoutee avec `Authorization: lucca application=...`
  - compatibilite v5 conservee avec Bearer et `Api-Version: 2025-01-01` si le chemin cible `/lucca-api/...`
  - lecture des collections Lucca dans `items`, `data` ou `data.items`
  - mapping champs v3/v5: `firstName/lastName/displayName/mail/login/dtContractEnd` et `givenName/familyName/email/remoteId/status`
- corrections UI:
  - `getRequestError` affiche maintenant le `detail` des ProblemDetails backend en plus du `title`
- backlog:
  - `Interfaces | LUCCA` precise la compatibilite legacy/v5 et reste en `A_TESTER`
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `POST /newNexus/api/settings/employees/provision-accounts` retourne `401 Unauthorized` sans authentification
  - `GET http://192.168.60.158/newNexus/` retourne `200 text/html`
  - `GET http://192.168.50.102/newNexus/` retourne `200 text/html`
  - bundles publies: `index-6cWOpYS8.css` et `index-CavBLcNU.js`

## 2026-05-05 - Salariés en modales et import Lucca

- demande:
  - remplacer la creation inline des salaries par une modale, comme les profils et utilisateurs
  - afficher une vraie liste des salaries avec ouverture de la modification au clic/bouton
  - faire un check des accents et corriger proprement les libelles visibles
  - developper l'import Lucca avec les champs prevus initialement
- source API verifiee:
  - documentation officielle Lucca `GET /lucca-api/employees`
  - champs disponibles retenus: `id`, `remoteId`, `employeeNumber`, `givenName`, `familyName`, `status`, `email`, `phoneNumber`
  - authentification appelee avec `Authorization: Bearer <token>` et header `Api-Version`
- corrections modele:
  - ajout du champ `PhoneNumber` sur `Employee`
  - migration `EmployeePhoneAndLuccaImport` generee et appliquee localement
- corrections API:
  - ajout de `POST /api/settings/employees/import-lucca`
  - lecture des cles `LUCCA_BASE_URL`, `LUCCA_API_KEY` et `LUCCA_USERS_PATH` depuis `Administration > Outils > Cles API`
  - import pagine via `links.next.href`
  - upsert salarie par `SourceEmployeeId` ou `EmployeeNumber`
  - mapping Lucca:
    - `SourceEmployeeId`: `remoteId`, sinon `id`
    - `EmployeeNumber`: `employeeNumber`, sinon `remoteId`, sinon `id`
    - `DisplayName`: `givenName familyName`, sinon email/matricule
    - `Email`: `email`
    - `PhoneNumber`: `phoneNumber`
    - `IsActive`: false seulement si statut `deactivated`
  - la qualification conducteur reste locale, car le mapping Lucca conducteur n'est pas encore arbitre
- corrections UI:
  - liste salaries en cartes
  - bouton `Ajouter un salarie` ouvrant une modale de creation
  - bouton `Configurer le salarie` ouvrant une modale de modification
  - bouton `Importer depuis Lucca` dans `Administration > Parametres > Salaries`
  - affichage du resultat import: importes, crees, mis a jour, ignores
  - affichage du telephone dans les cartes salaries
- accents:
  - correction des constantes et blocs visibles Outils: `Cles API`, `Taches planifiees`, `Requeteur SQL`, textes SQL et Traces
  - conservation de la normalisation visible pour les chaines historiques restantes
- backlog:
  - `Salaries` enrichi et conserve en `A_TESTER`
  - `LUCCA` passe de `A_DEVELOPPER` a `A_TESTER`
  - ajout du suivi de migration telephone salaries
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
  - `dotnet ef database update --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `POST /newNexus/api/settings/employees/import-lucca` retourne `401 Unauthorized` sans authentification
  - `GET http://192.168.60.158/newNexus/` retourne `200 text/html`
  - `GET http://192.168.50.102/newNexus/` retourne `200 text/html`
  - bundles publies: `index-DCYKUqRU.css` et `index-CV17TORT.js`

- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-D8p7XazW.css` et `index-DYVrJOdu.js`
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `POST /newNexus/api/auth/forgot-password` retourne `200 application/json`
  - bundles publies: `index-B2l1X4SK.css` et `index-HJLcf-Gs.js`
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-D0NplWwd.css` et `index-BFn53tMu.js`

## 2026-05-04 - Socle mot de passe oublie

- correction domaine/base:
  - ajout des champs de reinitialisation sur `UserAccount`: jeton hashe, date de demande, expiration et consommation
  - migration EF `PasswordResetRequests` generee et appliquee sur PostgreSQL local
- correction backend:
  - ajout de `POST /api/auth/forgot-password` pour enregistrer une demande avec jeton temporaire expire au bout de 30 minutes
  - ajout de `POST /api/auth/reset-password` pour consommer un jeton valide et definir un nouveau mot de passe
  - le jeton n'est pas renvoye hors environnement Development; l'envoi du lien reste a raccorder au service mail/SSO
- correction frontend:
  - le lien `Mot de passe oublie ?` ouvre une modale de demande
  - affichage d'un message generique pour eviter de reveler l'existence d'un compte
- backlog:
  - chantier `Mot de passe oublie` passe en `EN_COURS`
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
  - `dotnet ef database update` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200`
  - `GET /newNexus/api` retourne `200`
  - `GET /newNexus/api/admin/integrations/credentials` sans session retourne `401`
  - `POST /newNexus/api/admin/integrations/credentials/import-nexus` sans session retourne `401`
- limite de validation:
  - le compte `admin` n'accepte plus les mots de passe documentes `NewNexus!2026` et `legri00`; aucun reset de mot de passe utilisateur n'a ete effectue

## 2026-05-04 - Application prompt identite visuelle Nexus officielle

- source appliquee:
  - lecture de `C:\Dev\NewNexus\identite visuelle\Nexus\PROMPT_CODEX_NEXUS.md`
  - prise en compte de la reference `reference/auth_reference_nexus_sso.html`
  - reprise des assets officiels `nexus-icon.svg` et `nexus-wordmark.svg`
- evolution frontend:
  - ajout des assets officiels dans `NewNexus.Web/src/assets/brand`
  - ajout de `NewNexus.Web/src/styles/nexus-theme.css` pour centraliser les tokens graphite, noir et champagne
  - page de connexion alignee sur l'identite premium sombre Nexus
  - SSO entreprise Groupe Laure mis en avant comme action principale visuelle
  - formulaire login/mot de passe conserve en acces exceptionnel sans modification de logique metier
  - sidebar et transition post-authentification raccordees aux SVG officiels
  - nettoyage des anciennes valeurs violettes explicites dans les styles sources concernes
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK apres relance hors sandbox de la CLI .NET
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `GET /newNexus/api/auth/me` sans session retourne `401`

## 2026-05-04 - Finalisation identite visuelle Nexus

- finalisation frontend:
  - remplacement des anciens assets publics Nexus par les SVG officiels sombres/champagne
  - suppression des anciens PNG/ICO Nexus publics non conformes et non references
  - manifest et meta theme-color alignes sur le fond officiel `#04060A`
  - renommage des classes et tokens residuels `purple` vers des variantes champagne
  - neutralisation des dernieres couleurs historiques saturees dans la navigation, les cartes, les badges et l'animation post-authentification
- controle charte:
  - scan source `NewNexus.Web/src`, `NewNexus.Web/public` et `NewNexus.Web/index.html` sans violet/parme ni anciennes couleurs saturees historiques
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - scan strict source, dist et `NewNexus.Api/wwwroot` sans violet/parme ni anciennes couleurs saturees historiques
  - `NewNexus.Api/wwwroot` ne contient plus les anciens PNG/ICO Nexus publics non conformes

## 2026-05-04 - Correction stricte authentification Figma SSO

- reference appliquee:
  - reprise visuelle ciblee de `identite visuelle/preview_nexus_premium_v5_figma_sso.html`
  - utilisation des SVG exacts du kit valide sous les noms applicatifs `nexus_icon_figma_clean.svg` et `nexus_wordmark_figma_clean.svg`
  - hashes SHA256 des deux SVG applicatifs identiques aux assets source `identite visuelle/Nexus/assets`
- correction frontend:
  - page de connexion recalee sur un fond sombre premium plus profond et moins voile
  - lockup Nexus en colonne avec proportions proches de la maquette validee
  - carte de connexion sombre/verre fume, bord champagne subtil et relief leger
  - champs login/mot de passe repasses en style sombre premium avec icones et texte clair
  - SSO conserve comme action principale et formulaire login/mot de passe presente comme acces exceptionnel
  - logique metier de connexion non modifiee
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundle publie: `index-DKGoUJhM.css` et `index-B9kJf1zI.js`

## 2026-05-04 - Recette authentification, post-auth et surfaces internes

- corrections authentification:
  - login et mot de passe initialises vides, sans pre-remplissage applicatif
  - ajout d'un bouton oeil pour afficher ou masquer le mot de passe
  - suppression du bloc `Vos acces sont proteges` / `Connexion securisee au systeme d'information`
  - ajout explicite de `GROUPE LAURE . NEXUS`
  - vagues de la page d'authentification rendues animees
  - dimensions et surfaces recalees vers la reference `preview_nexus_premium_v5_figma_sso.html`
- corrections post-auth:
  - transition post-auth remplacee par une scene sombre cinematique avec vagues animees, fusion et lockup Nexus final
  - transition raccordee aux SVG propres `nexus_icon_figma_clean.svg` et `nexus_wordmark_figma_clean.svg`
- corrections application:
  - blocs blancs neutralises dans les surfaces principales administration, exploitation et gestion administrative
  - numero de version conserve uniquement dans le contexte Administration
  - texte sidebar `Socle premium...` remplace par date et heure temps reel
  - titres des espaces Exploitation et Gestion administrative harmonises avec Administration
- corrections outils:
  - suppression du bouton `Importer depuis Nexus`
  - liste des cles API regroupee par fournisseur logiciel, une carte par logiciel
- validation technique:
  - `npm run build` OK

## 2026-05-04 - Alignement final auth Figma et sortie loader

- corrections authentification:
  - comparaison avec `C:\Dev\NewNexus\identite visuelle\preview_nexus_premium_v5_figma_sso.html`
  - libelle `GROUPE LAURE • NEXUS` replace au-dessus du lockup Nexus comme dans la maquette validee
  - suppression du `Groupe Laure` isole qui apparaissait sous le mot Nexus
  - ajout des deux courbes SVG manquantes pour retrouver les cinq vagues animees de la maquette
- corrections post-auth:
  - ordre de connexion ajuste pour hydrater l'etat utilisateur avant affichage du loader
  - garde-fou React ajoute pour sortir automatiquement de l'animation meme si le composant de transition ne declenche pas son callback
  - libelle final de l'animation harmonise en `GROUPE LAURE • NEXUS`
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DJQsnXBe.css` et `index-eK3vzr-W.js`

## 2026-05-04 - Harmonisation gabarits auth et application

- corrections authentification:
  - lockup Nexus recalibre sur les cotes finales de la maquette: zone marque `940px`, lockup `860px`, pictogramme `126px`, wordmark `742px`
  - suppression de l'encadrement interne du pictogramme pour afficher le SVG valide sans effet de boite additionnelle
  - carte de connexion alignee sur la version finale de la maquette: largeur `560px`, padding `36px 34px`, titre sur une ligne
  - grille auth ajustee en `1.06fr / .94fr` avec un espacement plus proche du rendu valide
- corrections application:
  - sous-menus Administration et Parametres forces en surfaces sombres, sans fond blanc residuel
  - gabarit hero uniformise entre Accueil, Administration, Exploitation et Gestion administrative
  - cartes principales de contenu forcees sur une hauteur minimale commune pour limiter les sauts visuels au changement de menu
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DynGBz90.css` et `index-9EcdUzqn.js`

## 2026-05-04 - Verrouillage des bandeaux titres

- correction application:
  - bandeau `hero-card` force a une hauteur fixe de `220px` sur desktop
  - grille interne du bloc titre normalisee en quatre lignes: rubrique, titre, description, action
  - ligne d'action reservee sur toutes les pages pour eviter le decalage cause par la version affichee uniquement dans Administration
  - descriptions limitees a deux lignes afin de stabiliser la hauteur au changement de menu
- validation technique:
  - `npm run build` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-D9t2l4BH.css` et `index-BvMN5wF-.js`

## 2026-05-04 - Stabilisation visuelle globale et Outils

- corrections visuelles globales:
  - ajout de protections CSS `min-width: 0` et `overflow-wrap` sur cartes, titres, textes, badges et modales
  - grilles principales passees en `auto-fit` pour eviter les chevauchements lorsque la largeur disponible baisse
  - bandeaux titres repasses en hauteur minimale plutot que hauteur stricte afin d'eviter les recouvrements en cas de texte plus long
- corrections Administration / Outils:
  - remplacement du formulaire inline des cles API par une modale d'ajout/configuration
  - fonctionnement rapproche de Profils: liste de cartes, bouton `Ajouter une cle`, bouton `Configurer la cle`
  - suppression des traces visibles `Source`, `Manuelle`, `Import Nexus legacy` et des libelles legacy
  - filtrage des fournisseurs techniques `LEGACY_NEXUS` et `TRACTOR_TRACKING`; les parametres tracteurs restent rattaches a TruckOnline
  - reprise des accents sur les libelles de la page des cles API
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-BglM32XO.css` et `index--__lAYMg.js`

## 2026-05-04 - Bandeaux titres et menus Outils

- corrections bandeaux:
  - retrait visuel du bloc lateral `Session active` dans les titres de page; ces informations restent disponibles dans l'accueil et ne doivent pas piloter la navigation
  - gabarit `hero-card` repasse en colonne unique avec hauteur desktop fixe de `220px`
  - titre, description et ligne d'action conserves dans une grille stable pour harmoniser Accueil, Administration, Exploitation et Gestion administrative
- corrections Administration / Outils:
  - ajout d'un accueil `Centre d'outils`
  - creation du sous-menu Outils: `Accueil`, `Cles API`, `Taches planifiees`, `Requeteur SQL`, `Traces`, `Diagnostics`
  - rubrique `Cles API` isolee dans son menu avec la liste et les actions existantes
  - emplacements prepares pour les futures rubriques techniques sans modifier la logique metier existante
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-D0NplWwd.css` et `index-r48xBJTH.js`

## 2026-05-04 - Ajouts backlog authentification et erreurs base

- backlog securite:
  - ajout du chantier `Connexion SSO reelle`
  - ajout du chantier `Mot de passe oublie`
- backlog technique:
  - ajout du chantier `Message base de donnees inaccessible`
- objectif:
  - cadrer les prochains travaux d'authentification et remplacer les erreurs techniques par des messages utilisateur comprehensibles lorsque PostgreSQL est indisponible

## 2026-05-04 - Message base PostgreSQL inaccessible

- correction backend:
  - ajout d'un middleware global de gestion des indisponibilites PostgreSQL
  - retour API normalise en `503` avec `Code = DATABASE_UNAVAILABLE`
  - journalisation serveur de l'erreur avec le chemin appele
- correction frontend:
  - lecture du message serveur sur `auth/me`, login et chargement administration
  - conservation des messages de validation metier existants
- backlog:
  - passage du chantier `Message base de donnees inaccessible` en `TERMINE`
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK

## 2026-05-04 - Comptes utilisateurs et taches planifiees

- corrections Administration / Comptes utilisateurs:
  - ajout d'une reinitialisation administrateur du mot de passe par mot de passe temporaire
  - le compte cible passe en `MustChangePassword` afin d'imposer le changement au prochain login
  - refus du reset sur son propre compte et sur les comptes inactifs
  - ajout d'un panneau cycle de vie dans la modale compte: derniere connexion, creation, dernier import et etat email
  - affichage du mot de passe temporaire uniquement apres l'action de reset admin
- corrections Administration / Outils:
  - rubrique `Taches planifiees` remplacee par une vraie vue de cadrage
  - traitements prepares: SIRENE, Lucca, TruckOnline, YellowBox et retention des traces
  - les traitements restent au statut de raccordement, sans execution automatique pour l'instant
- backlog:
  - gestion des comptes precisee avec le reset admin temporaire
  - ecran des outils precise avec la premiere vue `Taches planifiees`
  - chantier transverse `Taches planifiees` ajoute en `SCAFFOLDE`
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK

## 2026-05-04 - Suite Outils: requeteur et traces

- corrections Administration / Outils:
  - rubrique `Requeteur SQL` structuree en catalogue de requetes controlees, sans execution SQL libre
  - regles de securite affichees avant raccordement: lecture seule, requetes nommees, parametres types, journalisation et exclusion des secrets
  - rubrique `Traces` structuree par flux: authentification, actions administrateur, integrations et erreurs applicatives
  - retention cible affichee par flux et rappel du masquage des secrets / donnees personnelles
- backlog:
  - chantiers `Requeteur SQL controle` et `Consultation des traces` ajoutes en `SCAFFOLDE`
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-XOpaeaz0.css` et `index-BAfGQMLZ.js`

## 2026-05-04 - Scaffold modules fonctionnels V1

- corrections modules:
  - ajout de cartes de cadrage dans `Exploitation` pour la carte des points, les indicateurs conducteurs et les indicateurs tracteurs
  - ajout d'une carte de cadrage dans `Gestion administrative` pour la gestion des contraventions
  - chaque carte affiche objectif, donnees attendues, droit courant et prochaine etape
  - aucune logique metier ni table module n'a ete ajoutee a ce stade
- backlog:
  - les quatre modules fonctionnels V1 passent de `CADRE` a `SCAFFOLDE`
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-q2G_L207.css` et `index-BDs32zol.js`

## 2026-05-04 - Scaffold RH Lucca et comptes

- corrections Administration / Parametres:
  - ajout d'une entree `Salaries`
  - cadrage affiche: source unique Lucca, distinction conducteurs, creation automatique de comptes
  - regle explicite: un compte issu d'un salarie importe doit rester sans droit tant qu'un profil NewNexus n'est pas affecte
  - aucun import Lucca reel ni creation automatique de compte n'est active a ce stade
- corrections Administration / Outils:
  - ajout d'une tache planifiee cible `LUCCA_ACCOUNT_PROVISIONING`
  - la tache est positionnee apres import salaries Lucca et reste au statut de cadrage
- backlog:
  - `Salaries`, `Distinction conducteurs` et `Creation auto des comptes depuis salaries` passent en `SCAFFOLDE`
  - l'interface Lucca est precisee avec le scaffold salaries/provisioning
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundle publie: `index-CBJymuku.js`

## 2026-05-04 - Scaffold tiers et materiels

- corrections Administration / Parametres:
  - ajout d'une entree `Tiers`
  - cadrage affiche: types de tiers, limites SIRENE, rattachement multi-analytiques
  - les cas particuliers et entreprises etrangeres restent explicitement a arbitrer
  - ajout d'une entree `Materiels`
  - cadrage affiche: numero de parc unique, source TruckOnline et telematique YellowBox
- corrections Administration / Outils:
  - ajout d'une tache planifiee cible `MATERIALS_IMPORT`
  - la tache reste au statut de cadrage, sans import reel active
- backlog:
  - `Tiers`, `Rattachement multi-analytiques des tiers` et `Materiels` passent en `SCAFFOLDE`
  - les interfaces TruckOnline et YellowBox sont precisees avec le scaffold materiels
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundle publie: `index-Cj1r3Kwj.js`

## 2026-05-04 - Reprise backlog et passe responsive initiale

- contexte:
  - reprise apres le scaffold `Tiers` / `Materiels`
  - prochaine priorite backlog traitee: `UX | Responsive tablette / smartphone / PC`
- corrections UX:
  - ajout d'une couche CSS responsive dediee au shell applicatif
  - navigation laterale repliee proprement en haut de page sur tablette/mobile
  - grilles principales, cartes outils, modules, parametres, profils et taches adaptees aux largeurs reduites
  - formulaires et modales contraints en largeur/hauteur pour eviter les debordements sur mobile
- backlog:
  - `Responsive tablette / smartphone / PC` passe de `A_PLANIFIER` a `SCAFFOLDE`
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DXVLchaD.css` et `index-e1zWj7qJ.js`

## 2026-05-04 - Qualite accents et libelles visibles

- contexte:
  - poursuite du backlog sur `UX | Qualite accents et libelles UTF-8`
  - le fichier React principal contient encore des chaines historiques mojibake, a nettoyer progressivement sans casser les comparaisons existantes
- corrections UX:
  - ajout d'une normalisation d'affichage des noeuds texte React pour corriger les sequences mojibake connues
  - couverture des libelles visibles d'administration, parametres, outils, accents courants et apostrophes typographiques cassees
  - aucune cle metier, endpoint ou logique de droits n'a ete modifiee
- backlog:
  - commentaire du chantier `Qualite accents et libelles UTF-8` mis a jour
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DXVLchaD.css` et `index-PJT7jn-U.js`

## 2026-05-04 - Reprise contexte et design system V1

- contexte:
  - reprise apres la passe `Qualite accents et libelles visibles`
  - prochain item backlog traite: `UX | Design system NewNexus`
- livrable:
  - creation de `docs/newnexus-design-system-v1.md`
  - cadrage des sources de verite: SVG officiels, tokens CSS/JSON et reference auth validee
  - regles posees pour couleurs, typographie, layout, cartes, boutons, formulaires, modales, administration, outils, responsive et etats
- backlog:
  - `Design system NewNexus` passe de `A_FAIRE` a `SCAFFOLDE`
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DXVLchaD.css` et `index-PJT7jn-U.js`

## 2026-05-04 - Passe consolidation backlog 1+2 hors SSO/mail + 3 + 5

- perimetre traite:
  - UX: qualite libelles, responsive, design system, maquettes cadre
  - Securite / Administration: profils, comptes, autorisations backend, ecrans Administration
  - Parametres transverses: societes, analytiques, exploitations et cadrage salaries
  - Interfaces: SIRENE, Lucca, TruckOnline, YellowBox, geocodage et cartographie
- exclusions demandees:
  - SSO reel non traite
  - envoi mail du mot de passe oublie non traite
- corrections API:
  - enrichissement de `GET /api/admin/diagnostics` avec un bloc `readiness`
  - readiness exposee par chantiers: UX, securite, parametres et interfaces
  - les statuts indiquent ce qui est testable, ce qui reste a developper et ce qui depend d'un contrat API externe
- corrections UI:
  - affichage de la readiness backlog dans `Administration > Outils > Diagnostics`
  - cartes dediees avec statut, detail et prochaine etape pour chaque chantier
  - aucune simulation de raccordement externe n'a ete ajoutee
- backlog:
  - passages en `A_TESTER`: dashboard/accueil, qualite libelles, responsive, profils, comptes, autorisation backend, ecrans administration, societes, analytiques, exploitations, parametrage interfaces, SIRENE
  - passages en `A_DEVELOPPER`: salaries Lucca, creation auto des comptes depuis salaries, Lucca, TruckOnline, YellowBox, geocodage, cartographie
  - `Maquettes UI haute fidelite` passe en `CADRE`
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DyRnIfVN.css` et `index-CNSem55a.js`

## 2026-05-05 - Etapes 2 et 3 finalisation technique et referentiels transverses

- demande:
  - realiser les etapes 2 et 3 du backlog
  - conserver le SSO et le mot de passe oublie hors perimetre
- finalisation technique:
  - design system V1 enrichi avec inventaire des composants et captures a produire
  - cibles reseau validees: `http://192.168.60.158/newNexus/` et `http://192.168.50.102/newNexus/` retournent `200 text/html`
  - `psql` reste absent du PATH local, aucun changement d'installation effectue
  - les nouvelles chaines ajoutees evitent le mojibake, le nettoyage historique complet du fichier React reste progressif
- referentiels transverses:
  - ajout des entites persistantes `Employee`, `ThirdParty`, `ThirdPartyAnalytic` et `Material`
  - ajout des configurations EF Core et des `DbSet` associes
  - generation et application locale de la migration `TransverseBusinessReferentials`
  - `GET /api/settings/bootstrap` expose maintenant salaries, tiers et materiels
  - ajout des endpoints de creation et modification pour salaries, tiers et materiels
- UI administration:
  - ajout des formulaires et listes dans `Administration > Parametres`
  - salaries: base Lucca, email, telephone, matricule et indicateur conducteur
  - tiers: type, SIREN, TVA/reference, societe et rattachement multi-analytiques
  - materiels: numero de parc unique, type, source et rattachement exploitation
- limites assumees:
  - import Lucca reel, TruckOnline, YellowBox et autres providers restent dependants des contrats API et credentials definitifs
  - creation automatique des comptes depuis salaries posee cote modele/backlog, raccordement complet a securiser dans une passe dediee
- backlog:
  - items salaries, conducteurs, tiers, multi-analytiques tiers, materiels et design system passes a `A_TESTER`
  - ajout du suivi de migration technique des referentiels transverses
- validation technique:
  - `dotnet ef database update --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `GET http://192.168.60.158/newNexus/` retourne `200 text/html`
  - `GET http://192.168.50.102/newNexus/` retourne `200 text/html`
  - bundles publies: `index-DyRnIfVN.css` et `index-Cp348Y8u.js`

## 2026-05-05 - Ergonomie comptes, sessions utilisateurs et favicon

- demande:
  - corriger le bouton blanc de fermeture dans la modale de configuration de compte
  - rendre le libelle `Aucun` lisible en rouge sur les profils
  - ajouter dans Outils les utilisateurs connectes, l'historique des connexions, le temps de connexion et la deconnexion forcee
  - rendre le delai de deconnexion automatique parametrable par utilisateur, avec 1h par defaut
  - verifier le favicon Nexus
- corrections UX:
  - bouton `Fermer` des modales passe en rendu sombre premium
  - badges `Aucun`/droits `None` passent en rouge lisible
  - styles ajoutes pour `Administration > Outils > Sessions`
  - favicon `favicon.svg` verifie et servi par IIS en `image/svg+xml`
- securite sessions:
  - ajout de l'entite `UserSession`
  - ajout du champ `SessionTimeoutMinutes` sur `UserAccount`, defaut 60 minutes
  - creation d'une session a chaque login avec expiration par compte
  - validation cookie rattachee a la session serveur: session expiree, fermee ou revoquee => cookie refuse
  - logout utilisateur historise via `LogoutAtUtc`
  - endpoint `GET /api/admin/sessions` pour sessions actives et historique
  - endpoint `POST /api/admin/sessions/{sessionId}/disconnect` pour deconnecter une session
- UI administration:
  - champ `Deconnexion auto (minutes)` ajoute aux modales ajout/configuration de compte
  - nouvelle entree visuelle `Sessions` dans `Administration > Outils`
  - affichage des sessions actives avec IP, derniere activite, expiration et action `Deconnecter`
  - historique des 100 dernieres sessions avec duree et statut
- migration:
  - `UserSessionsAndTimeouts` generee et appliquee localement
- backlog:
  - gestion des sessions passee a `A_TESTER`
  - gestion des comptes enrichie avec le timeout par utilisateur
  - centre d'outils enrichi avec la rubrique Sessions
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
  - `dotnet ef database update --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - `GET /newNexus/favicon.svg` retourne `200 image/svg+xml`
  - bundles publies: `index-7PCJa-8p.css` et `index-C36CU3qJ.js`

## 2026-05-05 - Backlog creation comptes depuis salaries

- demande:
  - reprise du backlog apres la passe sessions utilisateurs
  - prochain item traite: `Donnees Communes | Creation auto des comptes depuis salaries`
- choix fonctionnel:
  - provisioning local sans dependance Lucca reelle
  - seuls les salaries actifs sont traites
  - un salarie deja rattache a un compte via son matricule est ignore
  - les comptes crees restent actifs mais sans profil NewNexus, donc sans droit applicatif tant qu'un profil n'est pas affecte
  - un mot de passe temporaire est genere et le changement est force a la premiere connexion
- corrections API:
  - ajout de `POST /api/settings/employees/provision-accounts`
  - generation d'un login unique depuis email, matricule, source Lucca ou nom
  - retour detaille: comptes crees, salaries ignores, login et mot de passe temporaire
- corrections UI:
  - ajout d'un bloc `Creation automatique des comptes` dans `Administration > Parametres > Salaries`
  - bouton `Creer les comptes depuis les salaries`
  - affichage du resultat de provisioning et des mots de passe temporaires generes
- backlog:
  - `Creation auto des comptes depuis salaries` passe de `A_DEVELOPPER` a `A_TESTER`
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK

## 2026-05-05 - Donnees Communes, ordre alphabetique et modales Tiers/Materiels

- demande:
  - remplacer le libelle applicatif `Transverse` par `Donnees Communes`
  - appliquer l'ordre alphabetique comme regle absolue dans les entrees de navigation
  - ajouter des sous-menus dans les menus qui n'en avaient pas encore
  - aligner Tiers et Materiels sur l'ergonomie liste + bouton ajout + modale ajout/modification
- navigation:
  - entree principale `Donnees Communes` ajoutee a la place de `Transverse`
  - navigation principale triee: Accueil, Administration, Donnees Communes, Exploitation, Gestion administrative
  - sous-menu Administration trie: Accueil, Comptes utilisateurs, Outils, Parametres, Profils
  - sous-menu Parametres trie: Accueil, Analytiques, Exploitations, Societes
  - sous-menu Donnees Communes trie: Accueil, Materiels, Salaries, Tiers
  - sous-menu Outils trie: Accueil, Cles API, Diagnostics, Requeteur SQL, Sessions, Taches planifiees, Traces
  - sous-menus ajoutes dans Exploitation et Gestion administrative avec Accueil puis les modules accessibles tries alphabetiquement
- ergonomie Donnees Communes:
  - Tiers passe en liste de cartes, bouton `Ajouter un tiers` et modale de creation/modification
  - Materiels passe en liste de cartes, bouton `Ajouter un materiel` et modale de creation/modification
  - les formulaires inline Tiers/Materiels sont retires pour conserver le modele commun de l'application
- backlog:
  - section courante renommee `Donnees Communes`
  - item `Navigation alphabetique absolue` ajoute en `A_TESTER`
  - items Tiers et Materiels mis a jour avec la regle liste + modales
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api` retourne `200 application/json`
  - bundles publies: `index-DCYKUqRU.css` et `index-BAmCwOmk.js`

## 2026-05-05 - Sous-menus visibles dans la navigation laterale

- demande:
  - les sous-menus n'etaient pas visibles dans la navigation principale
- correction:
  - ajout de sous-entrees directement dans la barre laterale pour Administration, Donnees Communes, Exploitation et Gestion administrative
  - chaque sous-entree ouvre directement la bonne rubrique et conserve l'etat actif
  - style dedie ajoute pour distinguer parent, sous-menu et sous-entree active
  - les sous-menus restent tries alphabetiquement selon la regle absolue posee
- backlog:
  - item `Navigation alphabetique absolue` precise avec sous-menus visibles dans la navigation laterale
- validation technique:
  - `npm run build` OK

## 2026-05-05 - Requeteur SQL controle testable

- demande:
  - continuer le backlog apres la passe navigation laterale
  - prochain item traite: `Donnees Communes | Requeteur SQL controle`
- choix de securite:
  - aucun SQL libre accepte depuis l'interface
  - execution limitee a un catalogue serveur de requetes nommees
  - requetes implementees en lecture seule via EF Core / DbContext
  - journalisation serveur de chaque lancement avec code requete, utilisateur et nombre de lignes
- corrections API:
  - ajout de `GET /api/admin/sql-queries`
  - ajout de `POST /api/admin/sql-queries/{queryCode}/run`
  - requetes disponibles:
    - `SECURITY_ACCOUNTS_OVERVIEW`
    - `MODULE_RIGHTS_MATRIX`
    - `COMMON_DATA_REFERENTIALS`
    - `INTEGRATION_CREDENTIALS_AUDIT`
- corrections UI:
  - branchement du catalogue SQL depuis l'API dans `Administration > Outils > Requeteur SQL`
  - bouton d'execution par requete nommee
  - affichage tabulaire generique des resultats avec libelles de colonnes et dates lisibles
- backlog:
  - `Requeteur SQL controle` passe de `SCAFFOLDE` a `A_TESTER`
- validation technique:
  - `npm run build` OK
  - `dotnet build NewNexus.slnx` OK

## 2026-05-05 - Publication systematique et consultation des traces

- demande:
  - publier IIS systematiquement apres les passes backlog
  - continuer le backlog
- publication IIS:
  - `scripts\publish_newnexus_iis.ps1` execute apres la passe Requeteur SQL
  - anomalie detectee: `/newNexus/api/...` etait repris par la regle SPA du site parent et retournait `403.18`
  - correction du `web.config` parent: exclusion `^/newNexus(/|$)` retablie dans la regle `SPA Routes`
  - script de publication enrichi pour verifier et retablir cette exclusion a chaque publication
- traces applicatives:
  - ajout de l'entite `ApplicationTrace`
  - ajout de la configuration EF Core et du `DbSet`
  - generation et application locale de la migration `ApplicationTraces`
  - ajout de `GET /api/admin/traces` avec filtre par flux
  - flux exposes: Authentification, Actions administrateur, Traitements d'integration, Erreurs applicatives
  - premiers evenements collectes: login reussi/refuse, logout, demandes et consommation de reset mot de passe, modification cles API, import cles legacy, execution requeteur SQL controle
  - les mots de passe, jetons et valeurs de cles API ne sont pas stockes dans les traces
- UI:
  - `Administration > Outils > Traces` charge les flux depuis l'API
  - filtre par flux, liste des traces recentes, niveau, acteur, sujet, IP et detail disponibles
- backlog:
  - `Consultation des traces` passe de `SCAFFOLDE` a `A_TESTER`
  - migration technique `ApplicationTraces` ajoutee en `TERMINE`
- validation technique:
  - `dotnet ef migrations add ApplicationTraces --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `dotnet ef database update --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
- validation publication:
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api/system/info` retourne `200 application/json`

## 2026-05-05 - Taches planifiees pilotables

- demande:
  - continuer le backlog apres commit/push
  - prochain item traite: `Donnees Communes | Taches planifiees`
- corrections API:
  - ajout de `GET /api/admin/scheduled-tasks`
  - ajout de `POST /api/admin/scheduled-tasks/{taskCode}/run`
  - catalogue serveur des traitements SIRENE, Lucca, provisioning comptes, TruckOnline, YellowBox, materiels et retention traces
  - historique de derniere execution lu depuis les traces `SCHEDULED_TASK_RUN`
  - refus explicite des traitements non raccordes avec trace `SCHEDULED_TASK_REFUSED`
  - premier executeur reel disponible: `LUCCA_ACCOUNT_PROVISIONING`, reutilisant la creation de comptes depuis salaries actifs
- corrections UI:
  - `Administration > Outils > Taches planifiees` charge le catalogue depuis l'API
  - affichage du statut, de la cadence, de la derniere execution et de l'action disponible
  - bouton `Executer maintenant` actif uniquement pour les taches raccordees
- backlog:
  - `Taches planifiees` passe de `SCAFFOLDE` a `A_TESTER`
- validation technique:
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK

## 2026-05-05 - Module gestion des contraventions

- demande:
  - continuer le backlog apres la passe taches planifiees
  - publication IIS systematique maintenue
- corrections domaine / donnees:
  - ajout de l'entite `Contravention`
  - ajout de la table `administration.Contravention`
  - rattachements optionnels vers `Employee` conducteur et `Material`
  - dates metier `OffenseDate` / `DueDate` stockees en type PostgreSQL `date`
  - code module aligne avec la documentation V1: `CONTRAVENTIONS`
- corrections API:
  - ajout de `GET /api/modules/contraventions`
  - ajout de `GET /api/modules/contraventions/referentials`
  - ajout de `POST /api/modules/contraventions`
  - ajout de `PUT /api/modules/contraventions/{contraventionId}`
  - controle backend par droit module: `Lecture` pour consultation, `Ecriture` pour creation / modification
  - traces metier ajoutees dans le flux `MODULE_EVENTS`
- corrections UI:
  - remplacement de la carte scaffold par un ecran operationnel dans `Gestion administrative > Gestion des contraventions`
  - synthese avis / ouverts / echeances 15 jours
  - liste des avis avec statut, montant, conducteur, materiel, lieu et echeance
  - modale de creation / edition avec rattachements conducteur et materiel
- backlog:
  - `Gestion des contraventions` passe de `SCAFFOLDE` a `A_TESTER`
- validation technique:
  - `dotnet ef migrations add ContraventionsModule --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `dotnet ef database update --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
- validation publication:
  - `scripts\publish_newnexus_iis.ps1` OK
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api/system/info` retourne `200 application/json`
  - `GET /newNexus/api/modules/contraventions` retourne `401` sans session
  - `GET /newNexus/api/modules/contraventions/referentials` retourne `401` sans session

## 2026-05-05 - Module carte des points chargements/dechargements

- demande:
  - continuer le backlog et mettre a jour le contexte
  - publication IIS systematique maintenue
- choix de perimetre:
  - V1 locale sans dependance fournisseur
  - coordonnees latitude/longitude saisies manuellement en attendant geocodage/cartographie reelle
  - module rendu testable sans attendre Geoapify, Google ou OpenStreetMap
- corrections domaine / donnees:
  - ajout de l'entite `LoadingPoint`
  - ajout de la table `exploitation.LoadingPoint`
  - types supportes: `CHARGEMENT`, `DECHARGEMENT`, `MIXTE`
  - rattachements optionnels vers `ThirdParty` et `Exploitation`
  - coordonnees optionnelles `Latitude` / `Longitude`
- corrections API:
  - ajout de `GET /api/modules/loading-points`
  - ajout de `GET /api/modules/loading-points/referentials`
  - ajout de `POST /api/modules/loading-points`
  - ajout de `PUT /api/modules/loading-points/{loadingPointId}`
  - controle backend par droit module `CARTE_POINTS_CHARGEMENT_DECHARGEMENT`
  - traces metier `LOADING_POINT_CREATED` et `LOADING_POINT_UPDATED` dans `MODULE_EVENTS`
- corrections UI:
  - remplacement de la carte scaffold par un ecran operationnel dans `Exploitation > Carte des points chargements/dechargements`
  - synthese points / actifs / coordonnes / villes
  - carte locale grillee avec pins de points
  - liste detaillee des points avec adresse, tiers, exploitation, coordonnees et statut
  - modale creation / edition avec type, adresse, coordonnees et rattachements
- backlog:
  - `Carte des points chargements/dechargements` passe de `SCAFFOLDE` a `A_TESTER`
  - migration technique `LoadingPointsModule` ajoutee en `TERMINE`
- validation technique:
  - `dotnet ef migrations add LoadingPointsModule --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `dotnet ef database update --project NewNexus.Data.Postgres --startup-project NewNexus.Api` OK
  - `dotnet build NewNexus.slnx` OK
  - `npm run build` OK
- validation publication:
  - `scripts\publish_newnexus_iis.ps1` OK
  - `GET /newNexus/` retourne `200 text/html`
  - `GET /newNexus/api/system/info` retourne `200 application/json`
  - `GET /newNexus/api/modules/loading-points` retourne `401` sans session
  - `GET /newNexus/api/modules/loading-points/referentials` retourne `401` sans session
