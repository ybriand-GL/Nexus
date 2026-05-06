import { useEffect } from 'react'
import './post-login-brand-transition.css'
import nexusIcon from '../../nexus_icon_figma_clean.svg'
import nexusWordmark from '../../nexus_wordmark_figma_clean.svg'

type PostLoginBrandTransitionProps = {
  onComplete?: () => void
  label?: string
}

export function PostLoginBrandTransition({
  onComplete,
  label = 'Connexion valid\u00e9e, ouverture de Nexus',
}: PostLoginBrandTransitionProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onComplete?.()
    }, 2600)

    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className="brand-transition-screen" role="status" aria-live="polite" aria-label={label}>
      <main className="post-auth-cinematic">
        <div className="post-auth-grain" aria-hidden="true" />
        <div className="post-auth-vignette" aria-hidden="true" />
        <div className="post-auth-waves" aria-hidden="true">
          <svg viewBox="0 0 1200 620" preserveAspectRatio="none">
            <path className="thread t1" d="M20,250 C180,210 318,122 470,206 C640,300 730,350 892,248 C1018,168 1098,130 1182,138" />
            <path className="thread t2" d="M80,320 C230,220 330,228 480,300 C640,378 745,312 860,198 C980,82 1090,104 1160,168" />
            <path className="thread t3" d="M88,402 C260,396 350,326 510,304 C670,282 766,388 910,376 C1040,364 1102,276 1190,294" />
            <path className="thread t4" d="M10,454 C174,488 330,430 476,322 C640,198 754,176 908,244 C1032,298 1112,284 1190,234" />
            <path className="thread t5" d="M76,152 C250,78 376,136 514,246 C670,372 774,396 940,286 C1070,200 1134,150 1212,110" />
          </svg>
        </div>
        <div className="post-auth-fusion" aria-hidden="true" />
        <section className="post-auth-final">
          <img className="post-auth-icon" src={nexusIcon} alt="" aria-hidden="true" />
          <img className="post-auth-wordmark" src={nexusWordmark} alt="Nexus" />
          <p>ESPACE GROUPE LAURE</p>
          <div className="post-auth-readiness" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
      </main>
    </div>
  )
}

export default PostLoginBrandTransition
