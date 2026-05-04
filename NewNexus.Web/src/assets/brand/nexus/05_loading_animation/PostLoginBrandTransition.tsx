import { useEffect } from 'react'
import './post-login-brand-transition.css'
import nexusIcon from '../../nexus-icon.svg'
import nexusWordmark from '../../nexus-wordmark.svg'

type PostLoginBrandTransitionProps = {
  onComplete?: () => void
  label?: string
}

export function PostLoginBrandTransition({
  onComplete,
  label = 'Connexion réussie, chargement de Groupe Laure et Nexus',
}: PostLoginBrandTransitionProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onComplete?.()
    }, 2800)

    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="brand-transition-screen" role="status" aria-live="polite" aria-label={label}>
      <main className="preview-stage">
        <div className="preview-aura preview-aura-left" aria-hidden="true" />
        <div className="preview-aura preview-aura-right" aria-hidden="true" />
        <div className="preview-grain" aria-hidden="true" />

        <div className="preview-content">
          <div className="preview-brand-row">
            <div className="preview-laure-wrap">
              <div className="preview-laure-glow" aria-hidden="true" />
              <div className="preview-laure-card">
                <img src="./groupe-laure-symbole-selectionne.png" alt="Symbole Groupe Laure" />
              </div>
              <img className="preview-laure-wordmark" src="./groupe-laure-logo-complet.jpg" alt="Groupe Laure" />
            </div>

            <div className="preview-fusion-lane" aria-hidden="true">
              <div className="preview-energy preview-energy-gold" />
              <div className="preview-energy preview-energy-purple" />
              <div className="preview-energy preview-energy-cyan" />
              <div className="preview-energy preview-energy-green" />
              <div className="preview-spark" />
            </div>

            <div className="preview-nexus-wrap">
              <img className="preview-nexus-icon" src={nexusIcon} alt="Icone Nexus" />
              <img className="preview-nexus-logo" src={nexusWordmark} alt="Nexus" />
            </div>
          </div>

          <div className="preview-final-loader" aria-hidden="true">
            <span className="loader-dot loader-dot-muted" />
            <span className="loader-dot loader-dot-active" />
            <span className="loader-dot loader-dot-muted" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default PostLoginBrandTransition
