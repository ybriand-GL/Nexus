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
    }, 5000)

    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="brand-transition-screen" role="status" aria-live="polite" aria-label={label}>
      <main className="preview-stage">
        <div className="preview-content">
          <div className="preview-brand-row">
            <div className="preview-energy" />

            <div className="preview-laure-card">
              <img src="./groupe-laure-logo.jpg" alt="Groupe Laure Transports & Logistique" />
            </div>

            <div className="preview-separator" aria-hidden="true" />

            <div className="preview-nexus-wrap">
              <div className="preview-nexus-icon" aria-hidden="true">
                <div className="preview-corner-orange" />
                <div className="preview-corner-green" />
              </div>

              <div className="preview-nexus-word" aria-label="nexus">
                <span>n</span>
                <span>e</span>
                <span>x</span>
                <span>u</span>
                <span>s</span>
              </div>
            </div>

            <div className="preview-shimmer" />
          </div>

          <div className="preview-loader" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <div className="preview-status">Redirection vers le tableau de bord…</div>
        </div>
      </main>
    </div>
  )
}

export default PostLoginBrandTransition
