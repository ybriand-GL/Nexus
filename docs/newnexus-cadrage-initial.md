# NewNexus

## Cadrage initial

Date: 2026-04-29
Base de depart: application Nexus / LocaLaure existante
Objectif: nouveau produit, nouvelle ergonomie, nouvelle base PostgreSQL, reutilisation selective des briques utiles de Nexus

## 1. Positionnement

`NewNexus` ne doit pas etre un clone technique de `Nexus`.

Les constats de depart sont les suivants:

- la base actuelle est fortement couplee a SQL Server
- le socle de droits / securite de Nexus est juge insuffisant
- l'ergonomie actuelle ne doit pas etre reprise telle quelle
- plusieurs integrations existantes ont en revanche une vraie valeur de reutilisation

Conclusion:

- `NewNexus` doit etre traite comme un nouveau produit
- `Nexus` sert de reference metier et de gisement de composants reutilisables
- la couche persistance, la securite, les droits et l'ergonomie doivent etre reconcus

## 2. Perimetre V1 retenu

### 2.1 Socle

- structure de base
- parametres systeme
- securite
- gestion des droits
- outils d'administration utiles

### 2.2 Transverse

- interfaces
- salaries
- materiels
- tiers
- societes / entites
- analytiques
- exploitations

### 2.3 Lot fonctionnel 1

- indicateurs conducteurs
- gestion des contraventions
- carte des flux
- suivi des tracteurs

### 2.4 Interfaces V1

- Truckonline
- Lucca
- YellowBox
- cartographie
- geocodage

## 3. Strategie de reutilisation

### 3.1 A reutiliser en priorite

- clients d'integration HTTP existants
- logique de rapprochement metier deja stabilisee
- certaines structures DTO / contrats API si elles restent neutres vis-a-vis de la base
- composants frontend generiques utiles, mais pas la navigation ni les ecrans existants dans leur forme actuelle

### 3.2 A ne pas reprendre tel quel

- `LocatifDbContext` actuel
- scripts de bootstrap SQL Server
- outillage `admin/sql/*`
- audit base via mecanismes SQL Server
- gestion actuelle des droits si elle reste basee sur les contournements observes dans Nexus
- navigation / ergonomie / menus existants

### 3.3 A reconstruire

- schema PostgreSQL
- socle auth / session / mots de passe / revocation
- modele de roles, permissions et perimetres
- audit applicatif
- administration utile et sobre
- design system et parcours UX

## 4. Architecture cible recommandee

## 4.1 Solution

- `NewNexus.Api`
- `NewNexus.Web`
- `NewNexus.Domain`
- `NewNexus.Data.Postgres`
- `NewNexus.Integrations`

## 4.2 Roles des projets

### `NewNexus.Domain`

- modeles metier
- services metier
- regles de calcul
- interfaces de repository

### `NewNexus.Data.Postgres`

- EF Core PostgreSQL
- mappings base
- repositories
- migrations

### `NewNexus.Integrations`

- Truckonline
- Lucca
- YellowBox
- geocodage
- cartographie / reverse geocoding

### `NewNexus.Api`

- endpoints
- auth
- autorisation
- orchestration metier
- scheduler
- audit applicatif

### `NewNexus.Web`

- nouvelle UI
- nouvelle navigation
- nouvelles vues loties par usage et non par heritage Nexus

## 5. Modele de securite et droits cible

## 5.1 Principes

Le modele doit etre plus simple, plus lisible et plus testable que celui de Nexus.

Il faut distinguer explicitement:

- l'identite
- le role
- la permission fonctionnelle
- le perimetre de donnees

## 5.2 Modele recommande

### Roles globaux

- `superadmin`
- `admin`
- `manager`
- `exploitant`
- `lecteur`

### Permissions fonctionnelles

Exemples:

- `salaries.read`
- `salaries.write`
- `tracteurs.read`
- `tracteurs.refresh`
- `contraventions.read`
- `contraventions.write`
- `kpi-conducteurs.read`
- `admin.settings.manage`

### Perimetres

- societes autorisees
- analytiques autorisees
- exploitations autorisees
- ressources autorisees si besoin

## 5.3 Regle d'usage

- les roles donnent une base
- les permissions ouvrent les fonctionnalites
- les perimetres filtrent les donnees visibles et modifiables
- le backend reste la source de verite

## 6. Contraintes techniques majeures

Le portage direct de Nexus vers PostgreSQL n'est pas recommande car le code actuel contient de nombreuses dependances SQL Server:

- `UseSqlServer`
- `Microsoft.Data.SqlClient`
- `sp_set_session_context`
- `SCOPE_IDENTITY()`
- `OBJECT_ID(...)`
- `sys.tables`
- `INFORMATION_SCHEMA` utilisee avec des hypotheses SQL Server
- DDL SQL Server dans les helpers de bootstrap
- outillage admin SQL couple a SQL Server

Conclusion:

- il faut une nouvelle couche data
- il faut remplacer les mecanismes SQL Server specifiques
- il faut privilegier l'audit applicatif plutot que les triggers specifiques a un SGBD

## 7. Ordre de realisation recommande

## Phase 0 - Cadrage

- valider le perimetre V1
- valider le modele de droits
- valider la cible d'architecture
- arbitrer les donnees a reprendre depuis Nexus

## Phase 1 - Fondation technique

- creer la solution `NewNexus`
- brancher PostgreSQL
- mettre en place migrations et configuration
- poser auth / sessions / audit applicatif

## Phase 2 - Socle transverse

- entites / societes
- analytiques
- exploitations
- tiers
- salaries
- ressources / materiels

## Phase 3 - Integrations

- Lucca
- Truckonline
- YellowBox
- geocodage / cartographie

## Phase 4 - Lot 1 fonctionnel

- indicateurs conducteurs
- contraventions
- carte des flux
- suivi des tracteurs

## Phase 5 - Stabilisation

- tests
- reprise de donnees initiale
- outillage d'administration minimum
- deploiement IIS du nouveau site

## 8. Premiere tranche d'execution

La premiere tranche a lancer maintenant doit etre:

1. specification du modele de droits `NewNexus`
2. specification du schema transverse V1 PostgreSQL
3. creation du squelette de solution `NewNexus`

Ordre recommande a tres court terme:

1. decrire les personas et usages d'administration
2. fixer la matrice roles / permissions / perimetres
3. dessiner le schema transverse minimal
4. seulement ensuite demarrer le code

## 9. Decisions prises a ce stade

- `NewNexus` est un nouveau produit
- PostgreSQL est la base cible
- la gestion des droits est a reconstruire
- l'ergonomie est a reconstruire
- les integrations existantes sont candidates a la reutilisation
- l'objectif n'est pas de porter `Locatif.Api` tel quel

## 10. Suite immediate

Le prochain livrable recommande est:

- un document `newnexus-modele-droits-v1.md`

Il devra contenir:

- roles
- permissions
- perimetres
- regles d'heritage
- cas limites
- impacts frontend / backend
