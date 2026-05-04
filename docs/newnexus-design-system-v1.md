# Design system NewNexus V1

## Objectif

Ce document fixe les regles UI applicables aux ecrans NewNexus pendant la construction du socle et des modules V1.

La reference visuelle reste l'identite Nexus premium sombre validee. Les ecrans doivent rester coherents avec les assets officiels, les tokens frontend et la maquette d'authentification validee.

## Sources de verite

- Assets logo:
  - `NewNexus.Web/src/assets/brand/nexus_icon_figma_clean.svg`
  - `NewNexus.Web/src/assets/brand/nexus_wordmark_figma_clean.svg`
- Tokens applicatifs:
  - `NewNexus.Web/src/styles/nexus-theme.css`
  - `NewNexus.Web/src/assets/brand/nexus/04_codex/design-tokens.css`
  - `NewNexus.Web/src/assets/brand/nexus/04_codex/design-tokens.json`
- Reference auth:
  - `identite visuelle/preview_nexus_premium_v5_figma_sso.html`

## Couleurs

Les surfaces utilisent un fond sombre premium, jamais de bloc blanc dans l'application connectee.

Tokens principaux:

- Fond profond: `--nexus-bg-deep`
- Fond nuit: `--nexus-bg-night`
- Surface carte: `--nexus-bg-card`
- Ligne discrete: `--nexus-line`
- Ligne champagne: `--nexus-line-gold`
- Accent principal: `--nexus-gold`
- Accent doux: `--nexus-gold-soft`
- Texte principal: `--nexus-text`
- Texte secondaire: `--nexus-text-muted`

Regles:

- le champagne sert a guider l'attention, pas a colorer massivement les pages
- les fonds doivent garder du contraste et de la profondeur
- les anciens violets, parmes et blancs applicatifs sont interdits hors contenus externes

## Typographie

La typographie doit rester sobre, lisible et metier.

Regles:

- titres de page: hauteur et respiration identiques entre Accueil, Administration, Exploitation et Gestion administrative
- titres de cartes: courts, actionnables, sans phrase longue
- textes d'aide: une ou deux lignes maximum sur les cartes de synthese
- libelles visibles: accents francais obligatoires en rendu utilisateur

## Layout applicatif

Le gabarit connecte repose sur trois niveaux:

- shell lateral: navigation principale, statut utilisateur, horloge
- bandeau titre: contexte de page, description courte, version uniquement sur Administration
- espace de travail: cartes, listes, formulaires et sous-menus

Regles:

- chaque menu principal doit conserver le meme volume visuel de bandeau titre
- les grilles se replient proprement sur tablette et mobile
- les sous-menus servent a eviter les pages fourre-tout
- les blocs doivent absorber les textes longs sans chevauchement ni debordement

## Cartes et surfaces

Les cartes applicatives utilisent:

- fond verre fume sombre
- bord subtil champagne ou blanc faible
- ombre douce
- rayon genereux
- espacement interne constant

Regles:

- une carte ne doit pas devenir une table de donnees dense
- les actions principales restent visibles en bas ou en haut de carte
- les etats vides doivent toujours proposer la prochaine action utile

## Boutons

Trois intentions sont retenues:

- principal: creation, ajout, action majeure
- secondaire: configurer, modifier, ouvrir
- destructif: suppression ou action irreversible, a utiliser avec confirmation

Regles:

- un ecran ne doit pas presenter plusieurs actions principales concurrentes
- les boutons de configuration doivent garder un libelle explicite
- les actions techniques non actives doivent etre marquees comme a raccorder ou a developper

## Formulaires et modales

Regles:

- les formulaires complexes passent en modale lorsqu'ils interrompent une liste ou une synthese
- les champs ne doivent jamais etre blancs dans l'application connectee
- les modales doivent etre scrollables sur petits ecrans
- les champs obligatoires et erreurs doivent etre comprehensibles sans message technique brut

## Administration

Administration conserve un mini-accueil avant l'acces aux sous-rubriques.

Sous-rubriques actuelles:

- Comptes utilisateurs
- Profils
- Parametres
- Outils

Regles:

- Comptes utilisateurs et Profils partagent le meme fonctionnement visuel: liste, configuration, ajout
- Parametres et Outils disposent chacun d'un accueil dedie puis de sous-menus
- la version applicative n'apparait que dans Administration

## Outils

Le centre d'outils doit rester extensible.

Sous-rubriques actuelles:

- Cles API
- Taches planifiees
- Requeteur SQL
- Traces
- Diagnostics

Regles:

- les cles API sont presentees par logiciel, une carte par fournisseur
- aucune mention de source legacy ne doit etre visible pour l'utilisateur
- les outils non raccordes doivent expliciter leur cadre et leur prochaine etape
- le requeteur SQL reste controle: requetes nommees, lecture seule, journalisation

## Responsive

Seuils cibles:

- desktop: navigation laterale complete, grilles multi-colonnes
- tablette: sidebar repliee en haut, grilles adaptees
- mobile: une colonne, modales contraintes, boutons empiles

Regles:

- aucun texte ne doit sortir d'une carte
- aucun bouton ne doit etre inaccessible horizontalement
- les modales doivent rester utilisables sans zoom

## Etats et messages

Etats standards:

- actif / inactif
- configure / non renseigne
- a raccorder
- a developper
- erreur fonctionnelle
- erreur technique masquee par un message comprehensible

Regles:

- une base indisponible doit afficher un message utilisateur clair
- les erreurs JSON/HTML brutes ne doivent jamais etre exposees
- les secrets et donnees personnelles ne doivent pas apparaitre dans les traces UI

## Definition of done UI

Un ecran est acceptable lorsque:

- il respecte le fond sombre premium
- il utilise les tokens existants
- les titres et blocs sont alignes avec les autres menus
- les libelles visibles sont lisibles en francais
- les cartes ne se chevauchent pas
- le responsive est utilisable sur tablette et mobile
- le contexte et le backlog sont mis a jour
- la publication IIS a ete verifiee
