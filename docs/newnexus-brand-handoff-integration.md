# Intégration des handoffs de marque NewNexus

## Périmètre Nexus premium

- intégration des tokens officiels issus de `04_codex/design-tokens.css`
- copie du référentiel JSON `04_codex/design-tokens.json` dans le frontend
- remplacement des points d’entrée navigateur par les assets du handoff :
  - `favicon.ico`
  - `nexus-icon-16.png`
  - `nexus-icon-32.png`
  - `nexus-icon-180.png`
  - `nexus-icon-192.png`
  - `nexus-icon-512.png`
- ajout d’un `manifest.webmanifest` pour la couche PWA minimale

## Périmètre Groupe Laure × Nexus

- intégration du logo officiel Groupe Laure dans `public/groupe-laure-logo.jpg`
- remplacement de l’animation post-authentification par une transition dédiée `Groupe Laure × Nexus`
- rehausse de la page d’authentification avec un lockup premium :
  - logo Groupe Laure
  - séparateur de marque
  - icône et wordmark Nexus

## Fichiers principaux modifiés

- `NewNexus.Web/src/main.tsx`
- `NewNexus.Web/src/index.css`
- `NewNexus.Web/src/App.tsx`
- `NewNexus.Web/src/App.css`
- `NewNexus.Web/index.html`
- `NewNexus.Web/public/manifest.webmanifest`
- `NewNexus.Web/public/groupe-laure-logo.jpg`
- `NewNexus.Web/src/assets/brand/nexus/04_codex/*`
- `NewNexus.Web/src/assets/brand/nexus/05_loading_animation/PostLoginBrandTransition.tsx`
- `NewNexus.Web/src/assets/brand/nexus/05_loading_animation/post-login-brand-transition.css`

## Point d’entrée et comportement

- le point d’entrée reste le flux d’authentification existant dans `App.tsx`
- après connexion réussie, une transition visuelle `Groupe Laure × Nexus` s’affiche une seule fois
- la transition respecte `prefers-reduced-motion`
- la logique métier et les endpoints d’authentification ne sont pas modifiés

## Nettoyage

- l’ancien loader `NexusPostAuthLoader` a été retiré
- les commentaires inutiles ont été évités dans les fichiers frontend concernés
