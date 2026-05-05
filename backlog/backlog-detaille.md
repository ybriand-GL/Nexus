# Backlog detaille NewNexus
Derniere mise a jour: 2026-05-05

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
| UX | Dashboard par profil | A_TESTER | Accueil, vues de travail et readiness diagnostics disponibles; personnalisation fine par profil a poursuivre apres recette |
| UX | Coque frontend premium initiale | TERMINE | Shell Nexus 4C integre et branche au socle |
| UX | Integration identite visuelle Nexus | TERMINE | Assets officiels SVG, palette graphite/champagne et tokens centralises appliques depuis le prompt Nexus |
| UX | Qualite accents et libelles UTF-8 | A_TESTER | Normalisation visible active; nouveaux ecrans ajoutes en libelles propres, nettoyage source historique complet a poursuivre |
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
| UX | Stabilisation cartes et textes | TERMINE | Regles anti-debordement ajoutees sur cartes, grilles et modales pour eviter chevauchements et textes sortants |
| UX | Corrections ergonomiques administration | TERMINE | Boutons de fermeture modales sombres, badges `Aucun` rouges et favicon Nexus verifie apres publication |
| Transverse | Outils cles API par logiciel | TERMINE | Import manuel retire de l'UI; liste regroupee a une carte par fournisseur logiciel |
| Transverse | Outils cles API en modal | TERMINE | Fonctionnement aligne sur Profils: liste des logiciels, bouton ajouter une cle et configuration en modale |
| UX | Maquettes UI haute fidelite | CADRE | Design system V1 et readiness diagnostics posent le cadre; captures haute fidelite a produire ensuite |
| UX | Design system NewNexus | A_TESTER | Document V1 enrichi avec inventaire composants et liste des captures de recette a produire |

## 3. Securite et droits

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Securite | Modele de droits V1 par module | TERMINE | Document redige |
| Securite | Profils V1 | TERMINE | Informatique, Direction, Exploitation, Administratif |
| Securite | Tables PostgreSQL securite | TERMINE | Migration `InitialSecuritySocle` generee |
| Securite | Entites domaine securite | TERMINE | `SecurityModule`, `SecurityProfile`, `SecurityProfileModuleRight`, `UserAccount` crees |
| Securite | Authentification applicative | TERMINE | Login/logout/me par cookie operationnels |
| Securite | Connexion SSO reelle | A_FAIRE | Brancher le bouton SSO sur le fournisseur d'identite Groupe Laure, gerer le retour d'authentification et le rattachement au compte NewNexus |
| Securite | Gestion des sessions | A_TESTER | Table `UserSession`, expiration par compte, suivi actif/historique et deconnexion forcee disponibles dans `Administration > Outils > Sessions` |
| Securite | Gestion des profils | A_TESTER | Creation, edition, suppression backend et UI de synthese disponibles; readiness diagnostics ajoutee |
| Securite | Gestion des comptes | A_TESTER | Lecture, creation, edition complete, activation, reset admin temporaire et delai de deconnexion automatique par compte disponibles; SSO et mot de passe oublie mail exclus de cette passe |
| Securite | Mot de passe oublie | EN_COURS | Demande utilisateur, jeton temporaire hashe, expiration, endpoint de reset et modale auth en place; envoi du lien a raccorder au service mail/SSO |
| Securite | Endpoints lecture modules/profils | TERMINE | `modules`, `profiles`, `bootstrap` exposes |
| Securite | Endpoint lecture comptes | TERMINE | `GET /api/security/accounts` expose |
| Securite | Endpoints creation / edition comptes | TERMINE | `POST /api/security/accounts` et `PUT /api/security/accounts/{id}` exposes |
| Securite | Changement de mot de passe | TERMINE | Endpoint utilisateur et ecran force `mustChangePassword` en place |
| Securite | Controle d'autorisation backend | A_TESTER | Policy `RequireInformatique` en place sur les endpoints administration/securite; tests automatises 401/403/200 a ajouter |
| Securite | Protection frontend par droits | TERMINE | Navigation et dashboard filtres selon les droits reels |
| Securite | Endpoint mise a jour profil compte | TERMINE | `PUT /api/security/accounts/{id}/profile` publie et teste |
| Securite | Endpoint activation / desactivation compte | TERMINE | `PUT /api/security/accounts/{id}/status` publie et teste |
| Securite | Ecran administration des comptes | A_TESTER | Vue dediee `Comptes utilisateurs` alignee sur `Profils`: cartes, configuration, creation, modales corrigees, bouton fermer sombre, cycle de vie, timeout session et reset admin temporaire |
| Securite | Endpoint creation profil | TERMINE | `POST /api/security/profiles` publie et teste |
| Securite | Endpoint mise a jour profil | TERMINE | `PUT /api/security/profiles/{id}` publie et teste |
| Securite | Endpoint suppression profil | TERMINE | `DELETE /api/security/profiles/{id}` publie et teste |
| Securite | Ecran administration des profils | A_TESTER | Vue synthese par profil, creation via modale, edition directe et etat vide en place |
| Securite | Ecran administration des parametres | A_TESTER | Mini-accueil Parametres, entrees separees, recherche SIRENE par SIREN et readiness diagnostics disponibles |
| Securite | Ecran administration des outils | A_TESTER | Diagnostics application, PostgreSQL, securite, parametres, readiness backlog, SIRENE, cles API, Taches planifiees, Requeteur SQL et Traces en place |
| UX | Sortie du mode tout-dashboard | A_TESTER | Navigation laterale reliee a des vues de travail distinctes; Administration, Parametres et Outils disposent d'accueils de choix |
| UX | Accueil par profil | A_TESTER | Entree `Accueil` retablie comme page d'arrivee; personnalisation fine par profil a approfondir apres recette |
| UX | Responsive tablette / smartphone / PC | A_TESTER | Passe CSS responsive initiale appliquee sur shell, menus, grilles, formulaires et modales; recette multi-format a effectuer |

## 4. Transverse

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Transverse | Schema transverse V1 | TERMINE | Document redige |
| Transverse | Societes Groupe Laure | A_TESTER | Tables, endpoints create/update, UI create/update, recherche SIRENE par SIREN et readiness diagnostics en place; enrichissement complet SIRENE a poursuivre |
| Transverse | Analytiques | A_TESTER | Tables, endpoints create/update, UI create/update et readiness diagnostics dans `Administration > Parametres` en place |
| Transverse | Exploitations | A_TESTER | Tables, endpoints create/update, UI create/update et readiness diagnostics dans `Administration > Parametres` en place |
| Transverse | Salaries | A_TESTER | Table, endpoints create/update et UI de creation/liste disponibles; import reel Lucca suspendu au contrat API |
| Transverse | Distinction conducteurs | A_TESTER | Champ local `IsDriver` ajoute au referentiel salaries; mapping definitif Lucca a arbitrer |
| Transverse | Creation auto des comptes depuis salaries | A_DEVELOPPER | Regle cadree: compte cree depuis Lucca sans droit tant qu'un profil NewNexus n'est pas affecte; depend de l'import salaries |
| Transverse | Tiers | A_TESTER | Table, endpoints create/update, UI de creation/liste et types de tiers disponibles; cas hors SIRENE a arbitrer |
| Transverse | Rattachement multi-analytiques des tiers | A_TESTER | Table de liaison tiers/analytiques et selection multiple UI disponibles |
| Transverse | Materiels | A_TESTER | Table, endpoints create/update, UI de creation/liste, numero de parc unique et rattachement exploitation disponibles |
| Transverse | Parametrage des interfaces | A_TESTER | Table `IntegrationCredential`, UI Outils, import des cles Nexus legacy et readiness par fournisseur disponibles |
| Transverse | Centre d'outils | TERMINE | Accueil Outils et sous-menus Sessions, Cles API, Taches planifiees, Requeteur SQL, Traces et Diagnostics prepares |
| Transverse | Taches planifiees | SCAFFOLDE | Vue de pilotage initiale preparee pour SIRENE, Lucca, provisioning comptes, materiels, TruckOnline, YellowBox et retention des traces; executeur et planification reelle a developper |
| Transverse | Requeteur SQL controle | SCAFFOLDE | Catalogue de requetes nommees prepare; execution SQL libre exclue, lecture seule et journalisation a developper avant activation |
| Transverse | Consultation des traces | SCAFFOLDE | Flux Authentification, Actions administrateur, Integrations et Erreurs applicatives prepares; collecte, stockage et masquage des secrets a developper |
| UX | Bandeaux titres applicatifs | TERMINE | Bloc lateral Session active retire visuellement et gabarit titre uniformise |

## 5. Interfaces

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Interfaces | SIRENE | A_TESTER | Creation societes et recherche SIRENE actives; readiness diagnostics ajoutee, enrichissement complet a poursuivre |
| Interfaces | LUCCA | A_DEVELOPPER | Parametres legacy importes, ecran Salaries, tache provisioning et readiness disponibles; client metier a raccorder apres validation contrat API |
| Interfaces | Truckonline | A_DEVELOPPER | Parametres et secrets legacy importes, ecran Materiels et readiness disponibles; client metier a raccorder apres validation contrat API |
| Interfaces | YellowBox | A_DEVELOPPER | Parametres et secrets legacy importes, ecran Materiels et readiness disponibles; client telematique a raccorder apres validation contrat API |
| Interfaces | Geocodage | A_DEVELOPPER | Emplacements Geoapify/Google et readiness disponibles; choix fournisseur et cle active a confirmer |
| Interfaces | Cartographie | A_DEVELOPPER | OpenStreetMap/Nominatim reference dans Outils et readiness disponible; raccord carte depend du modele des points |

## 6. Modules fonctionnels V1

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Module | Gestion des contraventions | SCAFFOLDE | Carte de cadrage visible dans `Gestion administrative`: objectif, donnees attendues, droit courant et prochaine etape |
| Module | Carte des points chargements/dechargements | SCAFFOLDE | Carte de cadrage visible dans `Exploitation`: points, geocodage, rattachements societes/exploitations et prochaine etape |
| Module | Les indicateurs conducteurs | SCAFFOLDE | Carte de cadrage visible dans `Exploitation`: donnees Lucca, qualification conducteur et indicateurs a definir |
| Module | Les indicateurs des tracteurs | SCAFFOLDE | Carte de cadrage visible dans `Exploitation`: donnees materiels, TruckOnline, YellowBox et modele parc a definir |

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
| Technique | Message base de donnees inaccessible | TERMINE | Middleware API `503 DATABASE_UNAVAILABLE` et affichage front du message serveur lorsque PostgreSQL est indisponible |
| Technique | Script de publication IIS NewNexus | TERMINE | Script `publish_newnexus_iis.ps1` en place |
| Technique | Migration authentification | TERMINE | `AuthenticationBootstrap` generee et appliquee |
| Technique | Migration transverse Parametres | TERMINE | `TransverseSettingsSocle` generee et appliquee |
| Technique | Migration cles integrations | TERMINE | `IntegrationCredentials` generee et appliquee |
| Technique | Migration referentiels metier transverses | TERMINE | `TransverseBusinessReferentials` generee et appliquee localement |
| Technique | Migration sessions utilisateurs | TERMINE | `UserSessionsAndTimeouts` generee et appliquee localement |
| Technique | Documentation integration branding | TERMINE | `docs/newnexus-brand-handoff-integration.md` ajoute |
| Technique | Endpoint diagnostics administration | TERMINE | `GET /api/admin/diagnostics` publie pour le profil Informatique |
| Technique | Import cles Nexus legacy | TERMINE | 22 valeurs importees depuis `LOCATIF_DEV` et rechiffrees avec le trousseau IIS NewNexus |

## 9. Hebergement et acces

| Domaine | Fonctionnalite | Statut | Commentaire |
|---|---|---|---|
| Hebergement | URL cible `http://192.168.60.158/newNexus` | A_TESTER | URL testee en HTTP, retour `200 text/html`; recette navigateur a faire |
| Hebergement | URL cible `http://192.168.50.102/newNexus` | A_TESTER | URL testee en HTTP, retour `200 text/html`; recette navigateur a faire |
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

