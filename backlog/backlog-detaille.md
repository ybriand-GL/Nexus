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

## 2. UX et produit

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| UX | Cadrage UX V1 | TERMINE | Document redige |
| UX | Wireframes V1 | TERMINE | Document redige |
| UX | Dashboard par profil | CADRE | Inclus dans le perimetre V1 |
| UX | Maquettes UI haute fidelite | A_FAIRE | Etape ulterieure |
| UX | Design system NewNexus | A_FAIRE | A concevoir apres scaffold |

## 3. Securite et droits

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Securite | Modele de droits V1 par module | TERMINE | Document redige |
| Securite | Profils V1 | TERMINE | Informatique, Direction, Exploitation, Administratif |
| Securite | Tables PostgreSQL securite | CADRE | Decrites dans le schema V1 |
| Securite | Authentification applicative | A_DEVELOPPER | A implementer dans `socle` |
| Securite | Gestion des sessions | A_DEVELOPPER | A implementer dans `socle` |
| Securite | Gestion des profils | A_DEVELOPPER | A implementer dans `socle` |
| Securite | Gestion des comptes | A_DEVELOPPER | A implementer dans `socle` |
| Securite | Controle d'autorisation backend | A_DEVELOPPER | A implementer dans `socle` |
| Securite | Protection frontend par droits | A_DEVELOPPER | A implementer dans `socle` |

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
| Technique | EF Core PostgreSQL | A_FAIRE | A brancher apres scaffold |
| Technique | Premiere migration | A_FAIRE | Apres modelisation |

## 8. Points ouverts

| Sujet | Statut | Commentaire |
|---|---|---|
| Creation des tiers particuliers et entreprises etrangeres via SIRENE | BLOQUE | SIRENE ne couvre pas ces cas, arbitrage necessaire |
| Existence d'un code metier societaire | A_DECIDER | Non tranche |
| Qualification `conducteur` depuis LUCCA ou mapping local | A_DECIDER | Non tranche |

