# NewNexus

## Cadrage UX V1

Date: 2026-04-29
Statut: cadrage initial

## 1. Objet

Ce document fixe la direction UX de `NewNexus`.

Le produit doit etre:

- plus premium que `Nexus`
- plus moderne que `Nexus`
- plus audacieux que `Nexus`
- tout en restant simple d'utilisation pour l'utilisateur final

Le but n'est pas de reproduire l'ergonomie actuelle avec un nouvel habillage.

Le but est de construire une experience plus claire, plus structurante et plus valorisante pour les usages metier.

## 2. Intention produit

`NewNexus` doit donner une impression de:

- maitrise
- lisibilite
- vitesse
- fiabilite
- modernite

L'interface ne doit pas etre simplement utilitaire.

Elle doit aussi:

- inspirer confiance
- rendre visibles les priorites
- mettre les bons indicateurs en avant
- eviter la surcharge visuelle inutile

## 3. Position UX generale

## 3.1 Ce que NewNexus ne doit pas etre

- un clone de `Nexus`
- une application grise et purement tabulaire
- une accumulation de formulaires et de listes sans hierarchie visuelle
- une interface technique pensee d'abord pour l'administration plutot que pour les usages quotidiens

## 3.2 Ce que NewNexus doit etre

- une application metier dense mais elegante
- une interface tres lisible malgre la richesse fonctionnelle
- une experience orientee tableaux de bord, synthese et passage rapide a l'action
- une interface qui assume une personnalite visuelle propre

## 4. Principes UX directeurs

## 4.1 Simplicite d'usage

La simplicite ne veut pas dire pauvrete fonctionnelle.

Elle veut dire:

- moins d'ambiguite
- moins de bruit
- moins de navigation inutile
- plus de reperes constants
- plus de priorisation visuelle

## 4.2 Densite maitrisée

L'application peut etre riche, mais la densite doit etre organisee.

Concretement:

- un ecran doit avoir un objectif principal clair
- les informations secondaires doivent etre visuellement hierarchisees
- les actions critiques doivent etre tres visibles
- les filtres et la recherche doivent etre fluides

## 4.3 Lecture rapide

L'utilisateur doit comprendre rapidement:

- ou il se trouve
- ce qui demande son attention
- ce qu'il peut faire maintenant
- ce qui est normal ou anormal

## 4.4 Navigation courte

Le nombre de clics n'est pas le seul critere, mais la navigation doit rester concise.

Il faut privilegier:

- acces direct aux modules utiles
- dashboards servant de hub
- drill-down progressif
- retour facile vers la synthese

## 4.5 Cohérence forte

Les memes conventions doivent etre retrouvees partout:

- filtres
- tableaux
- badges de statut
- cartes d'indicateurs
- panneaux de details
- actions principales / secondaires

## 5. Direction visuelle

## 5.1 Ambition visuelle

L'interface doit etre:

- premium
- contemporaine
- sobre mais pas fade
- audacieuse sans etre gadget

## 5.2 Traduction concrete

Cela implique:

- une typographie plus affirmee que dans `Nexus`
- des contrastes bien maitrises
- des cartes, blocs et tableaux nettement structures
- une palette de couleurs pensee pour la priorisation metier
- des respirations visuelles reelles
- un usage parcimonieux mais intentionnel de la couleur et du mouvement

## 5.3 Ce qu'il faut eviter

- le style back-office generique sans personnalite
- les interfaces surchargees de bordures, cadres et gris neutres partout
- les animations decoratives inutiles
- les ecrans uniformes ou sans point focal

## 6. Tableau de bord par profil

Le perimetre V1 inclut un tableau de bord adapte au profil de l'utilisateur.

C'est un point structurant du produit.

## 6.1 Role du tableau de bord

Le tableau de bord doit servir a:

- orienter l'utilisateur des l'ouverture
- afficher les priorites de son role
- presenter les indicateurs essentiels
- proposer des acces rapides vers ses modules utiles

## 6.2 Principe

Le dashboard n'est pas le meme selon le profil.

Il faut au minimum adapter:

- le contenu
- les indicateurs exposes
- les raccourcis d'action
- les alertes et blocs mis en avant

## 6.3 Dashboards V1 attendus

### Profil `Informatique`

Le dashboard doit mettre en avant:

- etat des interfaces
- alertes techniques
- statut des synchronisations
- acces rapides administration
- comptes, profils, parametres, outils

### Profil `Direction`

Le dashboard doit mettre en avant:

- vision synthetique globale
- indicateurs conducteurs
- indicateurs tracteurs
- carte / couverture activite
- alertes majeures
- acces directs vers consultation transverse

### Profil `Exploitation`

Le dashboard doit mettre en avant:

- indicateurs conducteurs du jour / semaine / mois
- indicateurs tracteurs essentiels
- carte des points chargements / dechargements
- alertes operationnelles
- acces rapides vers vues terrain

### Profil `Administratif`

Le dashboard doit mettre en avant:

- file de traitement contraventions
- dossiers en attente
- echeances proches
- actions rapides sur la gestion administrative

## 7. Navigation cible V1

## 7.1 Navigation principale

Entrees principales:

- `Administration`
- `Exploitation`
- `Gestion administrative`

Ordre:

- toujours alphabetique

## 7.2 Comportement attendu

La navigation doit:

- rester tres lisible
- montrer uniquement ce qui est utile au profil
- eviter les menus surcharges
- maintenir une stabilite de structure d'un ecran a l'autre

## 7.3 Entree par dashboard

A la connexion:

- l'utilisateur arrive d'abord sur son tableau de bord
- la navigation laterale permet ensuite d'acceder aux modules autorises

## 8. Typologie d'ecrans a privilegier

## 8.1 Dashboards

Structure recommandee:

- bandeau de contexte
- cartes KPI principales
- bloc alertes
- bloc actions rapides
- bloc visualisation secondaire

## 8.2 Ecrans liste / pilotage

Structure recommandee:

- titre clair
- resume de contexte ou KPI de tete
- barre de filtres bien visible
- tableau principal
- panneau de details ou tiroir contextuel si utile

## 8.3 Ecrans cartographiques

Structure recommandee:

- carte dominante
- liste ou synthese laterale
- filtres simples et visibles
- capacite a passer vite du global au point detaille

## 8.4 Ecrans de traitement administratif

Structure recommandee:

- file ou liste de travail
- niveau d'urgence visible
- detail de dossier accessible sans rupture excessive
- actions metier claires et limitees a l'essentiel

## 9. Parcours prioritaires V1

Les parcours a designer en premier doivent etre:

1. connexion puis arrivee sur dashboard adapte au profil
2. consultation des indicateurs conducteurs
3. consultation des indicateurs tracteurs
4. usage de la carte des points chargements / dechargements
5. traitement d'une contravention
6. administration des profils, comptes et interfaces

## 10. Regles d'ergonomie communes

## 10.1 Filtres

- visibles sans effort
- nombre limite en affichage initial
- possibilite d'etendre si necessaire
- etat des filtres toujours comprehensible

## 10.2 Tableaux

- colonnes utiles uniquement
- tri et recherche fluides
- priorite au scan visuel
- details secondaires deports si besoin dans un panneau

## 10.3 Indicateurs

- peu nombreux mais bien choisis en tete d'ecran
- codes couleur stables
- ecarts, alertes et tendances visibles rapidement

## 10.4 Actions

- une action principale par ecran
- actions secondaires clairement separees
- suppression des boutons redondants ou ambigus

## 11. Experience mobile et responsive

Le produit restera principalement orienté poste de travail, mais il doit rester utilisable sur largeur reduite.

Cela implique:

- dashboards qui se recomposent proprement
- tableaux qui degradent intelligemment
- filtres qui restent accessibles
- cartes utilisables sans rupture majeure

## 12. Decisions prises a ce stade

- `NewNexus` vise une ergonomie premium, moderne et audacieuse
- la simplicite d'usage reste une contrainte forte
- un tableau de bord par profil fait partie du perimetre V1
- la navigation V1 part d'un dashboard et non d'une simple liste de menus
- l'ergonomie doit etre repensee, pas habillee sur base `Nexus`

## 13. Prochaine etape recommandee

Le prochain livrable UX utile est:

- `newnexus-wireframes-v1.md`

Il devra decrire les wireframes cibles de:

- dashboard `Direction`
- dashboard `Exploitation`
- ecran `Gestion des contraventions`
- ecran `Les indicateurs conducteurs`
- ecran `Les indicateurs des tracteurs`
- ecran `Carte des points chargements/déchargements`
