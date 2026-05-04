# Backlog detaille NewNexus
Derniere mise a jour: 2026-05-04

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
| UX | Dashboard par profil | EN_COURS | Remplace progressivement par des vues de travail par entree, personnalisation a poursuivre |
| UX | Coque frontend premium initiale | TERMINE | Shell Nexus 4C integre et branche au socle |
| UX | Integration identite visuelle Nexus | TERMINE | Assets officiels SVG, palette graphite/champagne et tokens centralises appliques depuis le prompt Nexus |
| UX | Qualite accents et libelles UTF-8 | EN_COURS | Vigilance explicite, handoff de marque et ecrans critiques verifies |
| UX | Tokens officiels du handoff | TERMINE | `nexus-theme.css`, `design-tokens.css` et `design-tokens.json` alignes sur l'identite Nexus sombre |
| UX | Animation post-authentification | TERMINE | Transition `Groupe Laure × Nexus` integree, affichage unique après login |
| UX | Favicon et identite navigateur | TERMINE | Icônes 16/32/180/192/512 et manifest publies |
| UX | Page d'authentification premium | TERMINE | Auth sombre Nexus officielle, SVG propres, SSO visuel principal et acces exceptionnel publies |
| UX | Authentification SSO visuelle | TERMINE | Bouton SSO entreprise Groupe Laure place en action principale; raccord technique SSO reel a traiter separement |
| UX | Audit zero violet/parme | TERMINE | Sources frontend et assets publics Nexus nettoyes des anciens violets et couleurs saturees historiques |
| UX | Reprise stricte maquette Figma SSO | TERMINE | Connexion recalee sur `preview_nexus_premium_v5_figma_sso.html` avec SVG `nexus_icon_figma_clean.svg` et `nexus_wordmark_figma_clean.svg` exacts |
| UX | Corrections recette authentification et surfaces sombres | TERMINE | Champs vides, oeil mot de passe, vagues animees, transition post-auth, horloge sidebar et blocs internes sombres |
| UX | Alignement final auth Figma et sortie loader | TERMINE | `GROUPE LAURE • NEXUS` replace au-dessus du lockup, libelle parasite supprime, cinq vagues SVG et sortie post-auth securisee |
| UX | Harmonisation gabarits et menus sombres | TERMINE | Auth recalibree sur les proportions finales de la maquette, sous-menus administration sombres et blocs principaux uniformises entre entrees |
| UX | Verrouillage bandeaux titres | TERMINE | Hauteur et grille interne des titres de pages uniformisees entre Accueil, Administration, Exploitation et Gestion administrative |
| Transverse | Outils cles API par logiciel | TERMINE | Import manuel retire de l'UI; liste regroupee a une carte par fournisseur logiciel |
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
| Securite | Gestion des profils | EN_COURS | Creation, edition et suppression backend en place, finalisation UI a poursuivre |
| Securite | Gestion des comptes | EN_COURS | Lecture, creation, edition complete et changement de mot de passe utilisateur disponibles; recuperation mot de passe oublie a cadrer |
| Securite | Endpoints lecture modules/profils | TERMINE | `modules`, `profiles`, `bootstrap` exposes |
| Securite | Endpoint lecture comptes | TERMINE | `GET /api/security/accounts` expose |
| Securite | Endpoints creation / edition comptes | TERMINE | `POST /api/security/accounts` et `PUT /api/security/accounts/{id}` exposes |
| Securite | Changement de mot de passe | TERMINE | Endpoint utilisateur et ecran force `mustChangePassword` en place |
| Securite | Controle d'autorisation backend | EN_COURS | Policy `RequireInformatique` en place sur les endpoints securite |
| Securite | Protection frontend par droits | TERMINE | Navigation et dashboard filtres selon les droits reels |
| Securite | Endpoint mise a jour profil compte | TERMINE | `PUT /api/security/accounts/{id}/profile` publie et teste |
| Securite | Endpoint activation / desactivation compte | TERMINE | `PUT /api/security/accounts/{id}/status` publie et teste |
| Securite | Ecran administration des comptes | EN_COURS | Vue dediee `Comptes utilisateurs` alignee sur `Profils`: cartes, configuration, creation, modales corrigees, etats vides et alerte sans profil |
| Securite | Endpoint creation profil | TERMINE | `POST /api/security/profiles` publie et teste |
| Securite | Endpoint mise a jour profil | TERMINE | `PUT /api/security/profiles/{id}` publie et teste |
| Securite | Endpoint suppression profil | TERMINE | `DELETE /api/security/profiles/{id}` publie et teste |
| Securite | Ecran administration des profils | EN_COURS | Vue synthese par profil, creation via modale, edition directe et etat vide en place |
| Securite | Ecran administration des parametres | EN_COURS | Mini-accueil Parametres, entrees separees et recherche SIRENE par SIREN pour pre-remplir les societes |
| Securite | Ecran administration des outils | EN_COURS | Diagnostics application, PostgreSQL, securite, parametres, SIRENE et gestion des cles API en place |
| UX | Sortie du mode tout-dashboard | EN_COURS | Navigation laterale reliee a des vues de travail distinctes; Administration et Parametres disposent maintenant d'accueils de choix |
| UX | Accueil par profil | EN_COURS | Entree `Accueil` retablie comme page d'arrivee; personnalisation par profil a approfondir |
| UX | Responsive tablette / smartphone / PC | A_PLANIFIER | Base responsive presente, passe de finition multi-format a planifier avant finalisation des modules |

## 4. Transverse

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Transverse | Schema transverse V1 | TERMINE | Document redige |
| Transverse | Societes Groupe Laure | EN_COURS | Tables, endpoints create/update, UI create/update et recherche SIRENE par SIREN en place; enrichissement complet SIRENE a poursuivre |
| Transverse | Analytiques | EN_COURS | Tables, endpoints create/update et UI create/update dans `Administration > Parametres` en place |
| Transverse | Exploitations | EN_COURS | Tables, endpoints create/update et UI create/update dans `Administration > Parametres` en place |
| Transverse | Salaries | CADRE | Source unique LUCCA |
| Transverse | Distinction conducteurs | CADRE | A porter dans le modele local |
| Transverse | Creation auto des comptes depuis salaries | CADRE | Compte sans droit a l'import |
| Transverse | Tiers | CADRE | Multi-types, details a completer plus tard |
| Transverse | Rattachement multi-analytiques des tiers | CADRE | Table de liaison prevue |
| Transverse | Materiels | CADRE | Import, numero de parc unique |
| Transverse | Parametrage des interfaces | EN_COURS | Table `IntegrationCredential`, UI Outils et import des cles Nexus legacy en place |

## 5. Interfaces

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Interfaces | SIRENE | EN_COURS | Creation societes active; client ID legacy importe dans les cles API |
| Interfaces | LUCCA | EN_COURS | Parametres legacy importes; integration metier salaries a porter |
| Interfaces | Truckonline | EN_COURS | Parametres et secrets legacy importes; integration metier a porter |
| Interfaces | YellowBox | EN_COURS | Parametres et secrets legacy importes; integration metier a porter |
| Interfaces | Geocodage | EN_COURS | Emplacements Geoapify/Google disponibles dans Outils; aucune valeur legacy renseignee detectee |
| Interfaces | Cartographie | EN_COURS | OpenStreetMap/Nominatim reference dans Outils; pas de cle legacy requise detectee |

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
| Technique | Migration transverse Parametres | TERMINE | `TransverseSettingsSocle` generee et appliquee |
| Technique | Migration cles integrations | TERMINE | `IntegrationCredentials` generee et appliquee |
| Technique | Documentation integration branding | TERMINE | `docs/newnexus-brand-handoff-integration.md` ajoute |
| Technique | Endpoint diagnostics administration | TERMINE | `GET /api/admin/diagnostics` publie pour le profil Informatique |
| Technique | Import cles Nexus legacy | TERMINE | 22 valeurs importees depuis `LOCATIF_DEV` et rechiffrees avec le trousseau IIS NewNexus |

## 9. Hebergement et acces

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Hebergement | URL cible `http://192.168.60.158/newNexus` | CADRE | URL a supporter lors de la publication IIS |
| Hebergement | URL cible `http://192.168.50.102/newNexus` | CADRE | URL a supporter lors de la publication IIS |
| Hebergement | Publication sous repertoire virtuel `/newNexus` | SCAFFOLDE | Application configuree pour fonctionner sous ce chemin |
| Hebergement | Compatibilite acces HTTP cible | TERMINE | Redirection HTTPS forcee retiree du socle API |
| Hebergement | Compatibilite URL `/newNexus` sans slash final | TERMINE | Appels API frontend construits avec le base path Vite absolu pour eviter les retours HTML du site parent |
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

