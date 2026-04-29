import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type SystemInfo = {
  product: string
  version: string
  environment: string
  basePath: string
  serverTimeUtc: string
}

type BootstrapModule = {
  code: string
  label: string
  navigationGroup: string
}

type ProfileRight = {
  moduleCode: string
  moduleLabel: string
  navigationGroup: string
  accessLevel: string
}

type BootstrapProfile = {
  code: string
  label: string
  isSystemProfile: boolean
  rights: ProfileRight[]
}

type BootstrapPayload = {
  version: string
  users: {
    total: number
    active: number
  }
  modules: BootstrapModule[]
  profiles: BootstrapProfile[]
  summary: {
    moduleCount: number
    profileCount: number
    rightsByLevel: Record<string, number>
  }
}

type AuthenticatedUser = {
  id: string
  login: string
  displayName: string
  email: string | null
  employeeNumber: string | null
  mustChangePassword: boolean
  lastLoginAtUtc: string | null
  profile: {
    id: string
    code: string
    label: string
  } | null
  rights: ProfileRight[]
}

type AccountItem = {
  id: string
  login: string
  displayName: string
  email: string | null
  employeeNumber: string | null
  isActive: boolean
  mustChangePassword: boolean
  createdAtUtc: string
  lastLoginAtUtc: string | null
  lastSyncedAtUtc: string | null
  profile: {
    id: string
    code: string
    label: string
  } | null
}

const navigationEntries = ['Administration', 'Exploitation', 'Gestion administrative']

const profileAccentClass: Record<string, string> = {
  Administratif: 'accent-orange',
  Direction: 'accent-cyan',
  Exploitation: 'accent-green',
  Informatique: 'accent-purple',
}

function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null)
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [credentials, setCredentials] = useState({
    login: 'admin',
    password: 'NewNexus!2026',
  })

  useEffect(() => {
    void initialize()
  }, [])

  async function initialize() {
    setIsLoading(true)
    setError(null)

    try {
      const systemResponse = await fetch('./api/system/info')
      if (!systemResponse.ok) {
        throw new Error('Impossible de charger les informations système.')
      }

      const systemPayload = (await systemResponse.json()) as SystemInfo
      setSystemInfo(systemPayload)

      const meResponse = await fetch('./api/auth/me')
      if (meResponse.status === 401) {
        setCurrentUser(null)
        setBootstrap(null)
        setAccounts([])
        return
      }

      if (!meResponse.ok) {
        throw new Error('Impossible de récupérer le compte connecté.')
      }

      const mePayload = (await meResponse.json()) as AuthenticatedUser
      setCurrentUser(mePayload)
      await loadSecuredData()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSecuredData() {
    const [bootstrapResponse, accountsResponse] = await Promise.all([
      fetch('./api/security/bootstrap'),
      fetch('./api/security/accounts'),
    ])

    if (!bootstrapResponse.ok || !accountsResponse.ok) {
      throw new Error('Impossible de charger le socle sécurisé.')
    }

    const [bootstrapPayload, accountPayload] = await Promise.all([
      bootstrapResponse.json() as Promise<BootstrapPayload>,
      accountsResponse.json() as Promise<AccountItem[]>,
    ])

    setBootstrap(bootstrapPayload)
    setAccounts(accountPayload)
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginError(null)

    try {
      const response = await fetch('./api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (response.status === 401) {
        setLoginError('Identifiants invalides.')
        return
      }

      if (!response.ok) {
        throw new Error('La connexion a échoué.')
      }

      const user = (await response.json()) as AuthenticatedUser
      setCurrentUser(user)
      await loadSecuredData()
    } catch (submitError) {
      setLoginError(submitError instanceof Error ? submitError.message : 'Erreur de connexion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    await fetch('./api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    setBootstrap(null)
    setAccounts([])
  }

  const modulesByGroup = bootstrap?.modules.reduce<Record<string, BootstrapModule[]>>((groups, module) => {
    groups[module.navigationGroup] ??= []
    groups[module.navigationGroup].push(module)
    return groups
  }, {})

  if (isLoading) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <span className="eyebrow">Chargement</span>
          <h1>Préparation du socle NewNexus</h1>
          <p>Vérification de l’application publiée, du compte courant et de la base sécurisée.</p>
        </section>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <section className="auth-brand-panel">
          <img className="brand-icon" src="./nexus-app-icon.svg" alt="NewNexus" />
          <img className="brand-wordmark auth-wordmark" src="./nexus-wordmark-simplified.png" alt="Nexus" />
          <span className="eyebrow">Authentification</span>
          <h1>Connexion à NewNexus</h1>
          <p>
            L’accès au socle d’administration, aux profils et aux modules passe désormais par une
            authentification applicative réelle.
          </p>
          <ul className="auth-points">
            <li>Accès publié sous <code>/newNexus</code>.</li>
            <li>Base PostgreSQL initialisée et sécurisée.</li>
            <li>Compte bootstrap prêt pour le démarrage du chantier.</li>
          </ul>
        </section>

        <section className="auth-card">
          <span className="eyebrow">Accès interne</span>
          <h2>Ouvrir une session</h2>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Login</span>
              <input
                autoComplete="username"
                name="login"
                value={credentials.login}
                onChange={(event) => setCredentials((current) => ({ ...current, login: event.target.value }))}
              />
            </label>
            <label>
              <span>Mot de passe</span>
              <input
                autoComplete="current-password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            {loginError ? <p className="form-error">{loginError}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="bootstrap-credentials">
            <strong>Compte bootstrap</strong>
            <span>Login : <code>admin</code></span>
            <span>Mot de passe : <code>NewNexus!2026</code></span>
            <span>Ce mot de passe est provisoire et devra être changé ensuite.</span>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="nexus-app-shell">
      <aside className="nexus-sidebar">
        <div className="brand-panel">
          <img className="brand-icon" src="./nexus-app-icon.svg" alt="NewNexus" />
          <img className="brand-wordmark" src="./nexus-wordmark-simplified.png" alt="Nexus" />
          <p className="brand-copy">
            Socle premium NewNexus, conçu pour une lecture métier simple sous <code>/newNexus</code>.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {navigationEntries.map((entry) => (
            <a key={entry} className="sidebar-link" href={`#${entry.toLowerCase().replaceAll(' ', '-')}`}>
              {entry}
            </a>
          ))}
        </nav>

        <div className="sidebar-status">
          <span className="sidebar-kicker">Utilisateur connecté</span>
          <strong>{currentUser.displayName}</strong>
          <span>{currentUser.profile?.label ?? 'Sans profil'}</span>
          <button className="ghost-button" onClick={handleLogout} type="button">
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="nexus-main">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Concept 4C appliqué</span>
            <h1>NewNexus prend forme sur un socle sécurité, data et UI cohérent.</h1>
            <p>
              L’application reprend la direction visuelle validée, tout en exposant déjà les
              premiers modules, profils, comptes et droits depuis PostgreSQL.
            </p>
            <div className="hero-actions">
              <span className="primary-chip">Version {bootstrap?.version ?? systemInfo?.version ?? '0.1.0'}</span>
              <span className="secondary-chip">Base path {systemInfo?.basePath ?? '/newNexus'}</span>
            </div>
          </div>

          <div className="hero-highlight">
            <div className="hero-highlight-header">
              <span className="eyebrow">Session active</span>
              <span className="status-dot" />
            </div>
            <dl className="hero-stats">
              <div>
                <dt>Modules</dt>
                <dd>{bootstrap?.summary.moduleCount ?? '...'}</dd>
              </div>
              <div>
                <dt>Profils</dt>
                <dd>{bootstrap?.summary.profileCount ?? '...'}</dd>
              </div>
              <div>
                <dt>Comptes</dt>
                <dd>{accounts.length}</dd>
              </div>
              <div>
                <dt>Environnement</dt>
                <dd>{systemInfo?.environment ?? '...'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {currentUser.mustChangePassword ? (
          <section className="status-banner status-banner-warning">
            <strong>Mot de passe provisoire.</strong>
            <span>Le compte bootstrap doit changer de mot de passe dès que l’écran d’administration sera disponible.</span>
          </section>
        ) : null}

        {error ? (
          <section className="status-banner status-banner-error">
            <strong>Chargement incomplet.</strong>
            <span>{error}</span>
          </section>
        ) : (
          <section className="status-banner">
            <strong>Base PostgreSQL initialisée.</strong>
            <span>
              Schémas <code>infra</code> et <code>security</code> actifs, lecture du socle disponible.
            </span>
          </section>
        )}

        <section className="metrics-grid">
          <article className="metric-card metric-card-navy">
            <span className="metric-label">Droits lecture</span>
            <strong>{bootstrap?.summary.rightsByLevel.Read ?? 0}</strong>
          </article>
          <article className="metric-card metric-card-purple">
            <span className="metric-label">Droits écriture</span>
            <strong>{bootstrap?.summary.rightsByLevel.Write ?? 0}</strong>
          </article>
          <article className="metric-card metric-card-gold">
            <span className="metric-label">Utilisateurs actifs</span>
            <strong>{bootstrap?.users.active ?? 0}</strong>
          </article>
          <article className="metric-card metric-card-cyan">
            <span className="metric-label">Serveur UTC</span>
            <strong>{systemInfo ? new Date(systemInfo.serverTimeUtc).toLocaleTimeString() : '--:--:--'}</strong>
          </article>
        </section>

        <section className="workspace-grid">
          <article className="panel-card" id="administration">
            <div className="panel-heading">
              <span className="eyebrow">Navigation</span>
              <h2>Modules V1 ordonnés par entrée</h2>
            </div>
            <div className="group-stack">
              {navigationEntries.map((entry) => (
                <section key={entry} className="group-card" id={entry.toLowerCase().replaceAll(' ', '-')}>
                  <header>
                    <h3>{entry}</h3>
                    <span>{modulesByGroup?.[entry]?.length ?? 0} module(s)</span>
                  </header>
                  <ul className="module-list">
                    {(modulesByGroup?.[entry] ?? []).map((module) => (
                      <li key={module.code}>
                        <span>{module.label}</span>
                        <code>{module.code}</code>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>

          <article className="panel-card" id="exploitation">
            <div className="panel-heading">
              <span className="eyebrow">Profils</span>
              <h2>Droits V1 par profil</h2>
            </div>
            <div className="profile-grid">
              {(bootstrap?.profiles ?? []).map((profile) => (
                <section
                  key={profile.code}
                  className={`profile-card ${profileAccentClass[profile.label] ?? 'accent-navy'}`}
                >
                  <header>
                    <div>
                      <h3>{profile.label}</h3>
                      <p>{profile.code}</p>
                    </div>
                    <span className="profile-badge">
                      {profile.isSystemProfile ? 'Système' : 'Custom'}
                    </span>
                  </header>
                  <ul className="rights-list">
                    {profile.rights.map((right) => (
                      <li key={`${profile.code}-${right.moduleCode}`}>
                        <span>{right.moduleLabel}</span>
                        <strong>{right.accessLevel}</strong>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>

          <article className="panel-card panel-card-wide" id="gestion-administrative">
            <div className="panel-heading">
              <span className="eyebrow">Comptes</span>
              <h2>Administration des accès</h2>
            </div>
            <div className="accounts-table">
              <div className="accounts-table-head">
                <span>Utilisateur</span>
                <span>Profil</span>
                <span>Statut</span>
                <span>Dernière connexion</span>
              </div>
              {accounts.map((account) => (
                <div key={account.id} className="accounts-table-row">
                  <span>
                    <strong>{account.displayName}</strong>
                    <small>{account.login}</small>
                  </span>
                  <span>{account.profile?.label ?? 'Sans profil'}</span>
                  <span>{account.isActive ? 'Actif' : 'Inactif'}</span>
                  <span>{account.lastLoginAtUtc ? new Date(account.lastLoginAtUtc).toLocaleString() : 'Jamais'}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
