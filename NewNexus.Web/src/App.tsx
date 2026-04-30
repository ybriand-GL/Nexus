import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'
import PostLoginBrandTransition from './assets/brand/nexus/05_loading_animation/PostLoginBrandTransition'

type SystemInfo = {
  product: string
  version: string
  environment: string
  basePath: string
  serverTimeUtc: string
}

type ProfileRight = {
  moduleCode: string
  moduleLabel: string
  navigationGroup: string
  accessLevel: string
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

type SecurityModuleItem = {
  id: string
  code: string
  label: string
  navigationGroup: string
  displayOrder: number
  isActive: boolean
}

type SecurityProfileItem = {
  id: string
  code: string
  label: string
  isSystemProfile: boolean
  isActive: boolean
  moduleRights: Array<{
    securityModuleId: string
    moduleCode: string
    moduleLabel: string
    navigationGroup: string
    accessLevel: string
  }>
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

type EditableAccountState = {
  profileId: string
  isActive: boolean
  isSaving: boolean
  error: string | null
}

type EditableProfileState = {
  label: string
  isActive: boolean
  moduleRights: Record<string, string>
  isSaving: boolean
  error: string | null
}

type NewProfileState = {
  label: string
  isActive: boolean
  moduleRights: Record<string, string>
  isSaving: boolean
  error: string | null
}

const navigationEntries = ['Accueil', 'Administration', 'Exploitation', 'Gestion administrative']
const administrationSubmenuEntries = ['Comptes utilisateurs', 'Profils', 'Paramètres', 'Outils'] as const
const postAuthLoaderStorageKey = 'newnexus:post-auth-loader'
const accessLevels = ['None', 'Read', 'Write'] as const

const profileAccentClass: Record<string, string> = {
  Administratif: 'accent-orange',
  Direction: 'accent-cyan',
  Exploitation: 'accent-green',
  Informatique: 'accent-purple',
}

function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [modules, setModules] = useState<SecurityModuleItem[]>([])
  const [profiles, setProfiles] = useState<SecurityProfileItem[]>([])
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [editableAccounts, setEditableAccounts] = useState<Record<string, EditableAccountState>>({})
  const [editableProfiles, setEditableProfiles] = useState<Record<string, EditableProfileState>>({})
  const [newProfile, setNewProfile] = useState<NewProfileState>({
    label: '',
    isActive: true,
    moduleRights: {},
    isSaving: false,
    error: null,
  })
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [showPostAuthLoader, setShowPostAuthLoader] = useState(false)
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [selectedNavigation, setSelectedNavigation] = useState('Accueil')
  const [selectedAdministrationSection, setSelectedAdministrationSection] =
    useState<(typeof administrationSubmenuEntries)[number]>('Profils')
  const [error, setError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [credentials, setCredentials] = useState({
    login: 'admin',
    password: 'NewNexus!2026',
  })

  const isInformatique = currentUser?.profile?.code === 'INFORMATIQUE'

  useEffect(() => {
    void initialize()
  }, [])

  const rightsByModuleCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const right of currentUser?.rights ?? []) {
      map.set(right.moduleCode, right.accessLevel)
    }
    return map
  }, [currentUser])

  const visibleModules = useMemo(() => {
    if (isInformatique && modules.length > 0) {
      return modules.filter((module) => canAccessModule(rightsByModuleCode.get(module.code)))
    }

    return (currentUser?.rights ?? [])
      .filter((right) => canAccessModule(right.accessLevel))
      .map((right, index) => ({
        id: `${right.moduleCode}-${index}`,
        code: right.moduleCode,
        label: right.moduleLabel,
        navigationGroup: right.navigationGroup,
        displayOrder: index,
        isActive: true,
      }))
      .sort(compareModules)
  }, [currentUser, isInformatique, modules, rightsByModuleCode])

  const modulesByGroup = useMemo(() => {
    return visibleModules.reduce<Record<string, SecurityModuleItem[]>>((groups, module) => {
      groups[module.navigationGroup] ??= []
      groups[module.navigationGroup].push(module)
      return groups
    }, {})
  }, [visibleModules])

  const visibleNavigationEntries = useMemo(
    () =>
      navigationEntries.filter(
        (entry) => entry === 'Accueil' || (modulesByGroup[entry] ?? []).length > 0,
      ),
    [modulesByGroup],
  )

  useEffect(() => {
    if (visibleNavigationEntries.length === 0) {
      return
    }

    setSelectedNavigation((current) =>
      visibleNavigationEntries.includes(current) ? current : visibleNavigationEntries[0],
    )
  }, [visibleNavigationEntries])

  useEffect(() => {
    if (modules.length === 0) {
      return
    }

    setNewProfile((current) => ({
      ...current,
      moduleRights: buildDefaultRights(modules, current.moduleRights),
    }))
  }, [modules])

  useEffect(() => {
    if (profiles.length === 0 || modules.length === 0) {
      setEditableProfiles({})
      return
    }

    setEditableProfiles(
      Object.fromEntries(
        profiles.map((profile) => [
          profile.id,
          {
            label: profile.label,
            isActive: profile.isActive,
            moduleRights: buildRightsFromProfile(profile, modules),
            isSaving: false,
            error: null,
          },
        ]),
      ),
    )
  }, [profiles, modules])

  useEffect(() => {
    if (selectedNavigation !== 'Administration' || !isInformatique) {
      return
    }

    setSelectedAdministrationSection((current) =>
      administrationSubmenuEntries.includes(current) ? current : 'Profils',
    )
  }, [isInformatique, selectedNavigation])

  async function initialize() {
    setIsLoading(true)
    setError(null)

    try {
      const systemResponse = await fetch('./api/system/info')
      if (!systemResponse.ok) {
        throw new Error('Impossible de charger les informations système.')
      }

      setSystemInfo((await systemResponse.json()) as SystemInfo)

      const meResponse = await fetch('./api/auth/me')
      if (meResponse.status === 401) {
        resetSessionState()
        return
      }

      if (!meResponse.ok) {
        throw new Error('Impossible de récupérer le compte connecté.')
      }

      const user = (await meResponse.json()) as AuthenticatedUser
      await hydrateAuthenticatedState(user)
      setShowPostAuthLoader(sessionStorage.getItem(postAuthLoaderStorageKey) === 'pending')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally {
      setIsLoading(false)
    }
  }

  async function hydrateAuthenticatedState(user: AuthenticatedUser) {
    setCurrentUser(user)

    if (user.profile?.code === 'INFORMATIQUE') {
      await loadAdminSecurityData()
      return
    }

    setModules([])
    setProfiles([])
    setAccounts([])
    setEditableAccounts({})
    setEditableProfiles({})
  }

  async function loadAdminSecurityData() {
    const [modulesResponse, profilesResponse, accountsResponse] = await Promise.all([
      fetch('./api/security/modules'),
      fetch('./api/security/profiles'),
      fetch('./api/security/accounts'),
    ])

    if (!modulesResponse.ok || !profilesResponse.ok || !accountsResponse.ok) {
      throw new Error('Impossible de charger l’administration de sécurité.')
    }

    const [modulesPayload, profilesPayload, accountsPayload] = await Promise.all([
      modulesResponse.json() as Promise<SecurityModuleItem[]>,
      profilesResponse.json() as Promise<SecurityProfileItem[]>,
      accountsResponse.json() as Promise<AccountItem[]>,
    ])

    setModules(modulesPayload)
    setProfiles(profilesPayload)
    setAccounts(accountsPayload)
    setEditableAccounts(
      Object.fromEntries(
        accountsPayload.map((account) => [
          account.id,
          {
            profileId: account.profile?.id ?? '',
            isActive: account.isActive,
            isSaving: false,
            error: null,
          },
        ]),
      ),
    )
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginError(null)

    try {
      const response = await fetch('./api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      sessionStorage.setItem(postAuthLoaderStorageKey, 'pending')
      setShowPostAuthLoader(true)
      await hydrateAuthenticatedState(user)
    } catch (submitError) {
      setLoginError(submitError instanceof Error ? submitError.message : 'Erreur de connexion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    await fetch('./api/auth/logout', { method: 'POST' })
    sessionStorage.removeItem(postAuthLoaderStorageKey)
    setShowPostAuthLoader(false)
    resetSessionState()
  }

  function resetSessionState() {
    setCurrentUser(null)
    setModules([])
    setProfiles([])
    setAccounts([])
    setEditableAccounts({})
    setEditableProfiles({})
  }

  function updateEditableAccount(accountId: string, updater: (current: EditableAccountState) => EditableAccountState) {
    setEditableAccounts((current) => ({
      ...current,
      [accountId]: updater(
        current[accountId] ?? {
          profileId: '',
          isActive: true,
          isSaving: false,
          error: null,
        },
      ),
    }))
  }

  function handleProfileChange(accountId: string, event: ChangeEvent<HTMLSelectElement>) {
    updateEditableAccount(accountId, (current) => ({
      ...current,
      profileId: event.target.value,
      error: null,
    }))
  }

  function handleActiveChange(accountId: string, event: ChangeEvent<HTMLInputElement>) {
    updateEditableAccount(accountId, (current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  async function handleSaveAccount(accountId: string) {
    const editableAccount = editableAccounts[accountId]
    if (!editableAccount) {
      return
    }

    updateEditableAccount(accountId, (current) => ({ ...current, isSaving: true, error: null }))

    try {
      const [profileResponse, statusResponse] = await Promise.all([
        fetch(`./api/security/accounts/${accountId}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ securityProfileId: editableAccount.profileId || null }),
        }),
        fetch(`./api/security/accounts/${accountId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: editableAccount.isActive }),
        }),
      ])

      if (!profileResponse.ok || !statusResponse.ok) {
        throw new Error('La mise à jour du compte a échoué.')
      }

      await loadAdminSecurityData()
    } catch (saveError) {
      updateEditableAccount(accountId, (current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise à jour.',
      }))
      return
    }

    updateEditableAccount(accountId, (current) => ({ ...current, isSaving: false, error: null }))
  }

  function updateEditableProfile(profileId: string, updater: (current: EditableProfileState) => EditableProfileState) {
    setEditableProfiles((current) => ({
      ...current,
      [profileId]: updater(
        current[profileId] ?? {
          label: '',
          isActive: true,
          moduleRights: buildDefaultRights(modules),
          isSaving: false,
          error: null,
        },
      ),
    }))
  }

  function handleEditableProfileLabelChange(profileId: string, event: ChangeEvent<HTMLInputElement>) {
    updateEditableProfile(profileId, (current) => ({
      ...current,
      label: event.target.value,
      error: null,
    }))
  }

  function handleEditableProfileStatusChange(profileId: string, event: ChangeEvent<HTMLInputElement>) {
    updateEditableProfile(profileId, (current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  function handleEditableProfileRightChange(profileId: string, moduleId: string, event: ChangeEvent<HTMLSelectElement>) {
    updateEditableProfile(profileId, (current) => ({
      ...current,
      moduleRights: {
        ...current.moduleRights,
        [moduleId]: event.target.value,
      },
      error: null,
    }))
  }

  async function handleSaveProfile(profileId: string) {
    const editableProfile = editableProfiles[profileId]
    if (!editableProfile) {
      return
    }

    updateEditableProfile(profileId, (current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(`./api/security/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editableProfile.label,
          isActive: editableProfile.isActive,
          moduleRights: modules.map((module) => ({
            securityModuleId: module.id,
            accessLevel: editableProfile.moduleRights[module.id] ?? 'None',
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('La mise à jour du profil a échoué.')
      }

      await loadAdminSecurityData()
      setEditingProfileId(null)
    } catch (saveError) {
      updateEditableProfile(profileId, (current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise à jour.',
      }))
      return
    }

    updateEditableProfile(profileId, (current) => ({ ...current, isSaving: false, error: null }))
  }

  function handleNewProfileLabelChange(event: ChangeEvent<HTMLInputElement>) {
    setNewProfile((current) => ({
      ...current,
      label: event.target.value,
      error: null,
    }))
  }

  function handleNewProfileStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setNewProfile((current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  function handleNewProfileRightChange(moduleId: string, event: ChangeEvent<HTMLSelectElement>) {
    setNewProfile((current) => ({
      ...current,
      moduleRights: {
        ...current.moduleRights,
        [moduleId]: event.target.value,
      },
      error: null,
    }))
  }

  function openCreateProfileModal() {
    setNewProfile({
      label: '',
      isActive: true,
      moduleRights: buildDefaultRights(modules),
      isSaving: false,
      error: null,
    })
    setIsCreateProfileModalOpen(true)
  }

  function closeCreateProfileModal() {
    if (newProfile.isSaving) {
      return
    }

    setIsCreateProfileModalOpen(false)
    setNewProfile((current) => ({
      ...current,
      error: null,
    }))
  }

  function openEditProfileModal(profileId: string) {
    setEditingProfileId(profileId)
  }

  function closeEditProfileModal() {
    const editableProfile = editingProfileId ? editableProfiles[editingProfileId] : null
    if (editableProfile?.isSaving) {
      return
    }

    setEditingProfileId(null)
  }

  function focusProfileCard(profileId: string) {
    const profileCard = document.getElementById(`profile-card-${profileId}`)
    profileCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewProfile((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch('./api/security/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newProfile.label,
          isActive: newProfile.isActive,
          moduleRights: modules.map((module) => ({
            securityModuleId: module.id,
            accessLevel: newProfile.moduleRights[module.id] ?? 'None',
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('La création du profil a échoué.')
      }

      await loadAdminSecurityData()
      setNewProfile({
        label: '',
        isActive: true,
        moduleRights: buildDefaultRights(modules),
        isSaving: false,
        error: null,
      })
      setIsCreateProfileModalOpen(false)
    } catch (createError) {
      setNewProfile((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de création.',
      }))
    }
  }

  function handlePostAuthLoaderComplete() {
    sessionStorage.removeItem(postAuthLoaderStorageKey)
    setShowPostAuthLoader(false)
  }

  const editingProfile = profiles.find((profile) => profile.id === editingProfileId) ?? null
  const editingEditableProfile = editingProfile ? editableProfiles[editingProfile.id] ?? null : null

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
          <div className="auth-brand-halo" aria-hidden="true" />
          <div className="auth-brand-lockup">
            <img className="auth-groupe-laure-logo" src="./groupe-laure-logo.jpg" alt="Groupe Laure" />
            <div className="auth-brand-divider" aria-hidden="true">×</div>
            <div className="auth-nexus-brand">
              <img className="brand-icon" src="./nexus-app-icon.svg" alt="Nexus" />
              <img className="brand-wordmark auth-wordmark" src="./nexus-wordmark-simplified.png" alt="Nexus" />
            </div>
          </div>
          <span className="eyebrow">Groupe Laure × Nexus</span>
          <h1>Connexion sécurisée</h1>
          <p>Plateforme interne Groupe Laure.</p>
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
          </div>
        </section>
      </div>
    )
  }

  if (showPostAuthLoader) {
    return <PostLoginBrandTransition onComplete={handlePostAuthLoaderComplete} />
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
          {visibleNavigationEntries.map((entry) => (
            <button
              key={entry}
              className={`sidebar-link ${selectedNavigation === entry ? 'sidebar-link-active' : ''}`}
              onClick={() => setSelectedNavigation(entry)}
              type="button"
            >
              {entry}
            </button>
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
        <section className={`hero-card ${selectedNavigation === 'Administration' ? 'hero-card-compact' : ''}`}>
          <div className="hero-copy">
            <span className="eyebrow">{selectedNavigation}</span>
            <h1>{getWorkspaceTitle(selectedNavigation)}</h1>
            <p>{getWorkspaceDescription(selectedNavigation, isInformatique)}</p>
            <div className="hero-actions">
              <span className="primary-chip">Version {systemInfo?.version ?? '0.1.0'}</span>
            </div>
          </div>

          <div className="hero-highlight">
            <div className="hero-highlight-header">
              <span className="eyebrow">Session active</span>
              <span className="status-dot" />
            </div>
            <dl className="hero-stats">
              <div>
                <dt>Modules visibles</dt>
                <dd>{visibleModules.length}</dd>
              </div>
              <div>
                <dt>Droits lecture</dt>
                <dd>{currentUser.rights.filter((right) => right.accessLevel === 'Read').length}</dd>
              </div>
              <div>
                <dt>Droits écriture</dt>
                <dd>{currentUser.rights.filter((right) => right.accessLevel === 'Write').length}</dd>
              </div>
              <div>
                <dt>Environnement</dt>
                <dd>{systemInfo?.environment ?? '...'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {selectedNavigation === 'Administration' && isInformatique ? (
          <section className="admin-subnav" aria-label="Sous-menu administration">
            {administrationSubmenuEntries.map((entry) => (
              <button
                key={entry}
                className={`admin-subnav-link ${selectedAdministrationSection === entry ? 'admin-subnav-link-active' : ''}`}
                onClick={() => setSelectedAdministrationSection(entry)}
                type="button"
              >
                {entry}
              </button>
            ))}
          </section>
        ) : null}

        {error ? (
          <section className="status-banner status-banner-error">
            <strong>Chargement incomplet.</strong>
            <span>{error}</span>
          </section>
        ) : null}

        {!error && visibleModules.length === 0 ? (
          <section className="status-banner status-banner-warning">
            <strong>Aucun accès métier disponible.</strong>
            <span>Ce compte existe, mais aucun droit lecture/écriture n’est encore attribué.</span>
          </section>
        ) : null}

        {selectedNavigation === 'Accueil' ? (
          <section className="dashboard-stack">
            <section className="metrics-grid">
              <article className="metric-card metric-card-navy">
                <span className="metric-label">Modules visibles</span>
                <strong>{visibleModules.length}</strong>
              </article>
              <article className="metric-card metric-card-purple">
                <span className="metric-label">Profils actifs</span>
                <strong>{profiles.filter((profile) => profile.isActive).length}</strong>
              </article>
              <article className="metric-card metric-card-gold">
                <span className="metric-label">Comptes actifs</span>
                <strong>{accounts.filter((account) => account.isActive).length}</strong>
              </article>
              <article className="metric-card metric-card-cyan">
                <span className="metric-label">Rôle courant</span>
                <strong>{currentUser.profile?.label ?? 'Sans profil'}</strong>
              </article>
            </section>

            <section className="workspace-grid">
              <article className="panel-card">
                <div className="panel-heading">
                  <span className="eyebrow">Accès rapides</span>
                  <h2>Espaces disponibles</h2>
                </div>
                <div className="dashboard-actions">
                  {visibleNavigationEntries
                    .filter((entry) => entry !== 'Accueil')
                    .map((entry) => (
                      <button
                        key={entry}
                        className="dashboard-action-card"
                        onClick={() => setSelectedNavigation(entry)}
                        type="button"
                      >
                        <span className="eyebrow">{entry}</span>
                        <strong>{getWorkspaceTitle(entry)}</strong>
                        <p>{getWorkspaceDescription(entry, isInformatique)}</p>
                      </button>
                    ))}
                </div>
              </article>

              <article className="panel-card">
                <div className="panel-heading">
                  <span className="eyebrow">Synthèse</span>
                  <h2>Lecture de votre session</h2>
                </div>
                <ul className="rights-list">
                  <li>
                    <span>Utilisateur connecté</span>
                    <strong>{currentUser.displayName}</strong>
                  </li>
                  <li>
                    <span>Profil actif</span>
                    <strong>{currentUser.profile?.label ?? 'Sans profil'}</strong>
                  </li>
                  <li>
                    <span>Droits en lecture</span>
                    <strong>{currentUser.rights.filter((right) => right.accessLevel === 'Read').length}</strong>
                  </li>
                  <li>
                    <span>Droits en écriture</span>
                    <strong>{currentUser.rights.filter((right) => right.accessLevel === 'Write').length}</strong>
                  </li>
                </ul>
              </article>
            </section>
          </section>
        ) : null}

        {selectedNavigation === 'Exploitation' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Exploitation</span>
                <h2>Modules de travail</h2>
              </div>
              <div className="group-stack">
                <section className="group-card">
                  <header>
                    <h3>Exploitation</h3>
                    <span>{modulesByGroup.Exploitation?.length ?? 0} module(s)</span>
                  </header>
                  <ul className="module-list">
                    {(modulesByGroup.Exploitation ?? []).map((module) => (
                      <li key={module.code}>
                        <span>{module.label}</span>
                        <code>{translateAccessLevel(rightsByModuleCode.get(module.code) ?? 'None')}</code>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Gestion administrative' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Gestion administrative</span>
                <h2>Modules de travail</h2>
              </div>
              <div className="group-stack">
                <section className="group-card">
                  <header>
                    <h3>Gestion administrative</h3>
                    <span>{modulesByGroup['Gestion administrative']?.length ?? 0} module(s)</span>
                  </header>
                  <ul className="module-list">
                    {(modulesByGroup['Gestion administrative'] ?? []).map((module) => (
                      <li key={module.code}>
                        <span>{module.label}</span>
                        <code>{translateAccessLevel(rightsByModuleCode.get(module.code) ?? 'None')}</code>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Profils' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide administration-synthesis-card">
              <div className="panel-heading">
                <span className="eyebrow">Synthèse</span>
                <h2>Profils et droits</h2>
              </div>
              <div className="administration-synthesis-layout">
                <div className="administration-synthesis-copy">
                  <p className="profiles-toolbar-copy">
                    Chaque profil affiche ses droits par module. Cliquez sur un nom pour atteindre la vignette correspondante,
                    puis ouvrez directement sa configuration.
                  </p>
                  <div className="profiles-quick-links" aria-label="Liste des profils configurés">
                    {profiles.map((profile) => (
                      <button
                        key={`link-${profile.id}`}
                        className="profile-link-chip"
                        onClick={() => focusProfileCard(profile.id)}
                        type="button"
                      >
                        {profile.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="administration-synthesis-actions">
                  <button className="primary-button" onClick={openCreateProfileModal} type="button">
                    Ajouter un profil
                  </button>
                </div>
              </div>
            </article>

            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Profils</span>
                <h2>Vue d'ensemble des profils</h2>
              </div>
              <div className="profiles-overview-grid">
                {profiles.map((profile) => {
                  const editableProfile = editableProfiles[profile.id]
                  if (!editableProfile) {
                    return null
                  }

                  return (
                    <article
                      id={`profile-card-${profile.id}`}
                      key={profile.id}
                      className={`profile-summary-card ${profileAccentClass[profile.label] ?? 'accent-navy'}`}
                    >
                      <header className="profile-summary-header">
                        <div>
                          <h3>{profile.label}</h3>
                        </div>
                        <span className={`profile-status-badge ${editableProfile.isActive ? 'is-active' : 'is-inactive'}`}>
                          {editableProfile.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </header>
                      <div className="profile-summary-rights">
                        {modules.map((module) => (
                          <div key={`${profile.id}-${module.id}`} className="profile-summary-right">
                            <span>{module.label}</span>
                            <strong className={`access-pill access-${(editableProfile.moduleRights[module.id] ?? 'None').toLowerCase()}`}>
                              {translateAccessLevel(editableProfile.moduleRights[module.id] ?? 'None')}
                            </strong>
                          </div>
                        ))}
                      </div>
                      <div className="profile-summary-actions">
                        <button className="secondary-button" onClick={() => openEditProfileModal(profile.id)} type="button">
                          Configurer le profil
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Comptes utilisateurs' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Comptes</span>
                <h2>Administration des accès utilisateurs</h2>
              </div>
              <div className="accounts-table">
                <div className="accounts-table-head">
                  <span>Utilisateur</span>
                  <span>Profil</span>
                  <span>Statut</span>
                  <span>Dernière connexion</span>
                  <span>Actions</span>
                </div>
                {accounts.map((account) => {
                  const editableAccount = editableAccounts[account.id]
                  return (
                    <div key={account.id} className="accounts-table-row">
                      <span>
                        <strong>{account.displayName}</strong>
                        <small>{account.login}</small>
                      </span>

                      <span className="account-edit-cell">
                        <select value={editableAccount?.profileId ?? ''} onChange={(event) => handleProfileChange(account.id, event)}>
                          <option value="">Sans profil</option>
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.label}
                            </option>
                          ))}
                        </select>
                      </span>

                      <span className="account-edit-cell">
                        <label className="toggle-label">
                          <input
                            checked={editableAccount?.isActive ?? account.isActive}
                            onChange={(event) => handleActiveChange(account.id, event)}
                            type="checkbox"
                          />
                          <span>{editableAccount?.isActive ?? account.isActive ? 'Actif' : 'Inactif'}</span>
                        </label>
                      </span>

                      <span>{account.lastLoginAtUtc ? new Date(account.lastLoginAtUtc).toLocaleString() : 'Jamais'}</span>

                      <span className="account-edit-cell">
                        <button
                          className="secondary-button"
                          disabled={editableAccount?.isSaving}
                          onClick={() => void handleSaveAccount(account.id)}
                          type="button"
                        >
                          {editableAccount?.isSaving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        {editableAccount?.error ? <small className="account-error">{editableAccount.error}</small> : null}
                      </span>
                    </div>
                  )
                })}
              </div>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Paramètres' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Paramètres</span>
                <h2>Socle de paramétrage</h2>
              </div>
              <p>
                Cette section accueillera les paramètres transverses de NewNexus. Le cadrage fonctionnel reste à finaliser
                avant implémentation.
              </p>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Outils' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Outils</span>
                <h2>Outils d’administration</h2>
              </div>
              <p>
                Cette section accueillera les outils d’exploitation technique et de maintenance. Le contenu sera ajouté avec
                le lot d’outillage.
              </p>
            </article>
          </section>
        ) : null}

        {isCreateProfileModalOpen ? (
          <div className="modal-overlay" onClick={closeCreateProfileModal} role="presentation">
            <section
              aria-labelledby="create-profile-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">Création</span>
                  <h2 id="create-profile-title">Ajouter un profil</h2>
                </div>
                <button className="modal-close-button" onClick={closeCreateProfileModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="profile-creation-card" onSubmit={handleCreateProfile}>
                <div className="profile-form-grid profile-form-grid-2">
                  <label>
                    <span>Libellé profil</span>
                    <input value={newProfile.label} onChange={handleNewProfileLabelChange} />
                  </label>
                  <label className="toggle-label profile-toggle">
                    <input checked={newProfile.isActive} onChange={handleNewProfileStatusChange} type="checkbox" />
                    <span>Profil actif</span>
                  </label>
                </div>

                <div className="profile-form-note">
                  Le code technique du profil est généré automatiquement à partir du libellé.
                </div>

                <div className="rights-editor-grid">
                  {modules.map((module) => (
                    <label key={`new-${module.id}`} className="rights-editor-row">
                      <span>{module.label}</span>
                      <select
                        value={newProfile.moduleRights[module.id] ?? 'None'}
                        onChange={(event) => handleNewProfileRightChange(module.id, event)}
                      >
                        {accessLevels.map((accessLevel) => (
                          <option key={accessLevel} value={accessLevel}>
                            {translateAccessLevel(accessLevel)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div className="profile-action-row">
                  <button className="primary-button" disabled={newProfile.isSaving} type="submit">
                    {newProfile.isSaving ? 'Création…' : 'Créer le profil'}
                  </button>
                  {newProfile.error ? <small className="account-error">{newProfile.error}</small> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {editingProfile && editingEditableProfile ? (
          <div className="modal-overlay" onClick={closeEditProfileModal} role="presentation">
            <section
              aria-labelledby="edit-profile-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">Configuration</span>
                  <h2 id="edit-profile-title">Configurer le profil</h2>
                </div>
                <button className="modal-close-button" onClick={closeEditProfileModal} type="button">
                  Fermer
                </button>
              </div>

              <section className={`profile-editor-card ${profileAccentClass[editingProfile.label] ?? 'accent-navy'}`}>
                <header className="profile-editor-header">
                  <div>
                    <h3>{editingProfile.label}</h3>
                    <p>{editingProfile.code}</p>
                  </div>
                  <label className="toggle-label profile-toggle">
                    <input
                      checked={editingEditableProfile.isActive}
                      onChange={(event) => handleEditableProfileStatusChange(editingProfile.id, event)}
                      type="checkbox"
                    />
                    <span>{editingEditableProfile.isActive ? 'Actif' : 'Inactif'}</span>
                  </label>
                </header>

                <label className="profile-label-field">
                  <span>Libellé</span>
                  <input
                    value={editingEditableProfile.label}
                    onChange={(event) => handleEditableProfileLabelChange(editingProfile.id, event)}
                  />
                </label>

                <div className="rights-editor-grid">
                  {modules.map((module) => (
                    <label key={`${editingProfile.id}-${module.id}`} className="rights-editor-row">
                      <span>{module.label}</span>
                      <select
                        value={editingEditableProfile.moduleRights[module.id] ?? 'None'}
                        onChange={(event) => handleEditableProfileRightChange(editingProfile.id, module.id, event)}
                      >
                        {accessLevels.map((accessLevel) => (
                          <option key={accessLevel} value={accessLevel}>
                            {translateAccessLevel(accessLevel)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div className="profile-action-row">
                  <button
                    className="secondary-button"
                    disabled={editingEditableProfile.isSaving}
                    onClick={() => void handleSaveProfile(editingProfile.id)}
                    type="button"
                  >
                    {editingEditableProfile.isSaving ? 'Enregistrement…' : 'Enregistrer le profil'}
                  </button>
                  {editingEditableProfile.error ? <small className="account-error">{editingEditableProfile.error}</small> : null}
                </div>
              </section>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}

function canAccessModule(accessLevel: string | undefined) {
  return accessLevel === 'Read' || accessLevel === 'Write'
}

function compareModules(left: SecurityModuleItem, right: SecurityModuleItem) {
  const leftGroupIndex = navigationEntries.indexOf(left.navigationGroup)
  const rightGroupIndex = navigationEntries.indexOf(right.navigationGroup)
  if (leftGroupIndex !== rightGroupIndex) {
    return leftGroupIndex - rightGroupIndex
  }

  if (left.displayOrder !== right.displayOrder) {
    return left.displayOrder - right.displayOrder
  }

  return left.label.localeCompare(right.label, 'fr')
}

function buildDefaultRights(modules: SecurityModuleItem[], current?: Record<string, string>) {
  return Object.fromEntries(modules.map((module) => [module.id, current?.[module.id] ?? 'None']))
}

function buildRightsFromProfile(profile: SecurityProfileItem, modules: SecurityModuleItem[]) {
  return Object.fromEntries(
    modules.map((module) => [
      module.id,
      profile.moduleRights.find((right) => right.securityModuleId === module.id)?.accessLevel ?? 'None',
    ]),
  )
}

function translateAccessLevel(accessLevel: string) {
  switch (accessLevel) {
    case 'Read':
      return 'Lecture'
    case 'Write':
      return 'Écriture'
    default:
      return 'Aucun'
  }
}

function getWorkspaceTitle(selectedNavigation: string) {
  if (selectedNavigation === 'Accueil') {
    return 'Accueil'
  }

  if (selectedNavigation === 'Administration') {
    return 'Administration'
  }

  if (selectedNavigation === 'Gestion administrative') {
    return 'Accès aux modules de gestion administrative.'
  }

  return 'Accès aux modules d’exploitation.'
}

function getWorkspaceDescription(selectedNavigation: string, isInformatique: boolean) {
  if (selectedNavigation === 'Accueil') {
    return 'Vue d’ensemble personnalisée après connexion, avec accès directs vers vos espaces de travail.'
  }

  if (selectedNavigation === 'Administration') {
    return isInformatique
      ? 'Profils, comptes utilisateurs, paramètres et outils d’administration.'
      : 'Cette entrée est réservée à l’administration.'
  }

  if (selectedNavigation === 'Gestion administrative') {
    return 'Cette vue présente uniquement les modules réellement accessibles dans le périmètre administratif.'
  }

  return 'Cette vue présente uniquement les modules réellement accessibles dans le périmètre exploitation.'
}

export default App


