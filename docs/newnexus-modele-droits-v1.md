# NewNexus

## Modele de droits V1

Date: 2026-04-29
Statut: proposition de travail

## 1. Objectif

Le modele de droits V1 de `NewNexus` doit rester simple, lisible et administrable.

La regle de depart est la suivante:

- les droits sont portes par module
- chaque module admet 3 niveaux: `Aucun`, `Lecture`, `Ecriture`
- un `profil` regroupe un ensemble de droits par module
- un `compte` utilisateur est rattache a un profil

Dans cette V1, on privilegie la clarte et la robustesse plutot qu'un moteur de securite trop abstrait.

## 2. Principes fonctionnels

### 2.1 Un seul point d'entree des droits

Les droits applicatifs sont definis au niveau du `profil`.

Un compte utilisateur herite des droits de son profil.

Dans cette V1:

- pas de droits saisis directement sur un compte
- pas de cumul de plusieurs profils sur un meme compte
- pas de regle complexe de surcharge

Cela permet:

- une administration simple
- une lecture immediate des droits reels
- un comportement previsible

### 2.2 Niveaux de droit par module

Chaque module doit avoir exactement un niveau parmi:

- `Aucun`
- `Lecture`
- `Ecriture`

Interpretation:

- `Aucun`: le module n'est pas accessible
- `Lecture`: consultation uniquement
- `Ecriture`: consultation + creation + modification + actions fonctionnelles d'ecriture

### 2.3 Regle d'heritage

Le niveau `Ecriture` inclut implicitement `Lecture`.

Le niveau `Aucun` n'autorise aucune route ni aucun ecran du module.

## 3. Modules V1 a gerer

La liste exacte pourra evoluer, mais la V1 doit au minimum couvrir les modules suivants.

### 3.1 Socle

- `PARAMETRES`
- `SECURITE`
- `OUTILS`

### 3.2 Transverse

- `SOCIETES`
- `ANALYTIQUES`
- `EXPLOITATIONS`
- `SALARIES`
- `TIERS`
- `MATERIELS`
- `INTERFACES`

### 3.3 Fonctionnel lot 1

- `INDICATEURS_CONDUCTEURS`
- `CONTRAVENTIONS`
- `CARTE_FLUX`
- `SUIVI_TRACTEURS`

## 4. Profils

### 4.1 Definition

Un profil est un modele de droits reutilisable.

Exemples de profils possibles:

- `Super Administrateur`
- `Administrateur`
- `RH Lecture`
- `RH Edition`
- `Exploitation Lecture`
- `Exploitation Edition`
- `Direction Lecture`

### 4.2 Regles de gestion

Un profil contient:

- un code unique
- un libelle
- un statut actif / inactif
- une liste de droits par module

Contraintes recommandees:

- un profil inactif ne peut plus etre affecte a un nouveau compte
- un profil deja rattache a des comptes ne doit pas etre supprime physiquement par defaut
- on privilegie la desactivation plutot que la suppression

## 5. Comptes utilisateurs

### 5.1 Definition

Un compte utilisateur contient au minimum:

- login
- nom affiche
- email
- statut actif / inactif
- profil associe
- dates de creation / modification

### 5.2 Regles de gestion

Dans la V1:

- un compte doit etre rattache a un et un seul profil
- un compte sans profil n'est pas autorise
- si le profil est desactive, le compte existant peut rester rattache mais l'administration doit afficher un avertissement

## 6. Regles d'autorisation backend

Le backend reste la source de verite.

Pour chaque endpoint protege:

1. identifier le module concerne
2. determiner le niveau minimal requis: `Lecture` ou `Ecriture`
3. charger le profil du compte connecte
4. verifier le niveau du module
5. autoriser ou refuser

Regles:

- un `GET` metier demande en general `Lecture`
- un `POST`, `PUT`, `PATCH`, `DELETE` demande `Ecriture`
- certaines actions metier non CRUD comme `refresh`, `import`, `run`, `synchroniser` demandent `Ecriture`

## 7. Regles frontend

Le frontend ne doit pas etre la source de verite, mais il doit refleter les droits pour la lisibilite.

Il doit donc:

- masquer ou desactiver les menus sans droit `Lecture`
- rendre les formulaires non modifiables si le droit est `Lecture`
- masquer ou desactiver les actions d'ecriture si le droit n'est pas `Ecriture`
- afficher un message explicite en cas d'acces refuse

## 8. Administration des droits

La gestion doit se faire en 3 ecrans simples.

### 8.1 Ecran Modules

But:

- lister les modules fonctionnels connus
- permettre leur activation dans le systeme
- definir leur libelle d'affichage

### 8.2 Ecran Profils

But:

- creer / modifier / desactiver un profil
- attribuer un niveau `Aucun`, `Lecture`, `Ecriture` a chaque module

Ergonomie recommandee:

- tableau croise `profil x module`
- radios ou select par module
- duplication d'un profil existant

### 8.3 Ecran Comptes

But:

- creer / modifier / desactiver un compte
- associer un profil
- reinitialiser le mot de passe
- visualiser les droits herites du profil

## 9. Cas limites a traiter

- si un module n'a pas de ligne de droit dans un profil, il doit etre considere comme `Aucun`
- si un compte est inactif, aucun acces n'est autorise
- si un profil est inactif, les comptes rattaches doivent etre bloques ou clairement signales selon la politique choisie
- si un module est inactif au catalogue, il ne doit plus apparaitre dans l'UI d'administration standard

## 10. Schema de donnees minimal recommande

### Table `SecurityModule`

- `SecurityModuleId`
- `Code`
- `Libelle`
- `Actif`
- `OrdreAffichage`
- `DateCreation`
- `DateModification`

### Table `SecurityProfile`

- `SecurityProfileId`
- `Code`
- `Libelle`
- `Actif`
- `Description`
- `DateCreation`
- `DateModification`

### Table `SecurityProfileModuleRight`

- `SecurityProfileModuleRightId`
- `SecurityProfileId`
- `SecurityModuleId`
- `NiveauAcces`
- `DateCreation`
- `DateModification`

Valeurs autorisees pour `NiveauAcces`:

- `AUCUN`
- `LECTURE`
- `ECRITURE`

Contrainte d'unicite:

- unique sur `(SecurityProfileId, SecurityModuleId)`

### Table `UserAccount`

- `UserAccountId`
- `Login`
- `NomAffiche`
- `Email`
- `PasswordHash`
- `Actif`
- `SecurityProfileId`
- `DerniereConnexionUtc`
- `DateCreation`
- `DateModification`

## 11. Decisions V1 prises

- droits par module uniquement
- 3 niveaux uniquement: `Aucun`, `Lecture`, `Ecriture`
- droits portes uniquement par le profil
- un seul profil par compte
- pas de surcharge manuelle compte par compte en V1
- backend source de verite

## 12. Evolutions possibles plus tard

A ne pas faire en V1 sauf besoin critique:

- plusieurs profils par compte
- exceptions de droits au niveau utilisateur
- droits par action fine
- droits par champ
- droits par perimetre analytique / exploitation / societe

Ces evolutions sont possibles plus tard, mais ajouteraient de la complexite. La V1 doit d'abord etre solide et comprehensible.

## 13. Prochaine etape recommandee

Le prochain document a produire est:

- `newnexus-schema-transverse-v1.md`

Il devra decrire les entites PostgreSQL minimales pour:

- societes
- analytiques
- exploitations
- salaries
- tiers
- materiels
- interfaces
