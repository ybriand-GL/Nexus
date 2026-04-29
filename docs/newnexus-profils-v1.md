# NewNexus

## Profils V1

Date: 2026-04-29
Statut: proposition de travail

## 1. Objet

Ce document fixe les profils standards V1 de `NewNexus` et leur traduction en droits par module.

Les niveaux de droit possibles sont:

- `Aucun`
- `Lecture`
- `Ecriture`

## 2. Modules de reference V1

Les modules pris en compte sont:

- `CONTRAVENTIONS` = `Gestion des contraventions`
- `CARTE_CHARGEMENT_DECHARGEMENT` = `Carte des points chargements/déchargements`
- `INDICATEURS_CONDUCTEURS` = `Les indicateurs conducteurs`
- `INDICATEURS_TRACTEURS` = `Les indicateurs des tracteurs`

Modules d'administration transverses attendus a ce stade:

- `PARAMETRES`
- `SECURITE`
- `INTERFACES`
- `OUTILS`

## 3. Profils V1 retenus

## 3.1 Informatique

Libelle d'affichage recommande:

- `Informatique`

Description:

- profil administrateur
- acces complet a l'administration et aux modules fonctionnels

Droits recommandes:

- `PARAMETRES` -> `Ecriture`
- `SECURITE` -> `Ecriture`
- `INTERFACES` -> `Ecriture`
- `OUTILS` -> `Ecriture`
- `CONTRAVENTIONS` -> `Ecriture`
- `CARTE_CHARGEMENT_DECHARGEMENT` -> `Ecriture`
- `INDICATEURS_CONDUCTEURS` -> `Ecriture`
- `INDICATEURS_TRACTEURS` -> `Ecriture`

Navigation visible:

- `Administration`
- `Exploitation`
- `Gestion administrative`

## 3.2 Direction

Libelle d'affichage recommande:

- `Direction`

Description:

- acces a tous les modules fonctionnels
- aucun acces a l'administration

Droits recommandes:

- `PARAMETRES` -> `Aucun`
- `SECURITE` -> `Aucun`
- `INTERFACES` -> `Aucun`
- `OUTILS` -> `Aucun`
- `CONTRAVENTIONS` -> `Lecture`
- `CARTE_CHARGEMENT_DECHARGEMENT` -> `Lecture`
- `INDICATEURS_CONDUCTEURS` -> `Lecture`
- `INDICATEURS_TRACTEURS` -> `Lecture`

Navigation visible:

- `Exploitation`
- `Gestion administrative`

Navigation masquee:

- `Administration`

## 3.3 Exploitation

Libelle d'affichage recommande:

- `Exploitation`

Description:

- acces uniquement a l'entree `Exploitation`
- acces en lecture uniquement

Droits recommandes:

- `PARAMETRES` -> `Aucun`
- `SECURITE` -> `Aucun`
- `INTERFACES` -> `Aucun`
- `OUTILS` -> `Aucun`
- `CONTRAVENTIONS` -> `Aucun`
- `CARTE_CHARGEMENT_DECHARGEMENT` -> `Lecture`
- `INDICATEURS_CONDUCTEURS` -> `Lecture`
- `INDICATEURS_TRACTEURS` -> `Lecture`

Navigation visible:

- `Exploitation`

Navigation masquee:

- `Administration`
- `Gestion administrative`

## 3.4 Administratif

Libelle d'affichage recommande:

- `Administratif`

Description:

- acces uniquement a la gestion des contraventions
- acces en ecriture sur ce module

Droits recommandes:

- `PARAMETRES` -> `Aucun`
- `SECURITE` -> `Aucun`
- `INTERFACES` -> `Aucun`
- `OUTILS` -> `Aucun`
- `CONTRAVENTIONS` -> `Ecriture`
- `CARTE_CHARGEMENT_DECHARGEMENT` -> `Aucun`
- `INDICATEURS_CONDUCTEURS` -> `Aucun`
- `INDICATEURS_TRACTEURS` -> `Aucun`

Navigation visible:

- `Gestion administrative`

Navigation masquee:

- `Administration`
- `Exploitation`

## 4. Matrice synthetique

| Profil | Parametres | Securite | Interfaces | Outils | Contraventions | Carte des points chargements/dechargements | Indicateurs conducteurs | Indicateurs des tracteurs |
|---|---|---|---|---|---|---|---|---|
| Informatique | Ecriture | Ecriture | Ecriture | Ecriture | Ecriture | Ecriture | Ecriture | Ecriture |
| Direction | Aucun | Aucun | Aucun | Aucun | Lecture | Lecture | Lecture | Lecture |
| Exploitation | Aucun | Aucun | Aucun | Aucun | Aucun | Lecture | Lecture | Lecture |
| Administratif | Aucun | Aucun | Aucun | Aucun | Ecriture | Aucun | Aucun | Aucun |

## 5. Regles de comportement attendues

### 5.1 Informatique

- voit toute la navigation
- peut administrer les comptes, profils, modules, interfaces et parametres
- peut agir sur tous les modules fonctionnels

### 5.2 Direction

- ne voit pas l'administration
- peut consulter tous les modules metier
- ne peut pas modifier les donnees fonctionnelles

### 5.3 Exploitation

- ne voit que l'entree `Exploitation`
- consulte la carte et les indicateurs
- ne peut lancer aucune action d'ecriture

### 5.4 Administratif

- ne voit que `Gestion administrative`
- agit uniquement sur `Gestion des contraventions`
- n'a pas acces aux autres modules

## 6. Points a confirmer

### 6.1 Droit sur les interfaces pour Direction

Dans cette proposition, `Direction` n'a pas acces a `Administration`, donc aucun acces a `INTERFACES`.

A confirmer:

- faut-il un ecran de consultation d'etat des interfaces hors administration pour la direction

### 6.2 Droit de synchronisation exploitation

Dans cette proposition, `Exploitation` est uniquement en lecture.

A confirmer:

- faut-il autoriser plus tard certaines actions comme relancer un calcul ou rafraichir des donnees sans ouvrir l'ensemble de l'ecriture

## 7. Decision V1 retenue a ce stade

Profils standards V1:

- `Informatique`
- `Direction`
- `Exploitation`
- `Administratif`

## 8. Prochaine etape recommandee

Le prochain livrable utile est:

- `newnexus-premier-schema-postgresql.md`

Il devra traduire en tables PostgreSQL minimales:

- securite
- transverse
- utilisateurs
- modules
- profils
- droits
