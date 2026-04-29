import { useEffect } from 'react'
import './nexus-post-auth-loader.css'

export type NexusPostAuthLoaderProps = {
  onComplete?: () => void
  label?: string
}

export function NexusPostAuthLoader({
  onComplete,
  label = 'Connexion réussie, chargement de Nexus',
}: NexusPostAuthLoaderProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onComplete?.()
    }, 2800)

    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="nexus-loader-screen" role="status" aria-live="polite" aria-label={label}>
      <div className="nexus-loader-card">
        <div className="nexus-loader-icon" aria-hidden="true">
          <span className="nexus-icon-left" />
          <span className="nexus-icon-diagonal" />
          <span className="nexus-icon-orange" />
          <span className="nexus-icon-green" />
        </div>

        <div className="nexus-loader-wordmark" aria-hidden="true">
          <span className="nexus-letter nexus-letter-n">n</span>
          <span className="nexus-letter nexus-letter-e">e</span>
          <span className="nexus-letter nexus-letter-x">
            <span className="nexus-x-orange" />
            <span className="nexus-x-purple-top" />
            <span className="nexus-x-purple-bottom" />
          </span>
          <span className="nexus-letter nexus-letter-u">u</span>
          <span className="nexus-letter nexus-letter-s">s</span>
        </div>

        <div className="nexus-loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

export default NexusPostAuthLoader
