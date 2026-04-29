# Prompt Codex — Intégration identité Nexus

Tu dois intégrer l’identité visuelle Nexus dans l’application web.

## Direction validée

Utiliser la direction `Concept 4C` présente dans :
- `01_concepts/concept_4c_selected.png`
- `02_brand_guides/nexus_brand_kit.png`
- `02_brand_guides/nexus_icon_favicon_kit.png`
- `02_brand_guides/nexus_web_ui_style.png`

## Objectif

Créer une intégration premium et professionnelle :
- Logo Nexus en en-tête et écran de connexion.
- Favicon et icônes PWA.
- Palette de couleurs centralisée.
- Sidebar navy.
- Cartes blanches avec bordures fines, rayons arrondis et ombres légères.
- Boutons primaires violets, boutons secondaires blancs avec contour violet.
- Badges colorés par statut.
- UI sobre, moderne, lisible, adaptée à une application métier.

## Tokens à utiliser

Importer ou reprendre :
- `04_codex/design-tokens.css`
- `04_codex/design-tokens.json`

## Assets

Utiliser en priorité :
- `03_assets/svg/nexus-app-icon.svg`
- `03_assets/svg/nexus-wordmark-simplified.svg`
- `03_assets/png/favicon.ico`
- `03_assets/png/nexus-icon-192.png`
- `03_assets/png/nexus-icon-512.png`

## Couleurs

```css
--nexus-navy: #0B1E75;
--nexus-gold: #F7B500;
--nexus-orange: #FF8A00;
--nexus-purple: #6C3DFF;
--nexus-cyan: #18BCEB;
--nexus-green: #24B05A;
```

## Typographie

Charger via Google Fonts ou paquet local :
- Sora : 700 pour les titres.
- Inter : 400, 500, 600, 700 pour l’interface.

## À produire

1. Remplacer les logos existants.
2. Configurer favicon, Apple Touch Icon et PWA icons.
3. Créer un fichier de variables CSS ou thème central.
4. Appliquer le thème aux composants principaux.
5. Créer une page de prévisualisation UI si le projet en possède une.
6. Garantir un rendu responsive desktop/tablette/mobile.
7. Conserver un contraste suffisant sur les zones navy.

## Style attendu

S’inspirer du visuel `02_brand_guides/nexus_web_ui_style.png` :
- fond général clair `#F7F9FC`;
- sidebar navy;
- cartes blanches;
- accents colorés par fonctionnalité;
- apparence SaaS premium, propre et cohérente.
