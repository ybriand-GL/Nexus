# Intégration du handoff de marque NewNexus

## Périmètre appliqué

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
- intégration de l’animation post-authentification `NexusPostAuthLoader`

## Fichiers principaux modifiés

- `NewNexus.Web/src/main.tsx`
- `NewNexus.Web/src/index.css`
- `NewNexus.Web/src/App.tsx`
- `NewNexus.Web/index.html`
- `NewNexus.Web/public/manifest.webmanifest`
- `NewNexus.Web/src/assets/brand/nexus/04_codex/*`
- `NewNexus.Web/src/assets/brand/nexus/05_loading_animation/*`

## Comportement ajouté

- après connexion réussie, une transition visuelle NEXUS s’affiche une seule fois
- la transition respecte `prefers-reduced-motion`
- la logique métier et les endpoints d’authentification ne sont pas modifiés
