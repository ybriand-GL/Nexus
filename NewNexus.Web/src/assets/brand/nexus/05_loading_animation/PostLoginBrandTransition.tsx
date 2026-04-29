import { useEffect } from 'react'
import './post-login-brand-transition.css'

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
    }, 2200)

    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="brand-transition-screen" role="status" aria-live="polite" aria-label={label}>
      <div className="brand-transition-card">
        <div className="brand-transition-stage brand-transition-stage-auth">
          <img className="brand-transition-laure-solo" src="./groupe-laure-logo.jpg" alt="Groupe Laure" />
          <div className="brand-transition-halo" />
        </div>

        <div className="brand-transition-stage brand-transition-stage-merge" aria-hidden="true">
          <img className="brand-transition-laure-inline" src="./groupe-laure-logo.jpg" alt="" />
          <span className="brand-transition-separator">×</span>
          <div className="brand-transition-nexus-wrap">
            <img className="brand-transition-nexus-icon" src="./nexus-app-icon.svg" alt="" />
            <img className="brand-transition-nexus-wordmark" src="./nexus-wordmark-simplified.png" alt="" />
          </div>
          <div className="brand-transition-particles">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="brand-transition-stage brand-transition-stage-final" aria-hidden="true">
          <img className="brand-transition-laure-mini" src="./groupe-laure-logo.jpg" alt="" />
          <span className="brand-transition-line" />
          <div className="brand-transition-final-nexus">
            <img className="brand-transition-final-icon" src="./nexus-app-icon.svg" alt="" />
            <img className="brand-transition-final-wordmark" src="./nexus-wordmark-simplified.png" alt="" />
          </div>
          <div className="brand-transition-shimmer" />
          <div className="brand-transition-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostLoginBrandTransition
