# Strategie de versionnement et de branches NewNexus

## Versionnement

Format: `MAJEUR.MINEUR.CORRECTIF`

### Regles

- `MAJEUR`: rupture structurelle ou lot majeur transformant fortement le produit
- `MINEUR`: ajout fonctionnel ou transverse significatif
- `CORRECTIF`: stabilisation ou correction sans extension forte du perimetre

### Point de depart recommande

- `0.1.0` pour le demarrage du socle

### Tracabilite obligatoire

A chaque jalon important, consigner dans `contexte/session.md`:

- date
- version cible ou atteinte
- scope de la livraison
- etat du scaffold/build/migrations

## Branches

### Branches structurantes

- `socle`
- `transverse`
- `module-contraventions`
- `module-carte-chargement-dechargement`
- `module-indicateurs-conducteurs`
- `module-indicateurs-tracteurs`

### Role des branches

- `socle`: auth, droits, shell applicatif, conventions, outillage de base
- `transverse`: societes, analytiques, exploitations, salaries, tiers, materiels, interfaces
- `module-*`: developpement d'un module fonctionnel isole

### Ordre de progression recommande

1. `socle`
2. `transverse`
3. `module-*`
