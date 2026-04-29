# NewNexus

## Schema transverse V1

Date: 2026-04-29
Statut: proposition de travail

## 1. Objet

Ce document decrit le perimetre transverse V1 de `NewNexus`.

Il couvre:

- societes du Groupe Laure
- analytiques
- exploitations
- salaries
- tiers
- materiels
- interfaces

Le terme `code` designe ici un identifiant metier lisible par l'utilisateur.

Il ne faut pas le confondre avec un identifiant technique interne de base.

## 2. Principes transverses V1

### 2.1 Identifiants techniques et codes metier

Chaque table transverse doit posseder:

- un identifiant technique interne
- quand le besoin metier l'impose, un `Code` metier unique

Regle:

- les relations internes peuvent s'appuyer sur les identifiants techniques
- les ecrans et imports doivent utiliser les codes metier quand ils existent

### 2.2 Traçabilite minimale

Chaque entite transverse importante doit posseder au minimum:

- `DateCreation`
- `DateModification`
- `Actif` quand le concept supporte activation / desactivation

### 2.3 Synchronisation et creation manuelle

Le schema doit distinguer clairement:

- les donnees creables manuellement
- les donnees creables uniquement par interface
- les donnees enrichies par interface apres creation

## 3. Societes

### 3.1 Definition

Les `societes` ne sont pas des tiers.

Ce sont les societes du Groupe Laure.

### 3.2 Regle de creation

Les societes doivent etre creees via la base `SIRENE`.

En V1:

- pas de creation manuelle libre d'une societe
- creation depuis recherche / selection SIRENE
- stockage local des donnees retenues apres import

### 3.3 Attributs minimaux recommends

- identifiant technique
- `Code` interne metier si besoin de codification locale
- `RaisonSociale`
- `Siren`
- `SiretSiege`
- `TypeSociete`
- `AdresseSiege`
- `CodePostal`
- `Ville`
- `Pays`
- `Actif`
- `SourceCreation` = `SIRENE`
- `DateCreation`
- `DateModification`

### 3.4 Regles de gestion

- une societe doit exister localement pour pouvoir rattacher analytiques, exploitations, salaries et materiels
- une societe desactivee ne doit plus etre affectable sur de nouvelles donnees

## 4. Analytiques

### 4.1 Definition

Un analytique est une unite metier rattachee a une et une seule societe.

### 4.2 Attributs obligatoires

- identifiant technique
- `Code` sur 4 caracteres
- `Libelle`
- `SocieteId`
- `Actif`
- `DateCreation`
- `DateModification`

### 4.3 Contraintes

- `Code` obligatoire
- `Code` longueur exacte 4
- `Code` unique dans le systeme en V1
- un analytique appartient a une et une seule societe

### 4.4 Regles de gestion

- un analytique ne peut pas exister sans societe de rattachement
- un analytique desactive ne doit plus etre affectable

## 5. Exploitations

### 5.1 Definition

Une exploitation possede un code, un libelle et un rattachement a une societe.

### 5.2 Attributs obligatoires

- identifiant technique
- `Code`
- `Libelle`
- `SocieteId`
- `Actif`
- `DateCreation`
- `DateModification`

### 5.3 Contraintes

- `Code` obligatoire
- `Code` unique dans le systeme en V1
- une exploitation appartient a une societe et une seule

### 5.4 Regles de gestion

- une exploitation ne peut pas exister sans societe
- une exploitation desactivee ne doit plus etre affectable

## 6. Salaries

### 6.1 Definition

Les salaries sont recuperes depuis `LUCCA`.

En V1:

- impossible de creer manuellement un salarie
- la mise a jour vient de l'interface LUCCA
- la desactivation vient aussi de l'etat LUCCA

### 6.2 Creation utilisateur automatique

Des qu'un import salarie est realise:

- un utilisateur `NewNexus` est cree automatiquement
- ce compte est cree sans droit
- il devra ensuite etre rattache a un profil pour acceder a l'application

### 6.3 Distinction conducteurs

Il faut distinguer les `conducteurs` des autres salaries.

Cette distinction doit etre portee explicitement dans le modele local, sans dependre uniquement de l'affichage.

### 6.4 Attributs obligatoires

- identifiant technique
- `LuccaEmployeeId`
- `Matricule`
- `Prenom`
- `Nom`
- `NomAffiche`
- `SocieteId`
- `PosteActuel`
- `DateEntreeEntreprise`
- `Statut` = `ACTIF` / `INACTIF`
- `EstConducteur`
- `DateCreation`
- `DateModification`

### 6.5 Contraintes

- `LuccaEmployeeId` unique
- `Matricule` obligatoire
- `SocieteId` obligatoire si fourni par Lucca ou derive du mapping d'import

### 6.6 Regles de gestion

- un salarie `INACTIF` dans Lucca doit etre marque inactif localement
- le compte applicatif associe doit etre bloque si le salarie est inactif
- l'import Lucca est la source de verite sur l'existence du salarie

## 7. Comptes utilisateurs derives des salaries

### 7.1 Principe

Le compte utilisateur est cree automatiquement a partir du salarie.

### 7.2 Regles V1

- creation automatique lors du premier import
- aucun droit attribue automatiquement
- affectation manuelle ulterieure a un profil
- blocage du compte si le salarie devient inactif

### 7.3 Attributs minimum du compte

- identifiant technique
- `Login`
- `Email`
- `SalarieId`
- `SecurityProfileId`
- `Actif`
- `DerniereConnexionUtc`
- `DateCreation`
- `DateModification`

## 8. Tiers

### 8.1 Definition

Les tiers couvrent les categories suivantes:

- entreprise
- entreprise etrangere
- particulier
- collectivite locale

### 8.2 Regle de creation

Le besoin exprime est le suivant:

- les tiers ne doivent pas etre crees manuellement
- ils doivent etre crees via interface `SIRENE`

### 8.3 Point d'arbitrage indispensable

`SIRENE` ne couvre pas nativement:

- les particuliers
- les entreprises etrangeres

Il existe donc une ambiguite fonctionnelle a trancher.

Interpretations possibles:

1. seuls les tiers `entreprise` et `collectivite locale` passent par SIRENE, tandis que `particulier` et `entreprise etrangere` passent par une autre interface assistee
2. aucun tiers n'est cree manuellement, mais tous ne passent pas necessairement par SIRENE

Decision recommandee pour V1:

- `entreprise` et `collectivite locale`: creation via SIRENE
- `entreprise etrangere` et `particulier`: creation via parcours assiste dedie, non libre, a definir

### 8.4 Attributs minimum V1

Le detail sera defini plus tard par type, mais le socle minimal doit prevoir:

- identifiant technique
- `TypeTiers`
- `NomAffichage`
- `Actif`
- `SourceCreation`
- `DateCreation`
- `DateModification`

Pour les tiers entreprise / collectivite, prevoir aussi des champs compatibles SIRENE:

- `RaisonSociale`
- `Siren`
- `Siret`
- `Adresse`
- `CodePostal`
- `Ville`
- `Pays`

### 8.5 Rattachement analytique

Un tiers peut etre rattache a plusieurs analytiques.

Il faut donc une table de liaison.

### 8.6 Tables recommandees

#### Table `ThirdParty`

- identifiant technique
- `TypeTiers`
- `NomAffiche`
- `Actif`
- `SourceCreation`
- `DateCreation`
- `DateModification`

#### Table `ThirdPartyAnalytic`

- identifiant technique
- `ThirdPartyId`
- `AnalyticId`
- `DateCreation`

Contrainte:

- unicite sur `(ThirdPartyId, AnalyticId)`

## 9. Materiels

### 9.1 Definition

Les materiels couvrent notamment:

- tracteurs
- remorques
- caissons
- petit materiel
- autres categories a definir

### 9.2 Identifiant metier principal

Tous les materiels ont un identifiant metier unique: le `NumeroParc`.

### 9.3 Regle d'integration

Les materiels seront integres par import.

En V1:

- pas de creation libre prioritaire
- import comme mode principal d'alimentation

### 9.4 Rattachement obligatoire

Un materiel appartient a:

- une societe
- un analytique

### 9.5 Attributs minimum V1

- identifiant technique
- `NumeroParc`
- `TypeMateriel`
- `Libelle`
- `Immatriculation` si applicable
- `SocieteId`
- `AnalyticId`
- `Actif`
- `DateCreation`
- `DateModification`
- `SourceImport`

### 9.6 Contraintes

- `NumeroParc` unique dans le systeme
- `SocieteId` obligatoire
- `AnalyticId` obligatoire

## 10. Interfaces

### 10.1 Regle V1

Les interfaces a parametrer sont les memes que dans `Nexus`.

Il faut toutes les prevoir dans `NewNexus`.

### 10.2 Interfaces minimales explicites a supporter

- `SIRENE`
- `LUCCA`
- `Truckonline`
- `YellowBox`
- geocodage
- cartographie

### 10.3 Table de parametrage recommandee

#### Table `InterfaceConnector`

- identifiant technique
- `Code`
- `Libelle`
- `TypeInterface`
- `Actif`
- `DateCreation`
- `DateModification`

#### Table `InterfaceConnectorSetting`

- identifiant technique
- `InterfaceConnectorId`
- `Cle`
- `Valeur`
- `ValeurChiffree`
- `DateCreation`
- `DateModification`

Contraintes:

- unicite sur `(InterfaceConnectorId, Cle)`

## 11. Tables transverses V1 a prevoir

Liste minimale recommandee:

- `Company`
- `Analytic`
- `OperationUnit`
- `Employee`
- `UserAccount`
- `ThirdParty`
- `ThirdPartyAnalytic`
- `Equipment`
- `InterfaceConnector`
- `InterfaceConnectorSetting`
- `SecurityModule`
- `SecurityProfile`
- `SecurityProfileModuleRight`

## 12. Arbitrages ouverts

### 12.1 Tiers particuliers et entreprises etrangeres

Point non coherent tel quel avec la contrainte `SIRENE only`.

Decision a prendre:

- creer un flux dedie non manuel strict
- ou autoriser une creation assistee controlee

### 12.2 Codification des societes

A confirmer:

- faut-il un `Code` metier interne pour les societes du Groupe Laure
- ou les identifiants SIREN / raison sociale suffisent-ils en V1

### 12.3 Distinction conducteurs

A confirmer:

- la qualification `conducteur` vient-elle directement de Lucca
- ou d'un mapping local du poste / fonction

### 12.4 Multiples analytiques par compte utilisateur

Non traite dans la V1 droits, mais a envisager plus tard si les perimetres de donnees deviennent necessaires.

## 13. Prochaine etape recommandee

Le prochain livrable a produire est:

- `newnexus-matrice-modules-v1.md`

Il devra contenir:

- la liste definitive des modules
- leur libelle d'affichage
- leur rattachement navigation
- leur niveau minimal d'autorisation par profil type
