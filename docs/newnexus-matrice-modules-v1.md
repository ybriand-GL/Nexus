# NewNexus

## Matrice des modules V1

Date: 2026-04-29
Statut: proposition de travail

## 1. Objet

Ce document fixe pour la V1:

- les modules fonctionnels retenus
- leur libelle d'affichage
- leur code fonctionnel
- leur rattachement a la navigation
- la regle d'ordre alphabetique a appliquer dans les menus

## 2. Regles globales de navigation

### 2.1 Entrees principales prevues

Pour la V1, la navigation doit exposer 3 entrees principales:

- `Administration`
- `Exploitation`
- `Gestion administrative`

### 2.2 Regle d'ordre alphabetique

Les menus et sous-menus doivent toujours etre affiches par ordre alphabetique.

Cette regle s'applique a:

- la navigation principale
- les sous-menus
- les listes de modules d'administration

En V1, l'ordre d'affichage attendu des 3 entrees principales est donc:

1. `Administration`
2. `Exploitation`
3. `Gestion administrative`

## 3. Modules fonctionnels V1

## 3.1 Liste des modules

### Module 1

- code: `CONTRAVENTIONS`
- libelle: `Gestion des contraventions`
- entree de navigation: `Gestion administrative`

### Module 2

- code: `CARTE_CHARGEMENT_DECHARGEMENT`
- libelle: `Carte des points chargements/déchargements`
- entree de navigation: `Exploitation`

### Module 3

- code: `INDICATEURS_CONDUCTEURS`
- libelle: `Les indicateurs conducteurs`
- entree de navigation: `Exploitation`

### Module 4

- code: `INDICATEURS_TRACTEURS`
- libelle: `Les indicateurs des tracteurs`
- entree de navigation: `Exploitation`

## 4. Rattachement navigation par ordre alphabetique

## 4.1 Administration

A ce stade, aucun module metier V1 n'est encore rattache explicitement a `Administration` dans ce document.

Cette entree est reservee pour:

- profils
- comptes
- modules
- parametres
- interfaces
- outils

L'ordre alphabetique devra s'appliquer quand ces sous-entrees seront precisees.

## 4.2 Exploitation

Sous-entrees V1 en ordre alphabetique:

1. `Carte des points chargements/déchargements`
2. `Les indicateurs conducteurs`
3. `Les indicateurs des tracteurs`

## 4.3 Gestion administrative

Sous-entrees V1 en ordre alphabetique:

1. `Gestion des contraventions`

## 5. Lien avec le modele de droits

Chaque module de cette matrice doit etre gere dans le modele de droits V1 avec les niveaux:

- `Aucun`
- `Lecture`
- `Ecriture`

Cela signifie qu'un profil devra definir un niveau pour chacun des codes suivants:

- `CONTRAVENTIONS`
- `CARTE_CHARGEMENT_DECHARGEMENT`
- `INDICATEURS_CONDUCTEURS`
- `INDICATEURS_TRACTEURS`

## 6. Regles frontend

Le frontend devra respecter les principes suivants:

- une entree de menu n'apparait que si au moins un module visible en `Lecture` ou `Ecriture` est accessible dans cette branche
- l'ordre alphabetique doit etre applique apres filtrage par droits
- un module sans droit `Lecture` ne doit pas apparaitre dans la navigation standard
- un module en `Lecture` doit ouvrir les ecrans en consultation uniquement
- un module en `Ecriture` doit autoriser les actions de modification du module

## 7. Regles backend

Le backend doit lier chaque endpoint a un module fonctionnel unique.

Exemples de rattachement attendus:

- endpoints contraventions -> `CONTRAVENTIONS`
- endpoints carte de flux / chargement / dechargement -> `CARTE_CHARGEMENT_DECHARGEMENT`
- endpoints indicateurs conducteurs -> `INDICATEURS_CONDUCTEURS`
- endpoints indicateurs / suivi tracteurs -> `INDICATEURS_TRACTEURS`

## 8. Tables impactees

Cette matrice suppose au minimum l'alimentation des tables de securite V1:

- `SecurityModule`
- `SecurityProfile`
- `SecurityProfileModuleRight`

Chaque module ci-dessus devra exister dans `SecurityModule` avec:

- son `Code`
- son `Libelle`
- son ordre d'affichage
- sa branche de navigation

## 9. Decisions prises dans ce document

- navigation principale V1 limitee a 3 entrees
- ordre alphabetique obligatoire partout
- `Gestion administrative` est l'entree de rattachement de `Gestion des contraventions`
- `Exploitation` regroupe la carte et les indicateurs operationnels
- les modules V1 retenus sont figes a ce stade a 4 modules fonctionnels

## 10. Prochaine etape recommandee

Le prochain document a produire est:

- `newnexus-profils-v1.md`

Il devra proposer les premiers profils standards, par exemple:

- super administrateur
- administrateur
- exploitation lecture
- exploitation edition
- gestion administrative lecture
- gestion administrative edition
