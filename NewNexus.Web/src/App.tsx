import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'
import PostLoginBrandTransition from './assets/brand/nexus/05_loading_animation/PostLoginBrandTransition'
import nexusIcon from './assets/brand/nexus_icon_figma_clean.svg'
import nexusWordmark from './assets/brand/nexus_wordmark_figma_clean.svg'

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

type CompanyItem = {
  id: string
  siren: string
  displayName: string
  legalName: string
  isActive: boolean
  createdAtUtc: string
}

type SireneCompanyLookup = {
  siren: string
  siret: string | null
  displayName: string | null
  legalName: string | null
  naf: string | null
  source: string
}

type AdminDiagnostics = {
  application: {
    product: string
    version: string
    environment: string
    basePath: string
    serverTimeUtc: string
  }
  database: {
    status: string
    canConnect: boolean
    provider: string | null
  }
  security: {
    profileCount: number
    accountCount: number
  }
  settings: {
    companyCount: number
    analyticCount: number
    exploitationCount: number
  }
  integrations: {
    sirene: {
      status: string
      provider: string
    }
  }
}

type IntegrationCredentialItem = {
  id: string | null
  providerCode: string
  providerLabel: string
  keyName: string
  displayName: string
  isSecret: boolean
  hasValue: boolean
  maskedValue: string | null
  value: string | null
  isActive: boolean
  notes: string | null
  createdAtUtc: string | null
  updatedAtUtc: string | null
  lastImportedAtUtc: string | null
  isConfigured: boolean
}

type AnalyticItem = {
  id: string
  code: string
  label: string
  isActive: boolean
  company: {
    id: string
    siren: string
    displayName: string
  }
}

type ExploitationItem = {
  id: string
  code: string
  label: string
  isActive: boolean
  company: {
    id: string
    siren: string
    displayName: string
  }
}

type EditableAccountState = {
  login: string
  displayName: string
  email: string
  employeeNumber: string
  password: string
  profileId: string
  isActive: boolean
  mustChangePassword: boolean
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

type SettingsReferenceFormState = {
  code: string
  label: string
  companyId: string
  isActive: boolean
  isSaving: boolean
  error: string | null
}

type CompanyFormState = {
  siren: string
  displayName: string
  legalName: string
  isActive: boolean
  isSaving: boolean
  error: string | null
}

type ChangePasswordState = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  isSaving: boolean
  error: string | null
}

type IntegrationCredentialFormState = {
  selectedKey: string
  providerCode: string
  providerLabel: string
  keyName: string
  displayName: string
  value: string
  isSecret: boolean
  isActive: boolean
  notes: string
  isSaving: boolean
  error: string | null
}

const navigationEntries = ['Accueil', 'Administration', 'Exploitation', 'Gestion administrative']
const administrationSubmenuEntries = ['Accueil', 'Comptes utilisateurs', 'Profils', 'Paramètres', 'Outils'] as const
const settingsSubmenuEntries = ['Accueil', 'Sociétés', 'Analytiques', 'Exploitations'] as const
const hiddenIntegrationProviderCodes = new Set(['LEGACY_NEXUS', 'TRACTOR_TRACKING'])
const toolsSubmenuEntries = ['Accueil', 'Clés API', 'Tâches planifiées', 'Requêteur SQL', 'Traces', 'Diagnostics'] as const
const postAuthLoaderStorageKey = 'newnexus:post-auth-loader'
const accessLevels = ['None', 'Read', 'Write'] as const
const apiBasePath = import.meta.env.BASE_URL || '/'

const profileAccentClass: Record<string, string> = {
  Administratif: 'accent-orange',
  Direction: 'accent-cyan',
  Exploitation: 'accent-green',
  Informatique: 'accent-champagne',
}

function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [modules, setModules] = useState<SecurityModuleItem[]>([])
  const [profiles, setProfiles] = useState<SecurityProfileItem[]>([])
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [analytics, setAnalytics] = useState<AnalyticItem[]>([])
  const [exploitations, setExploitations] = useState<ExploitationItem[]>([])
  const [adminDiagnostics, setAdminDiagnostics] = useState<AdminDiagnostics | null>(null)
  const [integrationCredentials, setIntegrationCredentials] = useState<IntegrationCredentialItem[]>([])
  const [editableAccounts, setEditableAccounts] = useState<Record<string, EditableAccountState>>({})
  const [editableProfiles, setEditableProfiles] = useState<Record<string, EditableProfileState>>({})
  const [editableCompanies, setEditableCompanies] = useState<Record<string, CompanyFormState>>({})
  const [editableAnalytics, setEditableAnalytics] = useState<Record<string, SettingsReferenceFormState>>({})
  const [editableExploitations, setEditableExploitations] = useState<Record<string, SettingsReferenceFormState>>({})
  const [newAccount, setNewAccount] = useState<EditableAccountState>(createEmptyAccountForm())
  const [newProfile, setNewProfile] = useState<NewProfileState>({
    label: '',
    isActive: true,
    moduleRights: {},
    isSaving: false,
    error: null,
  })
  const [newCompany, setNewCompany] = useState<CompanyFormState>(createEmptyCompanyForm())
  const [newAnalytic, setNewAnalytic] = useState<SettingsReferenceFormState>(createEmptySettingsReferenceForm())
  const [newExploitation, setNewExploitation] = useState<SettingsReferenceFormState>(createEmptySettingsReferenceForm())
  const [changePassword, setChangePassword] = useState<ChangePasswordState>(createEmptyChangePasswordForm())
  const [credentialForm, setCredentialForm] = useState<IntegrationCredentialFormState>(createEmptyIntegrationCredentialForm())
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [showPostAuthLoader, setShowPostAuthLoader] = useState(false)
  const [isLookingUpNewCompany, setIsLookingUpNewCompany] = useState(false)
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false)
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false)
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [selectedNavigation, setSelectedNavigation] = useState('Accueil')
  const [selectedAdministrationSection, setSelectedAdministrationSection] =
    useState<(typeof administrationSubmenuEntries)[number]>('Accueil')
  const [selectedSettingsSection, setSelectedSettingsSection] =
    useState<(typeof settingsSubmenuEntries)[number]>('Accueil')
  const [selectedToolsSection, setSelectedToolsSection] =
    useState<(typeof toolsSubmenuEntries)[number]>('Accueil')
  const [error, setError] = useState<string | null>(null)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date())
  const [credentials, setCredentials] = useState({
    login: '',
    password: '',
  })

  const isInformatique = currentUser?.profile?.code === 'INFORMATIQUE'

  useEffect(() => {
    void initialize()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showPostAuthLoader) {
      return
    }

    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(postAuthLoaderStorageKey)
      setShowPostAuthLoader(false)
    }, 4300)

    return () => window.clearTimeout(timer)
  }, [showPostAuthLoader])

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

  const visibleIntegrationCredentials = useMemo(
    () => integrationCredentials.filter(shouldDisplayIntegrationCredential),
    [integrationCredentials],
  )

  const credentialSummary = useMemo(() => {
    const configured = visibleIntegrationCredentials.filter((credential) => credential.hasValue).length
    const secrets = visibleIntegrationCredentials.filter((credential) => credential.hasValue && credential.isSecret).length
    const active = visibleIntegrationCredentials.filter((credential) => credential.isActive && credential.hasValue).length
    const providers = new Set(visibleIntegrationCredentials.map((credential) => credential.providerCode)).size

    return { active, configured, secrets, providers }
  }, [visibleIntegrationCredentials])

  const credentialsByProvider = useMemo(() => {
    const grouped = new Map<
      string,
      {
        providerCode: string
        providerLabel: string
        configuredCount: number
        totalCount: number
        secretCount: number
      }
    >()

    for (const credential of visibleIntegrationCredentials) {
      const current = grouped.get(credential.providerCode) ?? {
        providerCode: credential.providerCode,
        providerLabel: credential.providerLabel,
        configuredCount: 0,
        totalCount: 0,
        secretCount: 0,
      }

      current.totalCount += 1
      current.configuredCount += credential.hasValue ? 1 : 0
      current.secretCount += credential.isSecret ? 1 : 0
      grouped.set(credential.providerCode, current)
    }

    return Array.from(grouped.values()).sort((left, right) => left.providerLabel.localeCompare(right.providerLabel))
  }, [visibleIntegrationCredentials])

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
    setEditableAccounts(
      Object.fromEntries(
        accounts.map((account) => [
          account.id,
          {
            login: account.login,
            displayName: account.displayName,
            email: account.email ?? '',
            employeeNumber: account.employeeNumber ?? '',
            password: '',
            profileId: account.profile?.id ?? '',
            isActive: account.isActive,
            mustChangePassword: account.mustChangePassword,
            isSaving: false,
            error: null,
          },
        ]),
      ),
    )
  }, [accounts])

  useEffect(() => {
    setEditableCompanies(
      Object.fromEntries(
        companies.map((company) => [
          company.id,
          {
            siren: company.siren,
            displayName: company.displayName,
            legalName: company.legalName,
            isActive: company.isActive,
            isSaving: false,
            error: null,
          },
        ]),
      ),
    )
    setNewAnalytic((current) => ({
      ...current,
      companyId: current.companyId || companies[0]?.id || '',
    }))
    setNewExploitation((current) => ({
      ...current,
      companyId: current.companyId || companies[0]?.id || '',
    }))
  }, [companies])

  useEffect(() => {
    setEditableAnalytics(
      Object.fromEntries(
        analytics.map((analytic) => [
          analytic.id,
          {
            code: analytic.code,
            label: analytic.label,
            companyId: analytic.company.id,
            isActive: analytic.isActive,
            isSaving: false,
            error: null,
          },
        ]),
      ),
    )
  }, [analytics])

  useEffect(() => {
    setEditableExploitations(
      Object.fromEntries(
        exploitations.map((exploitation) => [
          exploitation.id,
          {
            code: exploitation.code,
            label: exploitation.label,
            companyId: exploitation.company.id,
            isActive: exploitation.isActive,
            isSaving: false,
            error: null,
          },
        ]),
      ),
    )
  }, [exploitations])

  useEffect(() => {
    if (selectedNavigation !== 'Administration' || !isInformatique) {
      return
    }

    setSelectedAdministrationSection((current) =>
      administrationSubmenuEntries.includes(current) ? current : 'Accueil',
    )
  }, [isInformatique, selectedNavigation])

  useEffect(() => {
    if (selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Outils') {
      void loadAdminToolsData()
    }
  }, [isInformatique, selectedAdministrationSection, selectedNavigation])

  async function initialize() {
    setIsLoading(true)
    setError(null)

    try {
      const systemResponse = await fetch(apiPath('api/system/info'))
      if (!systemResponse.ok) {
        throw new Error('Impossible de charger les informations système.')
      }

      setSystemInfo((await systemResponse.json()) as SystemInfo)

      const meResponse = await fetch(apiPath('api/auth/me'))
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
    setCompanies([])
    setAnalytics([])
    setExploitations([])
    setAdminDiagnostics(null)
    setIntegrationCredentials([])
    setEditableAccounts({})
    setEditableProfiles({})
    setEditableCompanies({})
    setEditableAnalytics({})
    setEditableExploitations({})
  }

  async function loadAdminSecurityData() {
    const [modulesResponse, profilesResponse, accountsResponse, settingsResponse] = await Promise.all([
      fetch(apiPath('api/security/modules')),
      fetch(apiPath('api/security/profiles')),
      fetch(apiPath('api/security/accounts')),
      fetch(apiPath('api/settings/bootstrap')),
    ])

    if (!modulesResponse.ok || !profilesResponse.ok || !accountsResponse.ok || !settingsResponse.ok) {
      throw new Error('Impossible de charger l’administration de sécurité.')
    }

    const [modulesPayload, profilesPayload, accountsPayload, settingsPayload] = await Promise.all([
      modulesResponse.json() as Promise<SecurityModuleItem[]>,
      profilesResponse.json() as Promise<SecurityProfileItem[]>,
      accountsResponse.json() as Promise<AccountItem[]>,
      settingsResponse.json() as Promise<{
        companies: CompanyItem[]
        analytics: AnalyticItem[]
        exploitations: ExploitationItem[]
      }>,
    ])

    setModules(modulesPayload)
    setProfiles(profilesPayload)
    setAccounts(accountsPayload)
    setCompanies(settingsPayload.companies)
    setAnalytics(settingsPayload.analytics)
    setExploitations(settingsPayload.exploitations)
  }

  async function loadAdminToolsData() {
    await Promise.all([loadAdminDiagnostics(), loadIntegrationCredentials()])
  }

  async function loadAdminDiagnostics() {
    setDiagnosticsError(null)

    try {
      const response = await fetch(apiPath('api/admin/diagnostics'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les diagnostics.'))
      }

      setAdminDiagnostics((await response.json()) as AdminDiagnostics)
    } catch (diagnosticsLoadError) {
      setDiagnosticsError(
        diagnosticsLoadError instanceof Error ? diagnosticsLoadError.message : 'Erreur de chargement des diagnostics.',
      )
    }
  }

  async function loadIntegrationCredentials() {
    setCredentialsError(null)

    try {
      const response = await fetch(apiPath('api/admin/integrations/credentials'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les clés API.'))
      }

      const payload = (await response.json()) as IntegrationCredentialItem[]
      setIntegrationCredentials(payload)
      setCredentialForm((current) =>
        current.selectedKey ? current : buildCredentialFormFromItem(payload[0] ?? null),
      )
    } catch (credentialsLoadError) {
      setCredentialsError(
        credentialsLoadError instanceof Error ? credentialsLoadError.message : 'Erreur de chargement des clés API.',
      )
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginError(null)

    try {
      const response = await fetch(apiPath('api/auth/login'), {
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
      await hydrateAuthenticatedState(user)
      sessionStorage.setItem(postAuthLoaderStorageKey, 'pending')
      setShowPostAuthLoader(true)
    } catch (submitError) {
      setLoginError(submitError instanceof Error ? submitError.message : 'Erreur de connexion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    await fetch(apiPath('api/auth/logout'), { method: 'POST' })
    sessionStorage.removeItem(postAuthLoaderStorageKey)
    setShowPostAuthLoader(false)
    resetSessionState()
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChangePassword((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changePassword.currentPassword,
          newPassword: changePassword.newPassword,
          confirmPassword: changePassword.confirmPassword,
        }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Le changement de mot de passe a echoue.'))
      }

      const user = (await response.json()) as AuthenticatedUser
      setChangePassword(createEmptyChangePasswordForm())
      await hydrateAuthenticatedState(user)
    } catch (submitError) {
      setChangePassword((current) => ({
        ...current,
        isSaving: false,
        error: submitError instanceof Error ? submitError.message : 'Erreur de changement de mot de passe.',
      }))
    }
  }

  function handleChangePasswordFieldChange(
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setChangePassword((current) => ({
      ...current,
      [field]: event.target.value,
      error: null,
    }))
  }

  function resetSessionState() {
    setCurrentUser(null)
    setModules([])
    setProfiles([])
    setAccounts([])
    setCompanies([])
    setAnalytics([])
    setExploitations([])
    setIntegrationCredentials([])
    setEditableAccounts({})
    setEditableProfiles({})
    setEditableCompanies({})
    setEditableAnalytics({})
    setEditableExploitations({})
    setChangePassword(createEmptyChangePasswordForm())
    setCredentialForm(createEmptyIntegrationCredentialForm())
    setDiagnosticsError(null)
    setCredentialsError(null)
  }

  function handleCredentialSelectionChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedKey = event.target.value
    const credential = visibleIntegrationCredentials.find((item) => buildIntegrationCredentialKey(item) === selectedKey) ?? null
    setCredentialForm(buildCredentialFormFromItem(credential))
  }

  function openCreateCredentialModal() {
    setCredentialForm(createEmptyIntegrationCredentialForm())
    setIsCredentialModalOpen(true)
  }

  function openConfigureCredentialModal(providerCode: string) {
    const credential =
      visibleIntegrationCredentials.find(
        (item) => item.providerCode === providerCode && (item.hasValue || item.keyName.includes('API_KEY')),
      ) ??
      visibleIntegrationCredentials.find((item) => item.providerCode === providerCode) ??
      null

    setCredentialForm(buildCredentialFormFromItem(credential))
    setIsCredentialModalOpen(true)
  }

  function closeCredentialModal() {
    setIsCredentialModalOpen(false)
    setCredentialForm(createEmptyIntegrationCredentialForm())
  }

  function handleCredentialFormFieldChange(
    field: 'providerCode' | 'providerLabel' | 'keyName' | 'displayName' | 'value' | 'notes',
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setCredentialForm((current) => ({
      ...current,
      [field]: event.target.value,
      selectedKey: field === 'providerCode' || field === 'keyName' ? '' : current.selectedKey,
      error: null,
    }))
  }

  function handleCredentialFormBooleanChange(field: 'isSecret' | 'isActive', event: ChangeEvent<HTMLInputElement>) {
    setCredentialForm((current) => ({
      ...current,
      [field]: event.target.checked,
      error: null,
    }))
  }

  async function handleCredentialFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCredentialForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/admin/integrations/credentials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerCode: credentialForm.providerCode,
          providerLabel: credentialForm.providerLabel,
          keyName: credentialForm.keyName,
          displayName: credentialForm.displayName,
          value: credentialForm.value,
          isSecret: credentialForm.isSecret,
          isActive: credentialForm.isActive,
          notes: credentialForm.notes,
        }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'L’enregistrement de la clé API a échoué.'))
      }

      await loadIntegrationCredentials()
      closeCredentialModal()
    } catch (saveError) {
      setCredentialForm((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur d’enregistrement.',
      }))
    }
  }

  function updateEditableAccount(accountId: string, updater: (current: EditableAccountState) => EditableAccountState) {
    setEditableAccounts((current) => ({
      ...current,
      [accountId]: updater(current[accountId] ?? createEmptyAccountForm()),
    }))
  }

  function handleEditableAccountFieldChange(
    accountId: string,
    field: 'login' | 'displayName' | 'email' | 'employeeNumber' | 'password' | 'profileId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    updateEditableAccount(accountId, (current) => ({
      ...current,
      [field]: event.target.value,
      error: null,
    }))
  }

  function handleEditableAccountBooleanChange(
    accountId: string,
    field: 'isActive' | 'mustChangePassword',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    updateEditableAccount(accountId, (current) => ({
      ...current,
      [field]: event.target.checked,
      error: null,
    }))
  }

  function handleNewAccountFieldChange(
    field: 'login' | 'displayName' | 'email' | 'employeeNumber' | 'password' | 'profileId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setNewAccount((current) => ({
      ...current,
      [field]: event.target.value,
      error: null,
    }))
  }

  function handleNewAccountBooleanChange(field: 'isActive' | 'mustChangePassword', event: ChangeEvent<HTMLInputElement>) {
    setNewAccount((current) => ({
      ...current,
      [field]: event.target.checked,
      error: null,
    }))
  }

  function openCreateAccountModal() {
    setNewAccount(createEmptyAccountForm())
    setIsCreateAccountModalOpen(true)
  }

  function closeCreateAccountModal() {
    if (newAccount.isSaving) {
      return
    }

    setIsCreateAccountModalOpen(false)
    setNewAccount((current) => ({ ...current, error: null }))
  }

  function openEditAccountModal(accountId: string) {
    setEditingAccountId(accountId)
  }

  function closeEditAccountModal() {
    const editableAccount = editingAccountId ? editableAccounts[editingAccountId] : null
    if (editableAccount?.isSaving) {
      return
    }

    setEditingAccountId(null)
  }

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewAccount((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/security/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAccountPayload(newAccount, true)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La creation du compte a echoue.'))
      }

      await loadAdminSecurityData()
      setNewAccount(createEmptyAccountForm())
      setIsCreateAccountModalOpen(false)
    } catch (createError) {
      setNewAccount((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de creation.',
      }))
    }
  }

  async function handleSaveAccount(accountId: string) {
    const editableAccount = editableAccounts[accountId]
    if (!editableAccount) {
      return
    }

    updateEditableAccount(accountId, (current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(`api/security/accounts/${accountId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAccountPayload(editableAccount, false)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise a jour du compte a echoue.'))
      }

      await loadAdminSecurityData()
    } catch (saveError) {
      updateEditableAccount(accountId, (current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise a jour.',
      }))
      return
    }

    updateEditableAccount(accountId, (current) => ({ ...current, isSaving: false, error: null }))
    setEditingAccountId(null)
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
      const response = await fetch(apiPath(`api/security/profiles/${profileId}`), {
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
      const response = await fetch(apiPath('api/security/profiles'), {
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

  function handleNewCompanyFieldChange(
    field: 'siren' | 'displayName' | 'legalName',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setNewCompany((current) => ({
      ...current,
      [field]: field === 'siren' ? event.target.value.replace(/\D/g, '').slice(0, 9) : event.target.value,
      error: null,
    }))
  }

  function handleNewCompanyStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setNewCompany((current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  async function handleLookupNewCompanySirene() {
    const siren = newCompany.siren.trim()
    if (siren.length !== 9) {
      setNewCompany((current) => ({ ...current, error: 'Saisissez un SIREN de 9 chiffres avant la recherche SIRENE.' }))
      return
    }

    setIsLookingUpNewCompany(true)
    setNewCompany((current) => ({ ...current, error: null }))

    try {
      const response = await fetch(apiPath(`api/settings/companies/sirene/${siren}`))
      if (response.status === 404) {
        throw new Error('Aucune société trouvée pour ce SIREN.')
      }

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La recherche SIRENE a échoué.'))
      }

      const lookup = (await response.json()) as SireneCompanyLookup
      setNewCompany((current) => ({
        ...current,
        displayName: lookup.displayName ?? current.displayName,
        legalName: lookup.legalName ?? current.legalName,
        error: null,
      }))
    } catch (lookupError) {
      setNewCompany((current) => ({
        ...current,
        error: lookupError instanceof Error ? lookupError.message : 'Erreur de recherche SIRENE.',
      }))
    } finally {
      setIsLookingUpNewCompany(false)
    }
  }

  function handleEditableCompanyFieldChange(
    companyId: string,
    field: 'siren' | 'displayName' | 'legalName',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setEditableCompanies((current) => ({
      ...current,
      [companyId]: {
        ...(current[companyId] ?? createEmptyCompanyForm()),
        [field]: field === 'siren' ? event.target.value.replace(/\D/g, '').slice(0, 9) : event.target.value,
        error: null,
      },
    }))
  }

  function handleEditableCompanyStatusChange(companyId: string, event: ChangeEvent<HTMLInputElement>) {
    setEditableCompanies((current) => ({
      ...current,
      [companyId]: {
        ...(current[companyId] ?? createEmptyCompanyForm()),
        isActive: event.target.checked,
        error: null,
      },
    }))
  }

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewCompany((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/companies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCompanyPayload(newCompany)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La création de la société a échoué.'))
      }

      await loadAdminSecurityData()
      setNewCompany(createEmptyCompanyForm())
    } catch (createError) {
      setNewCompany((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de création.',
      }))
    }
  }

  async function handleSaveCompany(companyId: string) {
    const editableCompany = editableCompanies[companyId]
    if (!editableCompany) {
      return
    }

    setEditableCompanies((current) => ({
      ...current,
      [companyId]: { ...editableCompany, isSaving: true, error: null },
    }))

    try {
      const response = await fetch(apiPath(`api/settings/companies/${companyId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCompanyPayload(editableCompany)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise à jour de la société a échoué.'))
      }

      await loadAdminSecurityData()
    } catch (saveError) {
      setEditableCompanies((current) => ({
        ...current,
        [companyId]: {
          ...(current[companyId] ?? editableCompany),
          isSaving: false,
          error: saveError instanceof Error ? saveError.message : 'Erreur de mise à jour.',
        },
      }))
    }
  }

  function handleNewAnalyticFieldChange(
    field: 'code' | 'label' | 'companyId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setNewAnalytic((current) => ({
      ...current,
      [field]: field === 'code' ? event.target.value.toUpperCase() : event.target.value,
      error: null,
    }))
  }

  function handleNewAnalyticStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setNewAnalytic((current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  function handleEditableAnalyticFieldChange(
    analyticId: string,
    field: 'code' | 'label' | 'companyId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setEditableAnalytics((current) => ({
      ...current,
      [analyticId]: {
        ...(current[analyticId] ?? createEmptySettingsReferenceForm(companies[0]?.id ?? '')),
        [field]: field === 'code' ? event.target.value.toUpperCase() : event.target.value,
        error: null,
      },
    }))
  }

  function handleEditableAnalyticStatusChange(analyticId: string, event: ChangeEvent<HTMLInputElement>) {
    setEditableAnalytics((current) => ({
      ...current,
      [analyticId]: {
        ...(current[analyticId] ?? createEmptySettingsReferenceForm(companies[0]?.id ?? '')),
        isActive: event.target.checked,
        error: null,
      },
    }))
  }

  async function handleCreateAnalytic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewAnalytic((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/analytics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSettingsReferencePayload(newAnalytic)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La création de l’analytique a échoué.'))
      }

      await loadAdminSecurityData()
      setNewAnalytic(createEmptySettingsReferenceForm(newAnalytic.companyId))
    } catch (createError) {
      setNewAnalytic((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de création.',
      }))
    }
  }

  async function handleSaveAnalytic(analyticId: string) {
    const editableAnalytic = editableAnalytics[analyticId]
    if (!editableAnalytic) {
      return
    }

    setEditableAnalytics((current) => ({
      ...current,
      [analyticId]: { ...editableAnalytic, isSaving: true, error: null },
    }))

    try {
      const response = await fetch(apiPath(`api/settings/analytics/${analyticId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSettingsReferencePayload(editableAnalytic)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise à jour de l’analytique a échoué.'))
      }

      await loadAdminSecurityData()
    } catch (saveError) {
      setEditableAnalytics((current) => ({
        ...current,
        [analyticId]: {
          ...(current[analyticId] ?? editableAnalytic),
          isSaving: false,
          error: saveError instanceof Error ? saveError.message : 'Erreur de mise à jour.',
        },
      }))
    }
  }

  function handleNewExploitationFieldChange(
    field: 'code' | 'label' | 'companyId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setNewExploitation((current) => ({
      ...current,
      [field]: field === 'code' ? event.target.value.toUpperCase() : event.target.value,
      error: null,
    }))
  }

  function handleNewExploitationStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setNewExploitation((current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  function handleEditableExploitationFieldChange(
    exploitationId: string,
    field: 'code' | 'label' | 'companyId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setEditableExploitations((current) => ({
      ...current,
      [exploitationId]: {
        ...(current[exploitationId] ?? createEmptySettingsReferenceForm(companies[0]?.id ?? '')),
        [field]: field === 'code' ? event.target.value.toUpperCase() : event.target.value,
        error: null,
      },
    }))
  }

  function handleEditableExploitationStatusChange(exploitationId: string, event: ChangeEvent<HTMLInputElement>) {
    setEditableExploitations((current) => ({
      ...current,
      [exploitationId]: {
        ...(current[exploitationId] ?? createEmptySettingsReferenceForm(companies[0]?.id ?? '')),
        isActive: event.target.checked,
        error: null,
      },
    }))
  }

  async function handleCreateExploitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewExploitation((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/exploitations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSettingsReferencePayload(newExploitation)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La création de l’exploitation a échoué.'))
      }

      await loadAdminSecurityData()
      setNewExploitation(createEmptySettingsReferenceForm(newExploitation.companyId))
    } catch (createError) {
      setNewExploitation((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de création.',
      }))
    }
  }

  async function handleSaveExploitation(exploitationId: string) {
    const editableExploitation = editableExploitations[exploitationId]
    if (!editableExploitation) {
      return
    }

    setEditableExploitations((current) => ({
      ...current,
      [exploitationId]: { ...editableExploitation, isSaving: true, error: null },
    }))

    try {
      const response = await fetch(apiPath(`api/settings/exploitations/${exploitationId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSettingsReferencePayload(editableExploitation)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise à jour de l’exploitation a échoué.'))
      }

      await loadAdminSecurityData()
    } catch (saveError) {
      setEditableExploitations((current) => ({
        ...current,
        [exploitationId]: {
          ...(current[exploitationId] ?? editableExploitation),
          isSaving: false,
          error: saveError instanceof Error ? saveError.message : 'Erreur de mise à jour.',
        },
      }))
    }
  }

  function handlePostAuthLoaderComplete() {
    sessionStorage.removeItem(postAuthLoaderStorageKey)
    setShowPostAuthLoader(false)
  }

  const editingProfile = profiles.find((profile) => profile.id === editingProfileId) ?? null
  const editingEditableProfile = editingProfile ? editableProfiles[editingProfile.id] ?? null : null
  const editingAccount = accounts.find((account) => account.id === editingAccountId) ?? null
  const editingEditableAccount = editingAccount ? editableAccounts[editingAccount.id] ?? null : null

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
      <div className="auth-shell auth-shell-reference">
        <div className="auth-grain" aria-hidden="true" />
        <div className="auth-vignette" aria-hidden="true" />
        <section className="auth-brand-panel auth-brand-panel-reference">
          <div className="auth-brand-halo" aria-hidden="true" />
          <div className="auth-brand-ribbons" aria-hidden="true">
            <svg viewBox="0 0 1560 760" preserveAspectRatio="none">
              <path className="r1" d="M-40,520 C120,380 220,348 392,430 C548,506 664,448 828,286 C962,154 1110,150 1356,214 C1440,236 1498,258 1560,292" />
              <path className="r2" d="M-30,434 C126,406 248,332 406,372 C586,420 702,460 878,420 C1042,382 1178,304 1346,268 C1426,252 1492,250 1560,256" />
              <path className="r3" d="M82,616 C248,594 378,516 540,460 C724,396 888,458 1042,500 C1170,536 1300,512 1458,448 C1500,430 1532,410 1560,392" />
              <path className="r4" d="M288,106 C454,154 584,246 718,368 C826,466 936,498 1116,468 C1292,438 1410,376 1560,286" />
              <path className="r5" d="M320,646 C512,614 692,548 842,450 C994,350 1122,292 1260,252 C1364,222 1450,206 1560,198" />
            </svg>
          </div>
          <div className="auth-brand-particles" aria-hidden="true" />
          <div className="auth-product-line">GROUPE LAURE • NEXUS</div>
          <div className="auth-brand-lockup auth-brand-lockup-reference" aria-label="Nexus">
            <img className="auth-nexus-favicon" src={nexusIcon} alt="" aria-hidden="true" />
            <span className="auth-nexus-wordmark">
              <img className="auth-nexus-logo" src={nexusWordmark} alt="Nexus" />
            </span>
          </div>
          <div className="auth-brand-copy auth-brand-copy-reference">
            <p>Le syst&egrave;me d'information modulaire du Groupe Laure.</p>
          </div>
        </section>

        <section className="auth-card auth-card-reference" aria-label="Connexion Nexus">
          <div className="auth-card-header">
            <img className="auth-card-icon-image" src={nexusIcon} alt="" aria-hidden="true" />
            <span className="eyebrow">ACC&Egrave;S INTERNE</span>
          </div>
          <h2>Ouvrir une session</h2>
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="sso-section">
              <div className="auth-mode">Connexion recommand&eacute;e</div>
              <button
                aria-describedby="sso-help"
                className="sso-primary-button"
                onClick={() =>
                  setLoginError(
                    'Le SSO entreprise Groupe Laure n est pas encore raccorde dans ce socle. Utilisez l acces exceptionnel si necessaire.',
                  )
                }
                type="button"
              >
                <span className="sso-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 21V8.5L12 3l8 5.5V21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21v-7h6v7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 10.2h.01M12 10.2h.01M15.5 10.2h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Se connecter avec le compte entreprise Groupe Laure</span>
              </button>
              <p className="auth-sso-help" id="sso-help">
                Acc&egrave;s SSO avec le compte professionnel du Groupe Laure.
              </p>
            </div>

            <div className="auth-exception-separator">
              <span>Acc&egrave;s exceptionnel</span>
            </div>
            <p className="auth-exception-help">
              R&eacute;serv&eacute; aux comptes techniques, externes ou aux situations hors SSO.
            </p>
            <div className="field">
              <label htmlFor="login">Login</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12Z" fill="currentColor" opacity="0.92" />
                    <path d="M3 22c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  autoComplete="off"
                  id="login"
                  name="login"
                  value={credentials.login}
                  onChange={(event) => setCredentials((current) => ({ ...current, login: event.target.value }))}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor" opacity="0.92" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  autoComplete="off"
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
                <button
                  aria-label={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="password-visibility-button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  {isPasswordVisible ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10.7 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4.2M6.6 6.6C3.6 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3.2" fill="currentColor" opacity="0.9" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-form-meta">
              <a className="auth-forgot-link" href="#!" onClick={(event) => event.preventDefault()}>
                Mot de passe oubli&eacute; ?
              </a>
            </div>

            {loginError ? <p className="form-error">{loginError}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <button className="secondary-button auth-submit-button" disabled={isSubmitting} type="submit">
              <span className="label">{isSubmitting ? 'Connexion...' : 'Se connecter'}</span>
              <img className="button-nexus-icon" src={nexusIcon} alt="" aria-hidden="true" />
            </button>
          </form>

        </section>
      </div>
    )
  }
  if (showPostAuthLoader) {
    return <PostLoginBrandTransition onComplete={handlePostAuthLoaderComplete} />
  }

  if (currentUser.mustChangePassword) {
    return (
      <div className="auth-shell password-change-shell">
        <section className="auth-card password-change-card">
          <div className="auth-card-header">
            <div className="auth-card-icon" aria-hidden="true" />
            <span className="eyebrow">Sécurité du compte</span>
          </div>
          <h1>Changer votre mot de passe</h1>
          <p>
            Votre compte exige un nouveau mot de passe avant d’accéder aux modules NewNexus. Utilisez au moins 10 caractères.
          </p>
          <form className="auth-form" onSubmit={handleChangePassword}>
            <label>
              <span>Mot de passe actuel</span>
              <input
                autoComplete="current-password"
                type="password"
                value={changePassword.currentPassword}
                onChange={(event) => handleChangePasswordFieldChange('currentPassword', event)}
              />
            </label>
            <label>
              <span>Nouveau mot de passe</span>
              <input
                autoComplete="new-password"
                type="password"
                value={changePassword.newPassword}
                onChange={(event) => handleChangePasswordFieldChange('newPassword', event)}
              />
            </label>
            <label>
              <span>Confirmation</span>
              <input
                autoComplete="new-password"
                type="password"
                value={changePassword.confirmPassword}
                onChange={(event) => handleChangePasswordFieldChange('confirmPassword', event)}
              />
            </label>

            {changePassword.error ? <p className="form-error">{changePassword.error}</p> : null}

            <button className="primary-button auth-submit-button" disabled={changePassword.isSaving} type="submit">
              {changePassword.isSaving ? 'Enregistrement...' : 'Valider le nouveau mot de passe'}
            </button>
          </form>
          <button className="ghost-button password-change-logout" onClick={handleLogout} type="button">
            Se déconnecter
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="nexus-app-shell">
      <aside className="nexus-sidebar">
        <div className="brand-panel">
          <img className="brand-icon" src={nexusIcon} alt="NewNexus" />
          <img className="brand-wordmark" src={nexusWordmark} alt="Nexus" />
          <time className="brand-copy brand-clock" dateTime={currentDateTime.toISOString()}>
            {currentDateTime.toLocaleDateString()} - {currentDateTime.toLocaleTimeString()}
          </time>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {visibleNavigationEntries.map((entry) => (
            <button
              key={entry}
              className={`sidebar-link ${selectedNavigation === entry ? 'sidebar-link-active' : ''}`}
              onClick={() => {
                setSelectedNavigation(entry)
                if (entry === 'Administration') {
                  setSelectedAdministrationSection('Accueil')
                  setSelectedSettingsSection('Accueil')
                  setSelectedToolsSection('Accueil')
                }
              }}
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
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">{selectedNavigation}</span>
            <h1>{getWorkspaceTitle(selectedNavigation)}</h1>
            <p>{getWorkspaceDescription(selectedNavigation, isInformatique)}</p>
            <div className={`hero-actions ${selectedNavigation !== 'Administration' ? 'hero-actions-placeholder' : ''}`}>
              {selectedNavigation === 'Administration' ? (
                <span className="primary-chip">Version {systemInfo?.version ?? '0.1.0'}</span>
              ) : (
                <span className="primary-chip" aria-hidden="true">
                  Version
                </span>
              )}
            </div>
          </div>
        </section>

        {selectedNavigation === 'Administration' && isInformatique ? (
          <section className="admin-subnav" aria-label="Sous-menu administration">
            {administrationSubmenuEntries.map((entry) => (
              <button
                key={entry}
                className={`admin-subnav-link ${selectedAdministrationSection === entry ? 'admin-subnav-link-active' : ''}`}
                onClick={() => {
                  setSelectedAdministrationSection(entry)
                  if (entry === 'Outils') {
                    setSelectedToolsSection('Accueil')
                  }
                }}
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

        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Accueil' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide administration-synthesis-card">
              <div className="panel-heading">
                <span className="eyebrow">Administration</span>
                <h2>Choisir un espace d’administration</h2>
              </div>
              <p className="profiles-toolbar-copy">
                Les fonctions d’administration sont volontairement séparées pour éviter les écrans fourre-tout.
              </p>
              <div className="dashboard-actions">
                {administrationSubmenuEntries
                  .filter((entry) => entry !== 'Accueil')
                  .map((entry) => (
                    <button
                      key={entry}
                      className="dashboard-action-card"
                      onClick={() => {
                        setSelectedAdministrationSection(entry)
                        if (entry === 'Outils') {
                          setSelectedToolsSection('Accueil')
                        }
                      }}
                      type="button"
                    >
                      <span className="eyebrow">{entry}</span>
                      <strong>{entry}</strong>
                      <p>{getAdministrationSectionDescription(entry)}</p>
                    </button>
                  ))}
              </div>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Accueil' ? (
          <section className="dashboard-stack">
            <section className="metrics-grid">
              <article className="metric-card metric-card-navy">
                <span className="metric-label">Modules visibles</span>
                <strong>{visibleModules.length}</strong>
              </article>
              <article className="metric-card metric-card-champagne">
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
                {profiles.length === 0 ? (
                  <div className="workspace-empty">
                    <strong>Aucun profil configuré</strong>
                    <span>Créez un premier profil pour attribuer des droits aux comptes utilisateurs.</span>
                    <button className="primary-button" onClick={openCreateProfileModal} type="button">
                      Ajouter un profil
                    </button>
                  </div>
                ) : null}
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
              <div className="administration-synthesis-layout">
                <div className="administration-synthesis-copy">
                  <p className="profiles-toolbar-copy">
                    Chaque compte affiche son profil, son statut et les informations de suivi. Ouvrez la configuration pour modifier le détail.
                  </p>
                  <div className="profiles-quick-links" aria-label="Liste des comptes utilisateurs">
                    {accounts.map((account) => (
                      <button
                        key={`account-link-${account.id}`}
                        className="profile-link-chip"
                        onClick={() => openEditAccountModal(account.id)}
                        type="button"
                      >
                        {account.displayName}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="administration-synthesis-actions">
                  <button className="primary-button" onClick={openCreateAccountModal} type="button">
                    Ajouter un compte
                  </button>
                </div>
              </div>
              <div className="profiles-overview-grid">
                {accounts.length === 0 ? (
                  <div className="workspace-empty">
                    <strong>Aucun compte utilisateur</strong>
                    <span>Ajoutez un compte pour donner accès à NewNexus et rattachez-le ensuite à un profil.</span>
                    <button className="primary-button" onClick={openCreateAccountModal} type="button">
                      Ajouter un compte
                    </button>
                  </div>
                ) : null}
                {accounts.map((account) => {
                  return (
                    <article key={account.id} className="profile-summary-card accent-navy">
                      <header className="profile-summary-header">
                        <div>
                          <h3>{account.displayName}</h3>
                          <p>{account.login}</p>
                        </div>
                        <span className={`profile-status-badge ${account.isActive ? 'is-active' : 'is-inactive'}`}>
                          {account.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </header>
                      <div className="profile-summary-rights">
                        <div className="profile-summary-right">
                          <span>Profil</span>
                          <strong>{account.profile?.label ?? 'Sans profil'}</strong>
                        </div>
                        <div className="profile-summary-right">
                          <span>Email</span>
                          <strong>{account.email ?? 'Non renseigné'}</strong>
                        </div>
                        <div className="profile-summary-right">
                          <span>Dernière connexion</span>
                          <strong>{account.lastLoginAtUtc ? new Date(account.lastLoginAtUtc).toLocaleString() : 'Jamais'}</strong>
                        </div>
                        <div className="profile-summary-right">
                          <span>Mot de passe</span>
                          <strong>{account.mustChangePassword ? 'Changement requis' : 'À jour'}</strong>
                        </div>
                      </div>
                      <div className="profile-summary-actions">
                        <button className="secondary-button" onClick={() => openEditAccountModal(account.id)} type="button">
                          Configurer le compte
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </article>
          </section>
        ) : null}

        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Paramètres' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide settings-card">
              <div className="panel-heading">
                <span className="eyebrow">Paramètres</span>
                <h2>Socle de paramétrage transverse</h2>
              </div>
              <div className="settings-intro-grid">
                <div className="settings-intro-copy">
                  <p>Cette vue centralise les premiers référentiels transverses de NewNexus.</p>
                  <p>
                    {companies.length} société(s), {analytics.length} analytique(s) et {exploitations.length} exploitation(s)
                    actuellement chargée(s).
                  </p>
                  <p className="settings-note">
                    Les sociétés Groupe Laure sont alimentées via SIRENE. Les analytiques et exploitations seront gérés ici
                    directement dès qu’une société de rattachement est disponible.
                  </p>
                </div>
                <div className="settings-kpis">
                  <div className="metric-card metric-card-navy">
                    <span className="metric-label">Sociétés</span>
                    <strong>{companies.length}</strong>
                  </div>
                  <div className="metric-card metric-card-champagne">
                    <span className="metric-label">Analytiques</span>
                    <strong>{analytics.length}</strong>
                  </div>
                  <div className="metric-card metric-card-cyan">
                    <span className="metric-label">Exploitations</span>
                    <strong>{exploitations.length}</strong>
                  </div>
                </div>
              </div>

              {companies.length === 0 ? (
                <div className="status-banner status-banner-warning">
                  <strong>Paramétrage bloqué</strong>
                  <span>Ajoutez d’abord une société Groupe Laure pour créer les analytiques et exploitations.</span>
                </div>
              ) : null}

              <section className="admin-subnav" aria-label="Sous-menu paramètres">
                {settingsSubmenuEntries.map((entry) => (
                  <button
                    key={entry}
                    className={`admin-subnav-link ${selectedSettingsSection === entry ? 'admin-subnav-link-active' : ''}`}
                    onClick={() => setSelectedSettingsSection(entry)}
                    type="button"
                  >
                    {entry}
                  </button>
                ))}
              </section>

              {selectedSettingsSection === 'Accueil' ? (
                <div className="dashboard-actions">
                  {settingsSubmenuEntries
                    .filter((entry) => entry !== 'Accueil')
                    .map((entry) => (
                      <button
                        key={entry}
                        className="dashboard-action-card"
                        onClick={() => setSelectedSettingsSection(entry)}
                        type="button"
                      >
                        <span className="eyebrow">Paramètres</span>
                        <strong>{entry}</strong>
                        <p>{getSettingsSectionDescription(entry)}</p>
                      </button>
                    ))}
                </div>
              ) : null}

              {selectedSettingsSection !== 'Accueil' ? (
              <div className="settings-reference-grid settings-reference-grid-single">
                {selectedSettingsSection === 'Sociétés' ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <h3>Sociétés Groupe Laure</h3>
                    <small>Recherche SIRENE puis saisie contrôlée</small>
                  </div>
                  <form className="settings-form settings-create-form" onSubmit={handleCreateCompany}>
                    <label>
                      <span>SIREN</span>
                      <input
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="123456789"
                        value={newCompany.siren}
                        onChange={(event) => handleNewCompanyFieldChange('siren', event)}
                      />
                    </label>
                    <button
                      className="secondary-button settings-lookup-button"
                      disabled={isLookingUpNewCompany || newCompany.siren.length !== 9}
                      onClick={() => void handleLookupNewCompanySirene()}
                      type="button"
                    >
                      {isLookingUpNewCompany ? 'Recherche...' : 'Rechercher SIRENE'}
                    </button>
                    <label>
                      <span>Nom affiché</span>
                      <input
                        placeholder="Nom court"
                        value={newCompany.displayName}
                        onChange={(event) => handleNewCompanyFieldChange('displayName', event)}
                      />
                    </label>
                    <label>
                      <span>Raison sociale</span>
                      <input
                        placeholder="Raison sociale complète"
                        value={newCompany.legalName}
                        onChange={(event) => handleNewCompanyFieldChange('legalName', event)}
                      />
                    </label>
                    <label className="toggle-label settings-toggle">
                      <input checked={newCompany.isActive} onChange={handleNewCompanyStatusChange} type="checkbox" />
                      <span>{newCompany.isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                    <div className="profile-action-row">
                      <button className="primary-button" disabled={newCompany.isSaving} type="submit">
                        {newCompany.isSaving ? 'Création…' : 'Ajouter la société'}
                      </button>
                      {newCompany.error ? <small className="account-error">{newCompany.error}</small> : null}
                    </div>
                  </form>
                  <div className="settings-list">
                    {companies.length === 0 ? (
                      <div className="settings-empty">Aucune société chargée pour le moment.</div>
                    ) : (
                      companies.map((company) => (
                        <article className="settings-edit-card" key={company.id}>
                          <div className="settings-edit-grid">
                            <label>
                              <span>SIREN</span>
                              <input
                                inputMode="numeric"
                                maxLength={9}
                                value={editableCompanies[company.id]?.siren ?? company.siren}
                                onChange={(event) => handleEditableCompanyFieldChange(company.id, 'siren', event)}
                              />
                            </label>
                            <label>
                              <span>Nom affiché</span>
                              <input
                                value={editableCompanies[company.id]?.displayName ?? company.displayName}
                                onChange={(event) => handleEditableCompanyFieldChange(company.id, 'displayName', event)}
                              />
                            </label>
                            <label>
                              <span>Raison sociale</span>
                              <input
                                value={editableCompanies[company.id]?.legalName ?? company.legalName}
                                onChange={(event) => handleEditableCompanyFieldChange(company.id, 'legalName', event)}
                              />
                            </label>
                            <label className="toggle-label settings-toggle">
                              <input
                                checked={editableCompanies[company.id]?.isActive ?? company.isActive}
                                onChange={(event) => handleEditableCompanyStatusChange(company.id, event)}
                                type="checkbox"
                              />
                              <span>{editableCompanies[company.id]?.isActive ?? company.isActive ? 'Active' : 'Inactive'}</span>
                            </label>
                          </div>
                          <div className="settings-inline-actions">
                            <small>SIREN {company.siren}</small>
                            <button
                              className="secondary-button"
                              disabled={editableCompanies[company.id]?.isSaving}
                              onClick={() => void handleSaveCompany(company.id)}
                              type="button"
                            >
                              {editableCompanies[company.id]?.isSaving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                            {editableCompanies[company.id]?.error ? (
                              <small className="account-error">{editableCompanies[company.id]?.error}</small>
                            ) : null}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
                ) : null}

                {selectedSettingsSection === 'Analytiques' ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <h3>Analytiques</h3>
                    <small>Code sur 4 caractères</small>
                  </div>
                  <form className="settings-form settings-create-form" onSubmit={handleCreateAnalytic}>
                    <label>
                      <span>Code</span>
                      <input
                        maxLength={4}
                        placeholder="ABCD"
                        value={newAnalytic.code}
                        onChange={(event) => handleNewAnalyticFieldChange('code', event)}
                      />
                    </label>
                    <label>
                      <span>Libellé</span>
                      <input
                        placeholder="Libellé analytique"
                        value={newAnalytic.label}
                        onChange={(event) => handleNewAnalyticFieldChange('label', event)}
                      />
                    </label>
                    <label>
                      <span>Société</span>
                      <select
                        value={newAnalytic.companyId}
                        onChange={(event) => handleNewAnalyticFieldChange('companyId', event)}
                      >
                        <option value="">Sélectionner</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="toggle-label settings-toggle">
                      <input checked={newAnalytic.isActive} onChange={handleNewAnalyticStatusChange} type="checkbox" />
                      <span>{newAnalytic.isActive ? 'Actif' : 'Inactif'}</span>
                    </label>
                    <div className="profile-action-row">
                      <button className="primary-button" disabled={companies.length === 0 || newAnalytic.isSaving} type="submit">
                        {newAnalytic.isSaving ? 'Création…' : 'Ajouter l’analytique'}
                      </button>
                      {newAnalytic.error ? <small className="account-error">{newAnalytic.error}</small> : null}
                    </div>
                  </form>
                  <div className="settings-list">
                    {analytics.length === 0 ? (
                      <div className="settings-empty">Aucun analytique chargé pour le moment.</div>
                    ) : (
                      analytics.map((analytic) => (
                        <article className="settings-edit-card" key={analytic.id}>
                          <div className="settings-edit-grid">
                            <label>
                              <span>Code</span>
                              <input
                                maxLength={4}
                                value={editableAnalytics[analytic.id]?.code ?? analytic.code}
                                onChange={(event) => handleEditableAnalyticFieldChange(analytic.id, 'code', event)}
                              />
                            </label>
                            <label>
                              <span>Libellé</span>
                              <input
                                value={editableAnalytics[analytic.id]?.label ?? analytic.label}
                                onChange={(event) => handleEditableAnalyticFieldChange(analytic.id, 'label', event)}
                              />
                            </label>
                            <label>
                              <span>Société</span>
                              <select
                                value={editableAnalytics[analytic.id]?.companyId ?? analytic.company.id}
                                onChange={(event) => handleEditableAnalyticFieldChange(analytic.id, 'companyId', event)}
                              >
                                {companies.map((company) => (
                                  <option key={company.id} value={company.id}>
                                    {company.displayName}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="toggle-label settings-toggle">
                              <input
                                checked={editableAnalytics[analytic.id]?.isActive ?? analytic.isActive}
                                onChange={(event) => handleEditableAnalyticStatusChange(analytic.id, event)}
                                type="checkbox"
                              />
                              <span>{editableAnalytics[analytic.id]?.isActive ?? analytic.isActive ? 'Actif' : 'Inactif'}</span>
                            </label>
                          </div>
                          <div className="settings-inline-actions">
                            <small>SIREN {analytic.company.siren}</small>
                            <button
                              className="secondary-button"
                              disabled={editableAnalytics[analytic.id]?.isSaving}
                              onClick={() => void handleSaveAnalytic(analytic.id)}
                              type="button"
                            >
                              {editableAnalytics[analytic.id]?.isSaving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                            {editableAnalytics[analytic.id]?.error ? (
                              <small className="account-error">{editableAnalytics[analytic.id]?.error}</small>
                            ) : null}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
                ) : null}

                {selectedSettingsSection === 'Exploitations' ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <h3>Exploitations</h3>
                    <small>Rattachées à une société</small>
                  </div>
                  <form className="settings-form settings-create-form" onSubmit={handleCreateExploitation}>
                    <label>
                      <span>Code</span>
                      <input
                        placeholder="EXP"
                        value={newExploitation.code}
                        onChange={(event) => handleNewExploitationFieldChange('code', event)}
                      />
                    </label>
                    <label>
                      <span>Libellé</span>
                      <input
                        placeholder="Libellé exploitation"
                        value={newExploitation.label}
                        onChange={(event) => handleNewExploitationFieldChange('label', event)}
                      />
                    </label>
                    <label>
                      <span>Société</span>
                      <select
                        value={newExploitation.companyId}
                        onChange={(event) => handleNewExploitationFieldChange('companyId', event)}
                      >
                        <option value="">Sélectionner</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="toggle-label settings-toggle">
                      <input checked={newExploitation.isActive} onChange={handleNewExploitationStatusChange} type="checkbox" />
                      <span>{newExploitation.isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                    <div className="profile-action-row">
                      <button className="primary-button" disabled={companies.length === 0 || newExploitation.isSaving} type="submit">
                        {newExploitation.isSaving ? 'Création…' : 'Ajouter l’exploitation'}
                      </button>
                      {newExploitation.error ? <small className="account-error">{newExploitation.error}</small> : null}
                    </div>
                  </form>
                  <div className="settings-list">
                    {exploitations.length === 0 ? (
                      <div className="settings-empty">Aucune exploitation chargée pour le moment.</div>
                    ) : (
                      exploitations.map((exploitation) => (
                        <article className="settings-edit-card" key={exploitation.id}>
                          <div className="settings-edit-grid">
                            <label>
                              <span>Code</span>
                              <input
                                value={editableExploitations[exploitation.id]?.code ?? exploitation.code}
                                onChange={(event) => handleEditableExploitationFieldChange(exploitation.id, 'code', event)}
                              />
                            </label>
                            <label>
                              <span>Libellé</span>
                              <input
                                value={editableExploitations[exploitation.id]?.label ?? exploitation.label}
                                onChange={(event) => handleEditableExploitationFieldChange(exploitation.id, 'label', event)}
                              />
                            </label>
                            <label>
                              <span>Société</span>
                              <select
                                value={editableExploitations[exploitation.id]?.companyId ?? exploitation.company.id}
                                onChange={(event) => handleEditableExploitationFieldChange(exploitation.id, 'companyId', event)}
                              >
                                {companies.map((company) => (
                                  <option key={company.id} value={company.id}>
                                    {company.displayName}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="toggle-label settings-toggle">
                              <input
                                checked={editableExploitations[exploitation.id]?.isActive ?? exploitation.isActive}
                                onChange={(event) => handleEditableExploitationStatusChange(exploitation.id, event)}
                                type="checkbox"
                              />
                              <span>{editableExploitations[exploitation.id]?.isActive ?? exploitation.isActive ? 'Active' : 'Inactive'}</span>
                            </label>
                          </div>
                          <div className="settings-inline-actions">
                            <small>SIREN {exploitation.company.siren}</small>
                            <button
                              className="secondary-button"
                              disabled={editableExploitations[exploitation.id]?.isSaving}
                              onClick={() => void handleSaveExploitation(exploitation.id)}
                              type="button"
                            >
                              {editableExploitations[exploitation.id]?.isSaving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                            {editableExploitations[exploitation.id]?.error ? (
                              <small className="account-error">{editableExploitations[exploitation.id]?.error}</small>
                            ) : null}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
                ) : null}
              </div>
              ) : null}
            </article>
          </section>
        ) : null}
        {selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === 'Outils' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide admin-tools-card tools-home-card">
              <div className="panel-heading">
                <span className="eyebrow">Outils</span>
                <h2>Centre d’outils</h2>
              </div>
              <p className="profiles-toolbar-copy">
                Les outils techniques sont regroupés par usage pour éviter une page unique fourre-tout.
              </p>
              <section className="admin-subnav tools-subnav" aria-label="Sous-menu outils">
                {toolsSubmenuEntries.map((entry) => (
                  <button
                    key={entry}
                    className={`admin-subnav-link ${selectedToolsSection === entry ? 'admin-subnav-link-active' : ''}`}
                    onClick={() => setSelectedToolsSection(entry)}
                    type="button"
                  >
                    {entry}
                  </button>
                ))}
              </section>

              {selectedToolsSection === 'Accueil' ? (
                <div className="dashboard-actions tools-dashboard-actions">
                  {toolsSubmenuEntries
                    .filter((entry) => entry !== 'Accueil')
                    .map((entry) => (
                      <button
                        key={`tools-home-${entry}`}
                        className="dashboard-action-card"
                        onClick={() => setSelectedToolsSection(entry)}
                        type="button"
                      >
                        <span className="eyebrow">{entry}</span>
                        <strong>{entry}</strong>
                        <p>{getToolsSectionDescription(entry)}</p>
                      </button>
                    ))}
                </div>
              ) : null}
            </article>

            {selectedToolsSection === 'Diagnostics' ? (
            <article className="panel-card panel-card-wide admin-tools-card">
              <div className="panel-heading">
                <span className="eyebrow">Outils</span>
                <h2>Diagnostics d’administration</h2>
              </div>
              <p className="profiles-toolbar-copy">
                Vue de contrôle rapide pour vérifier l’application publiée, la base PostgreSQL et les premiers référentiels.
              </p>
              <div className="administration-synthesis-actions">
                <button className="secondary-button" onClick={() => void loadAdminDiagnostics()} type="button">
                  Rafraîchir les diagnostics
                </button>
              </div>

              {diagnosticsError ? (
                <div className="status-banner status-banner-error">
                  <strong>Diagnostics indisponibles</strong>
                  <span>{diagnosticsError}</span>
                </div>
              ) : null}

              {adminDiagnostics ? (
                <>
                  <div className="metrics-grid">
                    <article className="metric-card metric-card-navy">
                      <span className="metric-label">Application</span>
                      <strong>{adminDiagnostics.application.product}</strong>
                    </article>
                    <article className="metric-card metric-card-champagne">
                      <span className="metric-label">Version</span>
                      <strong>{adminDiagnostics.application.version}</strong>
                    </article>
                    <article className="metric-card metric-card-gold">
                      <span className="metric-label">Base</span>
                      <strong>{adminDiagnostics.database.canConnect ? 'Connectée' : 'Indisponible'}</strong>
                    </article>
                    <article className="metric-card metric-card-cyan">
                      <span className="metric-label">SIRENE</span>
                      <strong>{adminDiagnostics.integrations.sirene.status}</strong>
                    </article>
                  </div>
                  <div className="admin-tools-grid">
                    <article className="settings-row-card">
                      <span className="eyebrow">Runtime</span>
                      <strong>{adminDiagnostics.application.environment}</strong>
                      <small>Base path: {adminDiagnostics.application.basePath}</small>
                      <small>Serveur: {new Date(adminDiagnostics.application.serverTimeUtc).toLocaleString()}</small>
                    </article>
                    <article className="settings-row-card">
                      <span className="eyebrow">PostgreSQL</span>
                      <strong>{adminDiagnostics.database.status}</strong>
                      <small>{adminDiagnostics.database.provider ?? 'Provider non renseigné'}</small>
                    </article>
                    <article className="settings-row-card">
                      <span className="eyebrow">Sécurité</span>
                      <strong>{adminDiagnostics.security.accountCount} compte(s)</strong>
                      <small>{adminDiagnostics.security.profileCount} profil(s)</small>
                    </article>
                    <article className="settings-row-card">
                      <span className="eyebrow">Paramètres</span>
                      <strong>{adminDiagnostics.settings.companyCount} société(s)</strong>
                      <small>{adminDiagnostics.settings.analyticCount} analytique(s)</small>
                      <small>{adminDiagnostics.settings.exploitationCount} exploitation(s)</small>
                    </article>
                  </div>
                </>
              ) : (
                <div className="settings-empty">Chargement des diagnostics...</div>
              )}
            </article>
            ) : null}
            {selectedToolsSection === 'Clés API' ? (
            <article className="panel-card panel-card-wide integration-credentials-card">
              <div className="panel-heading">
                <span className="eyebrow">Intégrations</span>
                <h2>Clés API et accès externes</h2>
              </div>
              <p className="profiles-toolbar-copy">
                Centralisation des accès SIRENE, Lucca, TruckOnline, YellowBox, Geoapify et OpenStreetMap. Les secrets restent masqués.
              </p>
              <div className="administration-synthesis-actions">
                <button className="secondary-button" onClick={() => void loadIntegrationCredentials()} type="button">
                  Rafraîchir les clés
                </button>
                <button className="primary-button" onClick={openCreateCredentialModal} type="button">
                  Ajouter une clé
                </button>
              </div>

              {credentialsError ? (
                <div className={`status-banner ${credentialsError.includes('erreur') ? 'status-banner-warning' : ''}`}>
                  <strong>État des clés API</strong>
                  <span>{credentialsError}</span>
                </div>
              ) : null}

              <div className="metrics-grid">
                <article className="metric-card metric-card-navy">
                  <span className="metric-label">Fournisseurs</span>
                  <strong>{credentialSummary.providers}</strong>
                </article>
                <article className="metric-card metric-card-champagne">
                  <span className="metric-label">Clés renseignées</span>
                  <strong>{credentialSummary.configured}</strong>
                </article>
                <article className="metric-card metric-card-gold">
                  <span className="metric-label">Secrets</span>
                  <strong>{credentialSummary.secrets}</strong>
                </article>
                <article className="metric-card metric-card-cyan">
                  <span className="metric-label">Actives</span>
                  <strong>{credentialSummary.active}</strong>
                </article>
              </div>

              <div className="profiles-overview-grid integration-credentials-grid">
                {credentialsByProvider.map((provider) => (
                  <article
                    className={`profile-summary-card credential-card ${provider.configuredCount > 0 ? 'credential-card-configured accent-champagne' : 'accent-navy'}`}
                    key={provider.providerCode}
                  >
                    <header className="profile-summary-header">
                      <div>
                        <span className="eyebrow">{provider.providerCode}</span>
                        <h3>{provider.providerLabel}</h3>
                      </div>
                      <span className={`profile-status-badge ${provider.configuredCount > 0 ? 'is-active' : 'is-inactive'}`}>
                        {provider.configuredCount > 0 ? 'Configurée' : 'À déclarer'}
                      </span>
                    </header>
                    <div className="profile-summary-rights">
                      <div className="profile-summary-right">
                        <span>Clé logiciel</span>
                        <strong>{provider.configuredCount > 0 ? 'Renseignée' : 'Non renseignée'}</strong>
                      </div>
                      <div className="profile-summary-right">
                        <span>Paramètres techniques</span>
                        <strong>{provider.totalCount}</strong>
                      </div>
                      <div className="profile-summary-right">
                        <span>Secrets masqués</span>
                        <strong>{provider.secretCount}</strong>
                      </div>
                    </div>
                    <div className="profile-summary-actions">
                      <button
                        className="secondary-button"
                        onClick={() => openConfigureCredentialModal(provider.providerCode)}
                        type="button"
                      >
                        Configurer la clé
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>
            ) : null}

            {selectedToolsSection !== 'Accueil' &&
            selectedToolsSection !== 'Clés API' &&
            selectedToolsSection !== 'Diagnostics' ? (
              <article className="panel-card panel-card-wide tool-placeholder-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>{selectedToolsSection}</h2>
                </div>
                <div className="workspace-empty">
                  <strong>Rubrique préparée</strong>
                  <span>{getToolsSectionDescription(selectedToolsSection)}</span>
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        {isCredentialModalOpen ? (
          <div className="modal-overlay" onClick={closeCredentialModal} role="presentation">
            <section
              aria-labelledby="credential-modal-title"
              className="modal-card profile-modal-card credential-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{credentialForm.selectedKey ? 'Configuration' : 'Création'}</span>
                  <h2 id="credential-modal-title">
                    {credentialForm.selectedKey ? 'Configurer la clé' : 'Ajouter une clé'}
                  </h2>
                </div>
                <button className="modal-close-button" onClick={closeCredentialModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="credential-form credential-modal-form" onSubmit={handleCredentialFormSubmit}>
                <label>
                  <span>Clé connue</span>
                  <select value={credentialForm.selectedKey} onChange={handleCredentialSelectionChange}>
                    <option value="">Nouvelle clé</option>
                    {visibleIntegrationCredentials.map((credential) => (
                      <option key={buildIntegrationCredentialKey(credential)} value={buildIntegrationCredentialKey(credential)}>
                        {credential.providerLabel} - {credential.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Fournisseur</span>
                  <input value={credentialForm.providerCode} onChange={(event) => handleCredentialFormFieldChange('providerCode', event)} />
                </label>
                <label>
                  <span>Libellé fournisseur</span>
                  <input value={credentialForm.providerLabel} onChange={(event) => handleCredentialFormFieldChange('providerLabel', event)} />
                </label>
                <label>
                  <span>Nom technique</span>
                  <input value={credentialForm.keyName} onChange={(event) => handleCredentialFormFieldChange('keyName', event)} />
                </label>
                <label>
                  <span>Libellé</span>
                  <input value={credentialForm.displayName} onChange={(event) => handleCredentialFormFieldChange('displayName', event)} />
                </label>
                <label>
                  <span>Valeur</span>
                  <input
                    placeholder={credentialForm.isSecret ? 'Laisser vide pour conserver le secret existant' : 'URL, chemin ou valeur'}
                    type={credentialForm.isSecret ? 'password' : 'text'}
                    value={credentialForm.value}
                    onChange={(event) => handleCredentialFormFieldChange('value', event)}
                  />
                </label>
                <label className="credential-notes-field">
                  <span>Notes</span>
                  <textarea value={credentialForm.notes} onChange={(event) => handleCredentialFormFieldChange('notes', event)} />
                </label>
                <label className="toggle-label settings-toggle">
                  <input checked={credentialForm.isSecret} onChange={(event) => handleCredentialFormBooleanChange('isSecret', event)} type="checkbox" />
                  <span>Valeur secrète</span>
                </label>
                <label className="toggle-label settings-toggle">
                  <input checked={credentialForm.isActive} onChange={(event) => handleCredentialFormBooleanChange('isActive', event)} type="checkbox" />
                  <span>{credentialForm.isActive ? 'Active' : 'Inactive'}</span>
                </label>
                <div className="profile-action-row credential-form-actions">
                  <button className="primary-button" disabled={credentialForm.isSaving} type="submit">
                    {credentialForm.isSaving ? 'Enregistrement...' : 'Enregistrer la clé'}
                  </button>
                  {credentialForm.error ? <small className="account-error">{credentialForm.error}</small> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isCreateAccountModalOpen ? (
          <div className="modal-overlay" onClick={closeCreateAccountModal} role="presentation">
            <section
              aria-labelledby="create-account-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">Création</span>
                  <h2 id="create-account-title">Ajouter un compte</h2>
                </div>
                <button className="modal-close-button" onClick={closeCreateAccountModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="account-form-card" onSubmit={handleCreateAccount}>
                {profiles.length === 0 ? (
                  <div className="status-banner status-banner-warning account-form-warning">
                    <strong>Aucun profil disponible</strong>
                    <span>Le compte pourra être créé, mais il restera sans droits tant qu’un profil actif ne lui sera pas rattaché.</span>
                  </div>
                ) : null}
                <div className="account-form-grid">
                  <label>
                    <span>Login</span>
                    <input value={newAccount.login} onChange={(event) => handleNewAccountFieldChange('login', event)} />
                  </label>
                  <label>
                    <span>Nom affiché</span>
                    <input value={newAccount.displayName} onChange={(event) => handleNewAccountFieldChange('displayName', event)} />
                  </label>
                  <label>
                    <span>Email</span>
                    <input value={newAccount.email} onChange={(event) => handleNewAccountFieldChange('email', event)} />
                  </label>
                  <label>
                    <span>Matricule</span>
                    <input value={newAccount.employeeNumber} onChange={(event) => handleNewAccountFieldChange('employeeNumber', event)} />
                  </label>
                  <label>
                    <span>Profil</span>
                    <select value={newAccount.profileId} onChange={(event) => handleNewAccountFieldChange('profileId', event)}>
                      <option value="">Sans profil</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Mot de passe initial</span>
                    <input type="password" value={newAccount.password} onChange={(event) => handleNewAccountFieldChange('password', event)} />
                  </label>
                  <label className="toggle-label settings-toggle">
                    <input checked={newAccount.isActive} onChange={(event) => handleNewAccountBooleanChange('isActive', event)} type="checkbox" />
                    <span>{newAccount.isActive ? 'Compte actif' : 'Compte inactif'}</span>
                  </label>
                  <label className="toggle-label settings-toggle">
                    <input
                      checked={newAccount.mustChangePassword}
                      onChange={(event) => handleNewAccountBooleanChange('mustChangePassword', event)}
                      type="checkbox"
                    />
                    <span>Changement de mot de passe requis</span>
                  </label>
                </div>
                <div className="profile-action-row">
                  <button className="primary-button" disabled={newAccount.isSaving} type="submit">
                    {newAccount.isSaving ? 'Création…' : 'Créer le compte'}
                  </button>
                  {newAccount.error ? <small className="account-error">{newAccount.error}</small> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {editingAccount && editingEditableAccount ? (
          <div className="modal-overlay" onClick={closeEditAccountModal} role="presentation">
            <section
              aria-labelledby="edit-account-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">Configuration</span>
                  <h2 id="edit-account-title">Configurer le compte</h2>
                </div>
                <button className="modal-close-button" onClick={closeEditAccountModal} type="button">
                  Fermer
                </button>
              </div>

              <section className="account-form-card">
                <header className="profile-editor-header">
                  <div>
                    <h3>{editingAccount.displayName}</h3>
                    <p>{editingAccount.login}</p>
                  </div>
                  <span className={`profile-status-badge ${editingEditableAccount.isActive ? 'is-active' : 'is-inactive'}`}>
                    {editingEditableAccount.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </header>
                <div className="account-form-grid">
                  <label>
                    <span>Login</span>
                    <input
                      value={editingEditableAccount.login}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'login', event)}
                    />
                  </label>
                  <label>
                    <span>Nom affiché</span>
                    <input
                      value={editingEditableAccount.displayName}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'displayName', event)}
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      value={editingEditableAccount.email}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'email', event)}
                    />
                  </label>
                  <label>
                    <span>Matricule</span>
                    <input
                      value={editingEditableAccount.employeeNumber}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'employeeNumber', event)}
                    />
                  </label>
                  <label>
                    <span>Profil</span>
                    <select
                      value={editingEditableAccount.profileId}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'profileId', event)}
                    >
                      <option value="">Sans profil</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Nouveau mot de passe</span>
                    <input
                      placeholder="Laisser vide pour conserver"
                      type="password"
                      value={editingEditableAccount.password}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'password', event)}
                    />
                  </label>
                  <label className="toggle-label settings-toggle">
                    <input
                      checked={editingEditableAccount.isActive}
                      onChange={(event) => handleEditableAccountBooleanChange(editingAccount.id, 'isActive', event)}
                      type="checkbox"
                    />
                    <span>{editingEditableAccount.isActive ? 'Compte actif' : 'Compte inactif'}</span>
                  </label>
                  <label className="toggle-label settings-toggle">
                    <input
                      checked={editingEditableAccount.mustChangePassword}
                      onChange={(event) => handleEditableAccountBooleanChange(editingAccount.id, 'mustChangePassword', event)}
                      type="checkbox"
                    />
                    <span>Changement de mot de passe requis</span>
                  </label>
                </div>
                <div className="profile-action-row">
                  <button
                    className="secondary-button"
                    disabled={editingEditableAccount.isSaving}
                    onClick={() => void handleSaveAccount(editingAccount.id)}
                    type="button"
                  >
                    {editingEditableAccount.isSaving ? 'Enregistrement…' : 'Enregistrer le compte'}
                  </button>
                  {editingEditableAccount.error ? <small className="account-error">{editingEditableAccount.error}</small> : null}
                </div>
              </section>
            </section>
          </div>
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

function apiPath(path: string) {
  return `${apiBasePath}${path.replace(/^\/+/, '')}`
}

function createEmptyAccountForm(): EditableAccountState {
  return {
    login: '',
    displayName: '',
    email: '',
    employeeNumber: '',
    password: '',
    profileId: '',
    isActive: true,
    mustChangePassword: true,
    isSaving: false,
    error: null,
  }
}

function createEmptyChangePasswordForm(): ChangePasswordState {
  return {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    isSaving: false,
    error: null,
  }
}

function createEmptyIntegrationCredentialForm(): IntegrationCredentialFormState {
  return {
    selectedKey: '',
    providerCode: '',
    providerLabel: '',
    keyName: '',
    displayName: '',
    value: '',
    isSecret: true,
    isActive: true,
    notes: '',
    isSaving: false,
    error: null,
  }
}

function buildIntegrationCredentialKey(credential: IntegrationCredentialItem) {
  return `${credential.providerCode}|${credential.keyName}`
}

function shouldDisplayIntegrationCredential(credential: IntegrationCredentialItem) {
  return !hiddenIntegrationProviderCodes.has(credential.providerCode.toUpperCase())
}

function buildCredentialFormFromItem(credential: IntegrationCredentialItem | null): IntegrationCredentialFormState {
  if (!credential) {
    return createEmptyIntegrationCredentialForm()
  }

  return {
    selectedKey: buildIntegrationCredentialKey(credential),
    providerCode: credential.providerCode,
    providerLabel: credential.providerLabel,
    keyName: credential.keyName,
    displayName: credential.displayName,
    value: '',
    isSecret: credential.isSecret,
    isActive: credential.isConfigured ? credential.isActive : true,
    notes: '',
    isSaving: false,
    error: null,
  }
}

function buildAccountPayload(account: EditableAccountState, isCreation: boolean) {
  return {
    login: account.login.trim(),
    displayName: account.displayName.trim(),
    email: account.email.trim() || null,
    employeeNumber: account.employeeNumber.trim() || null,
    ...(isCreation ? { password: account.password } : { newPassword: account.password || null }),
    securityProfileId: account.profileId || null,
    isActive: account.isActive,
    mustChangePassword: account.mustChangePassword,
  }
}

function createEmptySettingsReferenceForm(companyId = ''): SettingsReferenceFormState {
  return {
    code: '',
    label: '',
    companyId,
    isActive: true,
    isSaving: false,
    error: null,
  }
}

function createEmptyCompanyForm(): CompanyFormState {
  return {
    siren: '',
    displayName: '',
    legalName: '',
    isActive: true,
    isSaving: false,
    error: null,
  }
}

function buildCompanyPayload(form: CompanyFormState) {
  return {
    siren: form.siren.trim(),
    displayName: form.displayName.trim(),
    legalName: form.legalName.trim(),
    isActive: form.isActive,
  }
}

function buildSettingsReferencePayload(form: SettingsReferenceFormState) {
  return {
    code: form.code.trim(),
    label: form.label.trim(),
    companyId: form.companyId,
    isActive: form.isActive,
  }
}

async function getRequestError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as {
    title?: string
    errors?: Record<string, string[]>
  } | null

  const validationMessage = Object.values(payload?.errors ?? {}).flat()[0]
  return validationMessage ?? payload?.title ?? fallback
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
    return 'Gestion administrative'
  }

  return 'Exploitation'
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

function getAdministrationSectionDescription(section: (typeof administrationSubmenuEntries)[number]) {
  switch (section) {
    case 'Comptes utilisateurs':
      return 'Créer, modifier, activer ou rattacher les comptes aux profils.'
    case 'Profils':
      return 'Configurer les profils et leurs droits par module.'
    case 'Paramètres':
      return 'Administrer les référentiels transverses de base.'
    case 'Outils':
      return 'Préparer les futurs outils techniques et de maintenance.'
    default:
      return 'Vue d’ensemble des espaces d’administration.'
  }
}

function getToolsSectionDescription(section: (typeof toolsSubmenuEntries)[number]) {
  switch (section) {
    case 'Clés API':
      return 'Déclarer et maintenir les accès API par logiciel externe.'
    case 'Tâches planifiées':
      return 'Préparer le suivi des traitements planifiés, exécutions et historiques.'
    case 'Requêteur SQL':
      return 'Préparer un espace de requêtes d’analyse contrôlées.'
    case 'Traces':
      return 'Préparer la consultation des journaux applicatifs et techniques.'
    case 'Diagnostics':
      return 'Contrôler rapidement l’application, la base et les référentiels.'
    default:
      return 'Vue d’ensemble des outils techniques disponibles.'
  }
}

function getSettingsSectionDescription(section: (typeof settingsSubmenuEntries)[number]) {
  switch (section) {
    case 'Sociétés':
      return 'Créer et maintenir les sociétés Groupe Laure.'
    case 'Analytiques':
      return 'Créer et maintenir les codes analytiques rattachés aux sociétés.'
    case 'Exploitations':
      return 'Créer et maintenir les exploitations rattachées aux sociétés.'
    default:
      return 'Synthèse des référentiels transverses.'
  }
}

export default App
