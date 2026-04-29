# NewNexus

## Wireframes V1

Date: 2026-04-29
Statut: cadrage UX fonctionnel

## 1. Objet

Ce document decrit les wireframes de cadrage V1 de `NewNexus`.

Il ne s'agit pas de maquettes graphiques finales.

Le but est de fixer:

- la structure des ecrans
- la hierarchie des blocs
- la priorite des informations
- les interactions principales

## 2. Principes communs d'ecran

Chaque ecran `NewNexus` doit suivre une structure stable.

Ordre recommande des blocs:

1. bandeau de contexte
2. indicateurs ou resume rapide
3. filtres / recherche
4. contenu principal
5. detail contextuel ou actions secondaires

Regles communes:

- une action principale visible
- peu de bruit dans l'en-tete
- les blocs critiques doivent apparaitre au-dessus de la ligne de flottaison sur desktop
- les filtres doivent rester lisibles et rapides a utiliser

## 3. Shell applicatif V1

## 3.1 Structure generale

Wireframe de principe:

- colonne gauche: navigation principale
- barre haute: contexte utilisateur + recherche + actions globales
- zone centrale: page courante
- eventuel panneau droit: detail / aide / contexte dynamique selon ecran

## 3.2 Navigation laterale

Contenu:

- logo / marque `NewNexus`
- dashboard
- entrees principales autorisees selon profil

Ordre alphabetique obligatoire:

- `Administration`
- `Exploitation`
- `Gestion administrative`

## 3.3 Barre haute

Contenu recommande:

- titre de page
- sous-titre ou fil d'Ariane tres discret
- champ de recherche global futur si utile
- avatar / profil utilisateur
- acces rapide aux notifications ou alertes

## 4. Dashboard `Direction`

## 4.1 Objectif

Donner une lecture globale immediate de la situation.

## 4.2 Structure

### Bloc 1 - Hero de synthese

En haut:

- titre `Tableau de bord Direction`
- sous-texte date / perimetre de lecture
- resume tres court du type `4 alertes a traiter, 2 modules en vigilance`

### Bloc 2 - KPI prioritaires

Rangee de cartes premium:

- `Indicateurs conducteurs`
- `Indicateurs tracteurs`
- `Contraventions en cours`
- `Points charges/decharges suivis`

Ces cartes doivent etre tres lisibles et comparables.

### Bloc 3 - Alertes majeures

Bloc large avec:

- liste courte des alertes prioritaires
- niveau de gravite
- lien `Voir le detail`

### Bloc 4 - Vue visuelle dominante

Au centre:

- carte ou visualisation synthese de l'activite

### Bloc 5 - Acces rapides

Sous forme de cartes ou boutons:

- `Gestion des contraventions`
- `Les indicateurs conducteurs`
- `Les indicateurs des tracteurs`
- `Carte des points chargements/déchargements`

## 5. Dashboard `Exploitation`

## 5.1 Objectif

Donner une vision terrain tres directe et operationnelle.

## 5.2 Structure

### Bloc 1 - Hero de contexte

- titre `Tableau de bord Exploitation`
- date du jour / plage en cours
- resume d'attention immediate

### Bloc 2 - KPI terrain

Cartes en tete:

- conducteurs suivis
- tracteurs suivis
- alertes exploitation
- points actifs sur la carte

### Bloc 3 - Carte principale

Bloc dominant de la page:

- carte large
- points charges / decharges
- etat visuel rapide
- interaction directe avec selection

### Bloc 4 - Liste d'attention

A droite ou sous la carte:

- tracteurs a surveiller
- anomalies conducteurs
- points ou flux a verifier

### Bloc 5 - Actions rapides

- `Ouvrir les indicateurs conducteurs`
- `Ouvrir les indicateurs des tracteurs`
- `Ouvrir la carte`

## 6. Dashboard `Administratif`

## 6.1 Objectif

Transformer le dashboard en file de travail lisible.

## 6.2 Structure

### Bloc 1 - Hero

- titre `Tableau de bord Gestion administrative`
- sous-texte `Suivi des contraventions`

### Bloc 2 - KPI de traitement

- dossiers a traiter
- echeances proches
- dossiers en retard
- dossiers clotures periode

### Bloc 3 - File de priorite

Liste ou tableau court avec:

- dossier
- conducteur
- etat
- urgence
- prochaine action

### Bloc 4 - Raccourcis

- `Nouvelle recherche`
- `Ouvrir les dossiers en retard`
- `Ouvrir tous les dossiers`

## 7. Dashboard `Informatique`

## 7.1 Objectif

Donner une vision d'exploitation technique simple, pas une console confuse.

## 7.2 Structure

### Bloc 1 - Hero

- titre `Tableau de bord Administration`
- resume des etats systeme

### Bloc 2 - KPI techniques

- interfaces actives
- synchronisations en erreur
- comptes sans profil
- alertes systeme

### Bloc 3 - Etat des interfaces

Cartes ou tableau synthese:

- Lucca
- SIRENE
- Truckonline
- YellowBox
- Geocoding
- Cartography

Pour chaque interface:

- statut
- derniere synchro
- dernier incident

### Bloc 4 - Actions rapides

- `Comptes`
- `Profils`
- `Modules`
- `Interfaces`
- `Parametres`
- `Outils`

## 8. Ecran `Gestion des contraventions`

## 8.1 Objectif

Traiter les contraventions sans perdre la vue d'ensemble.

## 8.2 Structure

### Bandeau haut

- titre `Gestion des contraventions`
- resume quantifie
- bouton principal eventuel

### Bloc KPI

- en attente
- echeance proche
- en retard
- cloturees

### Bloc filtres

Filtres visibles:

- statut
- periode
- conducteur
- societe
- recherche libre

### Bloc principal

Tableau de travail dense mais lisible:

- numero dossier
- date
- conducteur
- societe
- statut
- urgence
- prochaine action

### Bloc detail

Au clic sur une ligne:

- panneau lateral ou tiroir detail
- informations du dossier
- historique
- actions de traitement

## 9. Ecran `Les indicateurs conducteurs`

## 9.1 Objectif

Offrir une vue de pilotage conducteur claire et actionnable.

## 9.2 Structure

### Bandeau haut

- titre `Les indicateurs conducteurs`
- periode active
- perimetre de lecture

### Bloc KPI

- nombre de conducteurs suivis
- indicateurs critiques
- conducteurs en alerte
- evolution periode

### Bloc filtres

- societe
- exploitation
- conducteur
- periode
- niveau d'alerte

### Bloc principal

Tableau premium de pilotage:

- conducteur
- societe
- poste / statut
- indicateur principal
- tendance
- alerte

### Bloc detail

Au clic:

- panneau de detail conducteur
- resume du mois / semaine / jour
- eventuels liens vers flux ou anomalies

## 10. Ecran `Les indicateurs des tracteurs`

## 10.1 Objectif

Donner une vision lisible du parc et des anomalies prioritaires.

## 10.2 Structure

### Bandeau haut

- titre `Les indicateurs des tracteurs`
- date de reference

### Bloc KPI

- tracteurs suivis
- tracteurs en alerte
- donnees fraiches / non fraiches
- anomalies critiques

### Bloc filtres

- societe
- analytique
- exploitation
- type / statut
- recherche numero de parc

### Bloc principal

Tableau de pilotage:

- numero de parc
- libelle
- exploitation
- indicateur cle
- fraicheur
- etat

### Bloc detail

Au clic:

- detail tracteur
- position
- indicateurs associes
- historique recent si disponible

## 11. Ecran `Carte des points chargements/déchargements`

## 11.1 Objectif

Mettre la carte au centre de l'experience, pas comme un widget secondaire.

## 11.2 Structure

### Bandeau haut

- titre `Carte des points chargements/déchargements`
- resume de perimetre

### Bloc filtres horizontal compact

- societe
- analytique
- exploitation
- type de point
- recherche adresse / code / ville

### Bloc principal

La carte occupe l'essentiel de l'ecran.

### Bloc lateral gauche ou droit

Liste synchronisee avec la carte:

- points
- volume / frequence si disponible
- statut ou nature

### Interaction attendue

- survol liste -> mise en avant sur la carte
- clic carte -> detail point
- clic liste -> recentrage carte

### Bloc detail point

Dans un panneau:

- informations adresse
- rattachements
- liens utiles

## 12. Comportements de navigation entre ecrans

Regles recommandees:

- un dashboard mene rapidement a un module detaille
- un module detaille doit offrir un retour simple au dashboard
- les filtres structurants peuvent etre conserves dans la session si pertinent
- les vues carte et liste doivent dialoguer entre elles

## 13. Priorite de conception

Ordre recommande pour la suite UX:

1. dashboard `Direction`
2. dashboard `Exploitation`
3. ecran `Les indicateurs des tracteurs`
4. ecran `Les indicateurs conducteurs`
5. ecran `Carte des points chargements/déchargements`
6. ecran `Gestion des contraventions`
7. dashboard `Administratif`
8. dashboard `Informatique`

## 14. Suite recommandee

Deux suites possibles a partir de ce document:

1. produire de vraies maquettes UI
2. lancer le squelette technique en gardant ces wireframes comme reference

Recommandation:

- figer encore un cran les maquettes des dashboards et de 2 ecrans cle avant d'ouvrir le chantier frontend
