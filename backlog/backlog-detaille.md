# Backlog detaille NewNexus
Derniere mise a jour: 2026-04-29

## Legende des statuts

- `A_FAIRE`
- `EN_COURS`
- `CADRE`
- `SCAFFOLDE`
- `A_DEVELOPPER`
- `A_TESTER`
- `TERMINE`
- `BLOQUE`

## 1. Gouvernance et architecture

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Gouvernance | Cadrage initial NewNexus | TERMINE | Document de base redige |
| Gouvernance | Contexte vivant de session | TERMINE | Fichier `contexte/session.md` cree |
| Gouvernance | Backlog detaille | TERMINE | Fichier backlog initialise |
| Gouvernance | Strategie de versionnement | TERMINE | Definie dans le contexte |
| Gouvernance | Strategie de branches socle/transverse/modules | TERMINE | Definie dans le contexte |
| Architecture | Architecture cible solution | CADRE | Projets cibles identifies |
| Architecture | Scaffold solution technique | TERMINE | Depot Git, solution .NET et frontend crees |
| Architecture | Compatibilite hebergement `/newNexus` | SCAFFOLDE | Base path backend/frontend deja prepare |

## 2. UX et produit

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| UX | Cadrage UX V1 | TERMINE | Document redige |
| UX | Wireframes V1 | TERMINE | Document redige |
| UX | Dashboard par profil | EN_COURS | Dashboard connecte disponible, personnalisation par profil a poursuivre |
| UX | Coque frontend premium initiale | TERMINE | Shell Nexus 4C integre et branche au socle |
| UX | Integration identite visuelle Nexus | TERMINE | Assets, palette, typo et favicon appliques |
| UX | Qualite accents et libelles UTF-8 | EN_COURS | Vigilance explicite, ecrans d'authentification et d'administration comptes corriges |
| UX | Maquettes UI haute fidelite | A_FAIRE | Etape ulterieure |
| UX | Design system NewNexus | A_FAIRE | A concevoir apres scaffold |

## 3. Securite et droits

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Securite | Modele de droits V1 par module | TERMINE | Document redige |
| Securite | Profils V1 | TERMINE | Informatique, Direction, Exploitation, Administratif |
| Securite | Tables PostgreSQL securite | TERMINE | Migration `InitialSecuritySocle` generee |
| Securite | Entites domaine securite | TERMINE | `SecurityModule`, `SecurityProfile`, `SecurityProfileModuleRight`, `UserAccount` crees |
| Securite | Authentification applicative | TERMINE | Login/logout/me par cookie operationnels |
| Securite | Gestion des sessions | TERMINE | Session cookie applicative en place |
| Securite | Gestion des profils | EN_COURS | Modele et graines V1 en place, lecture disponible, edition complete a faire |
| Securite | Gestion des comptes | EN_COURS | Lecture, affectation profil et activation disponibles |
| Securite | Endpoints lecture modules/profils | TERMINE | `modules`, `profiles`, `bootstrap` exposes |
| Securite | Endpoint lecture comptes | TERMINE | `GET /api/security/accounts` expose |
| Securite | Changement de mot de passe | A_DEVELOPPER | Necessaire pour sortir du bootstrap |
| Securite | Controle d'autorisation backend | EN_COURS | Policy `RequireInformatique` en place sur les endpoints securite |
| Securite | Protection frontend par droits | EN_COURS | Flux connecte et administration Informatique en place, filtrage fin a faire |
| Securite | Endpoint mise a jour profil compte | TERMINE | `PUT /api/security/accounts/{id}/profile` publie et teste |
| Securite | Endpoint activation / desactivation compte | TERMINE | `PUT /api/security/accounts/{id}/status` publie et teste |
| Securite | Ecran administration des comptes | EN_COURS | Edition du profil et du statut disponible, creation et recherche a faire |

## 4. Transverse

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Transverse | Schema transverse V1 | TERMINE | Document redige |
| Transverse | Societes Groupe Laure | CADRE | Creation via SIRENE uniquement |
| Transverse | Analytiques | CADRE | Code 4 caracteres, 1 societe |
| Transverse | Exploitations | CADRE | Code + libelle + societe |
| Transverse | Salaries | CADRE | Source unique LUCCA |
| Transverse | Distinction conducteurs | CADRE | A porter dans le modele local |
| Transverse | Creation auto des comptes depuis salaries | CADRE | Compte sans droit a l'import |
| Transverse | Tiers | CADRE | Multi-types, details a completer plus tard |
| Transverse | Rattachement multi-analytiques des tiers | CADRE | Table de liaison prevue |
| Transverse | Materiels | CADRE | Import, numero de parc unique |
| Transverse | Parametrage des interfaces | CADRE | Toutes les interfaces Nexus a reprendre |

## 5. Interfaces

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Interfaces | SIRENE | CADRE | Creation societes, partie tiers |
| Interfaces | LUCCA | CADRE | Source unique salaries |
| Interfaces | Truckonline | CADRE | A reutiliser/selectivement porter |
| Interfaces | YellowBox | CADRE | A reutiliser/selectivement porter |
| Interfaces | Geocodage | CADRE | A reprendre |
| Interfaces | Cartographie | CADRE | A reprendre |

## 6. Modules fonctionnels V1

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Module | Gestion des contraventions | CADRE | Navigation `Gestion administrative` |
| Module | Carte des points chargements/dechargements | CADRE | Navigation `Exploitation` |
| Module | Les indicateurs conducteurs | CADRE | Navigation `Exploitation` |
| Module | Les indicateurs des tracteurs | CADRE | Navigation `Exploitation` |

## 7. Technique

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Technique | Premier schema PostgreSQL V1 | TERMINE | Document redige |
| Technique | Creation solution .NET | TERMINE | Solution `NewNexus.slnx` creee |
| Technique | Projet `NewNexus.Api` | TERMINE | Projet scaffoldé |
| Technique | Projet `NewNexus.Domain` | TERMINE | Projet scaffoldé |
| Technique | Projet `NewNexus.Data.Postgres` | TERMINE | Projet scaffoldé |
| Technique | Projet `NewNexus.Integrations` | TERMINE | Projet scaffoldé |
| Technique | Projet `NewNexus.Web` | TERMINE | Projet Vite React TS scaffoldé |
| Technique | Socle HTTP backend minimal | TERMINE | Endpoints racine, system/info et health en place |
| Technique | Configuration frontend/backend `/newNexus` | TERMINE | `PathBase` backend et `base` Vite configures |
| Technique | Configuration CORS initiale | TERMINE | Hotes cibles et locaux prepares |
| Technique | EF Core PostgreSQL | TERMINE | Branche dans `NewNexus.Data.Postgres` et `NewNexus.Api` |
| Technique | DbContext PostgreSQL | TERMINE | `NewNexusDbContext` cree |
| Technique | Premiere migration | TERMINE | `InitialSecuritySocle` generee |
| Technique | Application migration sur base locale | TERMINE | Base `NewNexus` creee et migree localement |
| Technique | Dashboard frontend branche a l'API socle | TERMINE | Lecture `system/info` et `security/bootstrap` |
| Technique | Script de publication IIS NewNexus | TERMINE | Script `publish_newnexus_iis.ps1` en place |
| Technique | Migration authentification | TERMINE | `AuthenticationBootstrap` generee et appliquee |

## 9. Hebergement et acces

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Hebergement | URL cible `http://192.168.60.158/newNexus` | CADRE | URL a supporter lors de la publication IIS |
| Hebergement | URL cible `http://192.168.50.102/newNexus` | CADRE | URL a supporter lors de la publication IIS |
| Hebergement | Publication sous repertoire virtuel `/newNexus` | SCAFFOLDE | Application configuree pour fonctionner sous ce chemin |
| Hebergement | Compatibilite acces HTTP cible | TERMINE | Redirection HTTPS forcee retiree du socle API |
| Hebergement | Publication IIS effective `Localaure/newNexus` | TERMINE | Application publiee et testee en HTTP |
| Hebergement | Exclusion rewrite parent pour `/newNexus` | TERMINE | Regle ajoutee dans `C:\inetpub\locatif\web.config` |

## 10. Base de donnees locale

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| PostgreSQL | Service moteur local | TERMINE | Service `postgresql-x64-18` detecte en etat `Running` |
| PostgreSQL | Client `psql` disponible dans le PATH | BLOQUE | Non detecte dans l'environnement courant |
| PostgreSQL | Base `NewNexus` locale | TERMINE | Base creee et objets `infra`/`security` verifies |
| PostgreSQL | Compte de travail valide | TERMINE | `postgres / legri00` fonctionne, `admin / legri00` echoue |
| PostgreSQL | Compte bootstrap applicatif | TERMINE | `admin` seedé avec profil `Informatique` |

## 8. Points ouverts

| Sujet | Statut | Commentaire |
|---|---|---|
| Creation des tiers particuliers et entreprises etrangeres via SIRENE | BLOQUE | SIRENE ne couvre pas ces cas, arbitrage necessaire |
| Existence d'un code metier societaire | A_DECIDER | Non tranche |
| Qualification `conducteur` depuis LUCCA ou mapping local | A_DECIDER | Non tranche |

