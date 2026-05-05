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

type FunctionalModuleBlueprint = {
  intent: string
  primaryData: string
  nextStep: string
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
  sessionTimeoutMinutes: number
  createdAtUtc: string
  lastLoginAtUtc: string | null
  lastSyncedAtUtc: string | null
  profile: {
    id: string
    code: string
    label: string
  } | null
}

type UserSessionItem = {
  id: string
  userAccountId: string
  login: string | null
  displayName: string | null
  profileLabel: string | null
  loginAtUtc: string
  lastSeenAtUtc: string
  expiresAtUtc: string
  logoutAtUtc: string | null
  revokedAtUtc: string | null
  ipAddress: string | null
  userAgent: string | null
  isActive: boolean
  durationMinutes: number
}

type UserSessionsPayload = {
  active: UserSessionItem[]
  history: UserSessionItem[]
}

type AccountPasswordResetState = {
  accountId: string | null
  isResetting: boolean
  temporaryPassword: string | null
  message: string | null
  error: string | null
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
  readiness: {
    ux: AdminReadinessItem[]
    security: AdminReadinessItem[]
    settings: AdminReadinessItem[]
    interfaces: AdminReadinessItem[]
  }
}

type AdminReadinessItem = {
  label: string
  status: string
  detail: string
  nextStep: string
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

type EmployeeItem = {
  id: string
  sourceEmployeeId: string
  employeeNumber: string
  displayName: string
  email: string | null
  phoneNumber: string | null
  isDriver: boolean
  isActive: boolean
  lastSyncedAtUtc: string | null
  createdAtUtc: string
}

type EmployeeAccountProvisioningItem = {
  employeeId: string
  employeeNumber: string
  displayName: string
  login: string | null
  temporaryPassword: string | null
  status: string
}

type EmployeeAccountProvisioningResult = {
  createdCount: number
  skippedCount: number
  createdAccounts: EmployeeAccountProvisioningItem[]
  skippedEmployees: EmployeeAccountProvisioningItem[]
}

type LuccaEmployeeImportResult = {
  importedCount: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  messages: string[]
}

type ThirdPartyItem = {
  id: string
  typeCode: string
  displayName: string
  siren: string | null
  vatNumber: string | null
  externalReference: string | null
  isForeignCompany: boolean
  isActive: boolean
  createdAtUtc: string
  analytics: Array<{
    analyticId: string
    code: string
    label: string
    company: {
      id: string
      displayName: string
    }
  }>
}

type MaterialItem = {
  id: string
  fleetNumber: string
  label: string
  materialType: string
  registrationNumber: string | null
  sourceSystem: string | null
  isActive: boolean
  lastSyncedAtUtc: string | null
  createdAtUtc: string
  exploitation: {
    id: string
    code: string
    label: string
  } | null
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
  sessionTimeoutMinutes: string
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

type EmployeeFormState = {
  sourceEmployeeId: string
  employeeNumber: string
  displayName: string
  email: string
  phoneNumber: string
  isDriver: boolean
  isActive: boolean
  isSaving: boolean
  error: string | null
}

type ThirdPartyFormState = {
  typeCode: string
  displayName: string
  siren: string
  vatNumber: string
  externalReference: string
  isForeignCompany: boolean
  isActive: boolean
  analyticIds: string[]
  isSaving: boolean
  error: string | null
}

type MaterialFormState = {
  fleetNumber: string
  label: string
  materialType: string
  registrationNumber: string
  sourceSystem: string
  exploitationId: string
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

type ForgotPasswordState = {
  identifier: string
  isSubmitting: boolean
  message: string | null
  error: string | null
  resetToken: string | null
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
const employeeSettingsSection = 'Salari\u00e9s'
const thirdPartySettingsSection = 'Tiers'
const materialSettingsSection = 'Mat\u00e9riels'
const settingsNavigationEntries = [
  ...settingsSubmenuEntries,
  employeeSettingsSection,
  thirdPartySettingsSection,
  materialSettingsSection,
] as const
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

const mojibakeTextReplacements: Array<[string, string]> = [
  ['\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2', "'"],
  ['\u00c3\u0192\u00e2\u20ac\u00b0criture', '\u00c9criture'],
  ['\u00c3\u0192\u00c2\u00a9', '\u00e9'],
  ['\u00c3\u0192\u00c2\u00a8', '\u00e8'],
  ['\u00c3\u0192\u00c2\u00aa', '\u00ea'],
  ['\u00c3\u0192\u00c2\u00a0', '\u00e0'],
  ['\u00c3\u0192\u00c2\u00b4', '\u00f4'],
  ['\u00c3\u0192\u00c2\u00ae', '\u00ee'],
  ['\u00c3\u0192\u00c2\u00a7', '\u00e7'],
  ['\u00c3\u00a9', '\u00e9'],
  ['\u00c3\u00a8', '\u00e8'],
  ['\u00c3\u00aa', '\u00ea'],
  ['\u00c3\u00a0', '\u00e0'],
  ['\u00c3\u00a2', '\u00e2'],
  ['\u00c3\u00b4', '\u00f4'],
  ['\u00c3\u00ae', '\u00ee'],
  ['\u00c3\u00a7', '\u00e7'],
  ['\u00e2\u20ac\u2122', "'"],
  ['\u00e2\u20ac\u0153', '"'],
  ['\u00e2\u20ac\u009d', '"'],
  ['\u00e2\u20ac\u00a2', '\u2022'],
]

function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [modules, setModules] = useState<SecurityModuleItem[]>([])
  const [profiles, setProfiles] = useState<SecurityProfileItem[]>([])
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [analytics, setAnalytics] = useState<AnalyticItem[]>([])
  const [exploitations, setExploitations] = useState<ExploitationItem[]>([])
  const [employees, setEmployees] = useState<EmployeeItem[]>([])
  const [thirdParties, setThirdParties] = useState<ThirdPartyItem[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [adminDiagnostics, setAdminDiagnostics] = useState<AdminDiagnostics | null>(null)
  const [integrationCredentials, setIntegrationCredentials] = useState<IntegrationCredentialItem[]>([])
  const [userSessions, setUserSessions] = useState<UserSessionsPayload>({ active: [], history: [] })
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
  const [newThirdParty, setNewThirdParty] = useState<ThirdPartyFormState>(createEmptyThirdPartyForm())
  const [newMaterial, setNewMaterial] = useState<MaterialFormState>(createEmptyMaterialForm())
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null)
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(createEmptyEmployeeForm())
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false)
  const [changePassword, setChangePassword] = useState<ChangePasswordState>(createEmptyChangePasswordForm())
  const [forgotPassword, setForgotPassword] = useState<ForgotPasswordState>(createEmptyForgotPasswordForm())
  const [accountPasswordReset, setAccountPasswordReset] = useState<AccountPasswordResetState>(createEmptyAccountPasswordResetState())
  const [credentialForm, setCredentialForm] = useState<IntegrationCredentialFormState>(createEmptyIntegrationCredentialForm())
  const [employeeProvisioning, setEmployeeProvisioning] = useState<{
    isProvisioning: boolean
    result: EmployeeAccountProvisioningResult | null
    error: string | null
  }>({
    isProvisioning: false,
    result: null,
    error: null,
  })
  const [luccaEmployeeImport, setLuccaEmployeeImport] = useState<{
    isImporting: boolean
    result: LuccaEmployeeImportResult | null
    error: string | null
  }>({
    isImporting: false,
    result: null,
    error: null,
  })
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [showPostAuthLoader, setShowPostAuthLoader] = useState(false)
  const [isLookingUpNewCompany, setIsLookingUpNewCompany] = useState(false)
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false)
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false)
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false)
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [selectedNavigation, setSelectedNavigation] = useState('Accueil')
  const [selectedAdministrationSection, setSelectedAdministrationSection] =
    useState<(typeof administrationSubmenuEntries)[number]>('Accueil')
  const [selectedSettingsSection, setSelectedSettingsSection] =
    useState<string>('Accueil')
  const [selectedToolsSection, setSelectedToolsSection] =
    useState<string>('Accueil')
  const [error, setError] = useState<string | null>(null)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
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
    normalizeVisibleTextNodes(document.getElementById('root'))
  })

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

  const scheduledTasks = useMemo(
    () => [
      {
        code: 'SIRENE_COMPANY_SYNC',
        label: 'Synchronisation SIRENE',
        scope: 'Sociétés',
        cadence: 'À planifier',
        status: 'À raccorder',
        description: 'Préparer la mise à jour périodique des informations sociétés depuis SIRENE.',
      },
      {
        code: 'LUCCA_EMPLOYEES_IMPORT',
        label: 'Import salariés Lucca',
        scope: 'Ressources humaines',
        cadence: 'Quotidienne cible',
        status: 'À raccorder',
        description: 'Importer les salariés, puis qualifier les conducteurs selon le mapping retenu.',
      },
      {
        code: 'LUCCA_ACCOUNT_PROVISIONING',
        label: 'Provisioning comptes Lucca',
        scope: 'Ressources humaines',
        cadence: 'Apr\u00e8s import salari\u00e9s',
        status: '\u00c0 cadrer',
        description: 'Pr\u00e9parer la cr\u00e9ation automatique de comptes sans droit depuis les salari\u00e9s import\u00e9s.',
      },
      {
        code: 'TRUCKONLINE_FLEET_SYNC',
        label: 'Synchronisation TruckOnline',
        scope: 'Exploitation',
        cadence: 'Horaire cible',
        status: 'À raccorder',
        description: 'Synchroniser les informations tracteurs et statuts techniques TruckOnline.',
      },
      {
        code: 'YELLOWBOX_TELEMATICS_SYNC',
        label: 'Synchronisation YellowBox',
        scope: 'Exploitation',
        cadence: 'Horaire cible',
        status: 'À raccorder',
        description: 'Préparer la récupération des données télématiques YellowBox.',
      },
      {
        code: 'MATERIALS_IMPORT',
        label: 'Import mat\u00e9riels',
        scope: 'Exploitation',
        cadence: 'Apr\u00e8s cadrage parc',
        status: '\u00c0 cadrer',
        description: 'Pr\u00e9parer le r\u00e9f\u00e9rentiel mat\u00e9riels avec num\u00e9ro de parc unique.',
      },
      {
        code: 'AUDIT_LOG_RETENTION',
        label: 'Purge contrôlée des traces',
        scope: 'Technique',
        cadence: 'Mensuelle cible',
        status: 'À cadrer',
        description: 'Préparer la politique de conservation des journaux applicatifs et techniques.',
      },
    ],
    [],
  )

  const controlledSqlQueries = useMemo(
    () => [
      {
        code: 'SECURITY_ACCOUNTS_OVERVIEW',
        scope: 'Sécurité',
        label: 'Synthèse des comptes utilisateurs',
        status: 'À cadrer',
        output: 'Comptes actifs, inactifs, profils rattachés et dernière connexion.',
      },
      {
        code: 'MODULE_RIGHTS_MATRIX',
        scope: 'Droits',
        label: 'Matrice profils et modules',
        status: 'À cadrer',
        output: 'Lecture des droits par profil, module et niveau d’accès.',
      },
      {
        code: 'TRANSVERSE_REFERENTIALS',
        scope: 'Paramètres',
        label: 'Référentiels transverses',
        status: 'À cadrer',
        output: 'Sociétés, analytiques et exploitations avec état actif.',
      },
      {
        code: 'INTEGRATION_CREDENTIALS_AUDIT',
        scope: 'Outils',
        label: 'Audit des accès externes',
        status: 'À cadrer',
        output: 'Fournisseurs, clés renseignées, secrets masqués et activation.',
      },
    ],
    [],
  )

  const traceStreams = useMemo(
    () => [
      {
        code: 'AUTH_EVENTS',
        scope: 'Sécurité',
        label: 'Authentification',
        retention: '90 jours cible',
        description: 'Connexions, déconnexions, échecs de login et demandes de réinitialisation.',
      },
      {
        code: 'ADMIN_ACTIONS',
        scope: 'Administration',
        label: 'Actions administrateur',
        retention: '180 jours cible',
        description: 'Création ou modification des comptes, profils, paramètres et clés API.',
      },
      {
        code: 'INTEGRATION_RUNS',
        scope: 'Interfaces',
        label: 'Traitements d’intégration',
        retention: '180 jours cible',
        description: 'Exécutions SIRENE, Lucca, TruckOnline, YellowBox et erreurs de connecteurs.',
      },
      {
        code: 'SYSTEM_ERRORS',
        scope: 'Technique',
        label: 'Erreurs applicatives',
        retention: '365 jours cible',
        description: 'Exceptions serveur, indisponibilités PostgreSQL et erreurs critiques.',
      },
    ],
    [],
  )

  const controlledSqlCatalog = useMemo(
    () => [
      {
        code: 'SECURITY_ACCOUNTS_OVERVIEW',
        scope: 'S\u00e9curit\u00e9',
        label: 'Synth\u00e8se des comptes utilisateurs',
        status: '\u00c0 cadrer',
        output: 'Comptes actifs, inactifs, profils rattach\u00e9s et derni\u00e8re connexion.',
      },
      {
        code: 'MODULE_RIGHTS_MATRIX',
        scope: 'Droits',
        label: 'Matrice profils et modules',
        status: '\u00c0 cadrer',
        output: 'Lecture des droits par profil, module et niveau d\u2019acc\u00e8s.',
      },
      {
        code: 'TRANSVERSE_REFERENTIALS',
        scope: 'Param\u00e8tres',
        label: 'R\u00e9f\u00e9rentiels transverses',
        status: '\u00c0 cadrer',
        output: 'Soci\u00e9t\u00e9s, analytiques et exploitations avec \u00e9tat actif.',
      },
      {
        code: 'INTEGRATION_CREDENTIALS_AUDIT',
        scope: 'Outils',
        label: 'Audit des acc\u00e8s externes',
        status: '\u00c0 cadrer',
        output: 'Fournisseurs, cl\u00e9s renseign\u00e9es, secrets masqu\u00e9s et activation.',
      },
    ],
    [],
  )

  const traceCatalog = useMemo(
    () => [
      {
        code: 'AUTH_EVENTS',
        scope: 'S\u00e9curit\u00e9',
        label: 'Authentification',
        retention: '90 jours cible',
        description: 'Connexions, d\u00e9connexions, \u00e9checs de login et demandes de r\u00e9initialisation.',
      },
      {
        code: 'ADMIN_ACTIONS',
        scope: 'Administration',
        label: 'Actions administrateur',
        retention: '180 jours cible',
        description: 'Cr\u00e9ation ou modification des comptes, profils, param\u00e8tres et cl\u00e9s API.',
      },
      {
        code: 'INTEGRATION_RUNS',
        scope: 'Interfaces',
        label: 'Traitements d\u2019int\u00e9gration',
        retention: '180 jours cible',
        description: 'Ex\u00e9cutions SIRENE, Lucca, TruckOnline, YellowBox et erreurs de connecteurs.',
      },
      {
        code: 'SYSTEM_ERRORS',
        scope: 'Technique',
        label: 'Erreurs applicatives',
        retention: '365 jours cible',
        description: 'Exceptions serveur, indisponibilit\u00e9s PostgreSQL et erreurs critiques.',
      },
    ],
    [],
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
            sessionTimeoutMinutes: String(account.sessionTimeoutMinutes || 60),
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
        throw new Error(await getRequestError(meResponse, 'Impossible de récupérer le compte connecté.'))
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
    setEmployees([])
    setThirdParties([])
    setMaterials([])
    setAdminDiagnostics(null)
    setIntegrationCredentials([])
    setUserSessions({ active: [], history: [] })
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

    const failedAdminResponse = [modulesResponse, profilesResponse, accountsResponse, settingsResponse].find(
      (response) => !response.ok,
    )
    if (failedAdminResponse) {
      throw new Error(await getRequestError(failedAdminResponse, 'Impossible de charger l’administration de sécurité.'))
    }

    const [modulesPayload, profilesPayload, accountsPayload, settingsPayload] = await Promise.all([
      modulesResponse.json() as Promise<SecurityModuleItem[]>,
      profilesResponse.json() as Promise<SecurityProfileItem[]>,
      accountsResponse.json() as Promise<AccountItem[]>,
      settingsResponse.json() as Promise<{
        companies: CompanyItem[]
        analytics: AnalyticItem[]
        exploitations: ExploitationItem[]
        employees: EmployeeItem[]
        thirdParties: ThirdPartyItem[]
        materials: MaterialItem[]
      }>,
    ])

    setModules(modulesPayload)
    setProfiles(profilesPayload)
    setAccounts(accountsPayload)
    setCompanies(settingsPayload.companies)
    setAnalytics(settingsPayload.analytics)
    setExploitations(settingsPayload.exploitations)
    setEmployees(settingsPayload.employees)
    setThirdParties(settingsPayload.thirdParties)
    setMaterials(settingsPayload.materials)
  }

  async function loadAdminToolsData() {
    await Promise.all([loadAdminDiagnostics(), loadIntegrationCredentials(), loadUserSessions()])
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
    setSessionsError(null)

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

  async function loadUserSessions() {
    setSessionsError(null)

    try {
      const response = await fetch(apiPath('api/admin/sessions'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les sessions.'))
      }

      setUserSessions((await response.json()) as UserSessionsPayload)
    } catch (sessionsLoadError) {
      setSessionsError(sessionsLoadError instanceof Error ? sessionsLoadError.message : 'Sessions indisponibles.')
    }
  }

  async function handleDisconnectUserSession(sessionId: string) {
    setSessionsError(null)

    try {
      const response = await fetch(apiPath(`api/admin/sessions/${sessionId}/disconnect`), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de deconnecter cette session.'))
      }

      await loadUserSessions()
    } catch (disconnectError) {
      setSessionsError(disconnectError instanceof Error ? disconnectError.message : 'Deconnexion impossible.')
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
        throw new Error(await getRequestError(response, 'La connexion a échoué.'))
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

  function openForgotPasswordModal() {
    setForgotPassword({
      ...createEmptyForgotPasswordForm(),
      identifier: credentials.login,
    })
    setIsForgotPasswordModalOpen(true)
  }

  function closeForgotPasswordModal() {
    if (forgotPassword.isSubmitting) {
      return
    }

    setIsForgotPasswordModalOpen(false)
    setForgotPassword(createEmptyForgotPasswordForm())
  }

  function handleForgotPasswordIdentifierChange(event: ChangeEvent<HTMLInputElement>) {
    setForgotPassword((current) => ({
      ...current,
      identifier: event.target.value,
      error: null,
      message: null,
      resetToken: null,
    }))
  }

  async function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setForgotPassword((current) => ({ ...current, isSubmitting: true, error: null, message: null, resetToken: null }))

    try {
      const response = await fetch(apiPath('api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginOrEmail: forgotPassword.identifier }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La demande de réinitialisation a échoué.'))
      }

      const payload = (await response.json()) as {
        message?: string
        resetToken?: string | null
      }

      setForgotPassword((current) => ({
        ...current,
        isSubmitting: false,
        message: payload.message ?? 'Si un compte actif correspond, une demande de réinitialisation a été enregistrée.',
        resetToken: payload.resetToken ?? null,
      }))
    } catch (requestError) {
      setForgotPassword((current) => ({
        ...current,
        isSubmitting: false,
        error: requestError instanceof Error ? requestError.message : 'Erreur de réinitialisation.',
      }))
    }
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
    setEmployees([])
    setThirdParties([])
    setMaterials([])
    setIntegrationCredentials([])
    setUserSessions({ active: [], history: [] })
    setEditableAccounts({})
    setEditableProfiles({})
    setEditableCompanies({})
    setEditableAnalytics({})
    setEditableExploitations({})
    setChangePassword(createEmptyChangePasswordForm())
    setForgotPassword(createEmptyForgotPasswordForm())
    setAccountPasswordReset(createEmptyAccountPasswordResetState())
    setCredentialForm(createEmptyIntegrationCredentialForm())
    setEditingEmployee(null)
    setEmployeeForm(createEmptyEmployeeForm())
    setIsCreateEmployeeModalOpen(false)
    setEmployeeProvisioning({ isProvisioning: false, result: null, error: null })
    setLuccaEmployeeImport({ isImporting: false, result: null, error: null })
    setDiagnosticsError(null)
    setCredentialsError(null)
    setSessionsError(null)
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
    field: 'login' | 'displayName' | 'email' | 'employeeNumber' | 'password' | 'profileId' | 'sessionTimeoutMinutes',
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
    field: 'login' | 'displayName' | 'email' | 'employeeNumber' | 'password' | 'profileId' | 'sessionTimeoutMinutes',
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

  async function handleResetAccountPassword(accountId: string) {
    setAccountPasswordReset({
      accountId,
      isResetting: true,
      temporaryPassword: null,
      message: null,
      error: null,
    })

    try {
      const response = await fetch(apiPath(`api/security/accounts/${accountId}/reset-password`), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La réinitialisation du mot de passe a échoué.'))
      }

      const payload = (await response.json()) as {
        temporaryPassword: string
        message?: string
      }

      await loadAdminSecurityData()
      setAccountPasswordReset({
        accountId,
        isResetting: false,
        temporaryPassword: payload.temporaryPassword,
        message: payload.message ?? 'Mot de passe temporaire généré.',
        error: null,
      })
    } catch (resetError) {
      setAccountPasswordReset({
        accountId,
        isResetting: false,
        temporaryPassword: null,
        message: null,
        error: resetError instanceof Error ? resetError.message : 'Erreur de réinitialisation.',
      })
    }
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
        throw new Error(await getRequestError(response, 'La mise à jour du profil a échoué.'))
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
        throw new Error(await getRequestError(response, 'La création du profil a échoué.'))
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

  function openCreateEmployeeModal() {
    setEditingEmployee(null)
    setEmployeeForm(createEmptyEmployeeForm())
    setIsCreateEmployeeModalOpen(true)
  }

  function openEditEmployeeModal(employee: EmployeeItem) {
    setEditingEmployee(employee)
    setEmployeeForm(buildEmployeeFormFromItem(employee))
  }

  function closeEmployeeModal() {
    if (employeeForm.isSaving) {
      return
    }

    setEditingEmployee(null)
    setIsCreateEmployeeModalOpen(false)
    setEmployeeForm(createEmptyEmployeeForm())
  }

  function handleEmployeeFormFieldChange(field: 'sourceEmployeeId' | 'employeeNumber' | 'displayName' | 'email' | 'phoneNumber', event: ChangeEvent<HTMLInputElement>) {
    setEmployeeForm((current) => ({ ...current, [field]: event.target.value, error: null }))
  }

  function handleEmployeeFormBooleanChange(field: 'isDriver' | 'isActive', event: ChangeEvent<HTMLInputElement>) {
    setEmployeeForm((current) => ({ ...current, [field]: event.target.checked, error: null }))
  }

  async function handleCreateEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmployeeForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/employees'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEmployeePayload(employeeForm)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La creation du salarie a echoue.'))
      }

      await loadAdminSecurityData()
      closeEmployeeModal()
    } catch (createError) {
      setEmployeeForm((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de creation.',
      }))
    }
  }

  async function handleSaveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingEmployee) {
      return
    }

    setEmployeeForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(`api/settings/employees/${editingEmployee.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEmployeePayload(employeeForm, editingEmployee.lastSyncedAtUtc)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise a jour du salarie a echoue.'))
      }

      await loadAdminSecurityData()
      closeEmployeeModal()
    } catch (saveError) {
      setEmployeeForm((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise a jour.',
      }))
    }
  }

  async function handleProvisionEmployeeAccounts() {
    setEmployeeProvisioning({ isProvisioning: true, result: null, error: null })

    try {
      const response = await fetch(apiPath('api/settings/employees/provision-accounts'), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La creation automatique des comptes a echoue.'))
      }

      const result = (await response.json()) as EmployeeAccountProvisioningResult
      await loadAdminSecurityData()
      setEmployeeProvisioning({ isProvisioning: false, result, error: null })
    } catch (provisionError) {
      setEmployeeProvisioning({
        isProvisioning: false,
        result: null,
        error: provisionError instanceof Error ? provisionError.message : 'Provisioning impossible.',
      })
    }
  }

  async function handleImportLuccaEmployees() {
    setLuccaEmployeeImport({ isImporting: true, result: null, error: null })

    try {
      const response = await fetch(apiPath('api/settings/employees/import-lucca'), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'L import Lucca des salaries a echoue.'))
      }

      const result = (await response.json()) as LuccaEmployeeImportResult
      await loadAdminSecurityData()
      setLuccaEmployeeImport({ isImporting: false, result, error: null })
    } catch (importError) {
      setLuccaEmployeeImport({
        isImporting: false,
        result: null,
        error: importError instanceof Error ? importError.message : 'Import Lucca impossible.',
      })
    }
  }

  function handleNewThirdPartyFieldChange(
    field: 'typeCode' | 'displayName' | 'siren' | 'vatNumber' | 'externalReference',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setNewThirdParty((current) => ({
      ...current,
      [field]: field === 'siren' ? event.target.value.replace(/\D/g, '').slice(0, 9) : event.target.value,
      error: null,
    }))
  }

  function handleNewThirdPartyBooleanChange(field: 'isForeignCompany' | 'isActive', event: ChangeEvent<HTMLInputElement>) {
    setNewThirdParty((current) => ({ ...current, [field]: event.target.checked, error: null }))
  }

  function handleNewThirdPartyAnalyticChange(event: ChangeEvent<HTMLSelectElement>) {
    const analyticIds = Array.from(event.target.selectedOptions).map((option) => option.value)
    setNewThirdParty((current) => ({ ...current, analyticIds, error: null }))
  }

  async function handleCreateThirdParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewThirdParty((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/third-parties'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThirdParty),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La creation du tiers a echoue.'))
      }

      await loadAdminSecurityData()
      setNewThirdParty(createEmptyThirdPartyForm())
    } catch (createError) {
      setNewThirdParty((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de creation.',
      }))
    }
  }

  function handleNewMaterialFieldChange(
    field: 'fleetNumber' | 'label' | 'materialType' | 'registrationNumber' | 'sourceSystem' | 'exploitationId',
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setNewMaterial((current) => ({
      ...current,
      [field]: field === 'fleetNumber' || field === 'materialType' ? event.target.value.toUpperCase() : event.target.value,
      error: null,
    }))
  }

  function handleNewMaterialStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setNewMaterial((current) => ({ ...current, isActive: event.target.checked, error: null }))
  }

  async function handleCreateMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewMaterial((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/materials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMaterial,
          exploitationId: newMaterial.exploitationId || null,
          lastSyncedAtUtc: null,
        }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La creation du materiel a echoue.'))
      }

      await loadAdminSecurityData()
      setNewMaterial(createEmptyMaterialForm())
    } catch (createError) {
      setNewMaterial((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de creation.',
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
              <a
                className="auth-forgot-link"
                href="#!"
                onClick={(event) => {
                  event.preventDefault()
                  openForgotPasswordModal()
                }}
              >
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
        {isForgotPasswordModalOpen ? (
          <div className="modal-overlay" onClick={closeForgotPasswordModal} role="presentation">
            <section
              aria-labelledby="forgot-password-title"
              className="modal-card profile-modal-card forgot-password-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">S&eacute;curit&eacute;</span>
                  <h2 id="forgot-password-title">Mot de passe oubli&eacute;</h2>
                </div>
                <button className="modal-close-button" onClick={closeForgotPasswordModal} type="button">
                  Fermer
                </button>
              </div>
              <form className="account-form-card forgot-password-form" onSubmit={handleForgotPasswordSubmit}>
                <p className="profiles-toolbar-copy">
                  Saisissez votre login ou votre email. Si un compte actif correspond, une demande de r&eacute;initialisation
                  sera enregistr&eacute;e.
                </p>
                <label>
                  <span>Login ou email</span>
                  <input
                    autoComplete="username"
                    value={forgotPassword.identifier}
                    onChange={handleForgotPasswordIdentifierChange}
                  />
                </label>

                {forgotPassword.message ? <p className="form-success">{forgotPassword.message}</p> : null}
                {forgotPassword.resetToken ? (
                  <p className="form-success">
                    Jeton de d&eacute;veloppement : <code>{forgotPassword.resetToken}</code>
                  </p>
                ) : null}
                {forgotPassword.error ? <p className="form-error">{forgotPassword.error}</p> : null}

                <div className="profile-action-row">
                  <button className="primary-button" disabled={forgotPassword.isSubmitting} type="submit">
                    {forgotPassword.isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
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
              <div className="functional-module-grid">
                {(modulesByGroup.Exploitation ?? []).map((module) => {
                  const blueprint = getFunctionalModuleBlueprint(module.code)
                  const accessLevel = rightsByModuleCode.get(module.code) ?? 'None'

                  return (
                    <article className="functional-module-card" key={`workspace-${module.code}`}>
                      <header>
                        <div>
                          <span className="eyebrow">{module.code}</span>
                          <h3>{module.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">Scaffold</span>
                      </header>
                      <p>{blueprint.intent}</p>
                      <div className="functional-module-details">
                        <div>
                          <span>Donn&eacute;es attendues</span>
                          <strong>{blueprint.primaryData}</strong>
                        </div>
                        <div>
                          <span>Droit courant</span>
                          <strong>{translateAccessLevel(accessLevel)}</strong>
                        </div>
                        <div>
                          <span>Prochaine &eacute;tape</span>
                          <strong>{blueprint.nextStep}</strong>
                        </div>
                      </div>
                    </article>
                  )
                })}
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
              <div className="functional-module-grid">
                {(modulesByGroup['Gestion administrative'] ?? []).map((module) => {
                  const blueprint = getFunctionalModuleBlueprint(module.code)
                  const accessLevel = rightsByModuleCode.get(module.code) ?? 'None'

                  return (
                    <article className="functional-module-card" key={`workspace-${module.code}`}>
                      <header>
                        <div>
                          <span className="eyebrow">{module.code}</span>
                          <h3>{module.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">Scaffold</span>
                      </header>
                      <p>{blueprint.intent}</p>
                      <div className="functional-module-details">
                        <div>
                          <span>Donn&eacute;es attendues</span>
                          <strong>{blueprint.primaryData}</strong>
                        </div>
                        <div>
                          <span>Droit courant</span>
                          <strong>{translateAccessLevel(accessLevel)}</strong>
                        </div>
                        <div>
                          <span>Prochaine &eacute;tape</span>
                          <strong>{blueprint.nextStep}</strong>
                        </div>
                      </div>
                    </article>
                  )
                })}
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
                        <div className="profile-summary-right">
                          <span>Créé le</span>
                          <strong>{new Date(account.createdAtUtc).toLocaleDateString()}</strong>
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
                {settingsNavigationEntries.map((entry) => (
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
                  {settingsNavigationEntries
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

                {selectedSettingsSection === employeeSettingsSection ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <h3>Salari&eacute;s</h3>
                    <small>{employees.length} salari&eacute;(s) - source Lucca</small>
                  </div>
                  <p className="profiles-toolbar-copy">
                    R&eacute;f&eacute;rentiel local pr&ecirc;t pour l&apos;import Lucca. La qualification conducteur est port&eacute;e par le champ d&eacute;di&eacute; en attendant le mapping d&eacute;finitif.
                  </p>
                  <div className="administration-synthesis-actions">
                    <button className="secondary-button" disabled={luccaEmployeeImport.isImporting} onClick={() => void handleImportLuccaEmployees()} type="button">
                      {luccaEmployeeImport.isImporting ? 'Import Lucca...' : 'Importer depuis Lucca'}
                    </button>
                    <button className="primary-button" onClick={openCreateEmployeeModal} type="button">
                      Ajouter un salari&eacute;
                    </button>
                  </div>
                  {luccaEmployeeImport.error ? <small className="account-error">{luccaEmployeeImport.error}</small> : null}
                  {luccaEmployeeImport.result ? (
                    <div className="status-banner status-banner-success">
                      <strong>Import Lucca termine</strong>
                      <span>
                        {luccaEmployeeImport.result.importedCount} import&eacute;(s), {luccaEmployeeImport.result.createdCount} cr&eacute;&eacute;(s), {luccaEmployeeImport.result.updatedCount} mis &agrave; jour, {luccaEmployeeImport.result.skippedCount} ignor&eacute;(s).
                      </span>
                    </div>
                  ) : null}
                  <div className="tools-safety-banner employee-provisioning-banner">
                    <strong>Creation automatique des comptes</strong>
                    <span>Les salaries actifs sans compte lie par matricule peuvent etre provisionnes sans profil NewNexus. Aucun droit n&apos;est affecte automatiquement.</span>
                    <button
                      className="secondary-button"
                      disabled={employeeProvisioning.isProvisioning || employees.length === 0}
                      onClick={() => void handleProvisionEmployeeAccounts()}
                      type="button"
                    >
                      {employeeProvisioning.isProvisioning ? 'Creation des comptes...' : 'Creer les comptes depuis les salaries'}
                    </button>
                  </div>
                  {employeeProvisioning.error ? <small className="account-error">{employeeProvisioning.error}</small> : null}
                  {employeeProvisioning.result ? (
                    <div className="employee-provisioning-result">
                      <div className="settings-list-header">
                        <h4>Resultat du provisioning</h4>
                        <small>
                          {employeeProvisioning.result.createdCount} cree(s), {employeeProvisioning.result.skippedCount} ignore(s)
                        </small>
                      </div>
                      {employeeProvisioning.result.createdAccounts.length > 0 ? (
                        <div className="sessions-history-table">
                          <div className="sessions-history-header employee-provisioning-header">
                            <span>Salarie</span>
                            <span>Login</span>
                            <span>Mot de passe temporaire</span>
                            <span>Statut</span>
                          </div>
                          {employeeProvisioning.result.createdAccounts.map((item) => (
                            <div className="sessions-history-row employee-provisioning-row" key={item.employeeId}>
                              <strong>{item.displayName}</strong>
                              <span>{item.login ?? '-'}</span>
                              <code className="temporary-password-code">{item.temporaryPassword ?? '-'}</code>
                              <span>{item.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="profiles-overview-grid">
                    {employees.length === 0 ? (
                      <div className="settings-empty">Aucun salari&eacute; charg&eacute; pour le moment.</div>
                    ) : employees.map((employee) => (
                      <article className="profile-summary-card accent-green" key={employee.id}>
                        <header className="profile-summary-header">
                          <div>
                            <h3>{employee.displayName}</h3>
                            <p>{employee.employeeNumber}</p>
                          </div>
                          <span className={`profile-status-badge ${employee.isActive ? 'is-active' : 'is-inactive'}`}>
                            {employee.isDriver ? 'Conducteur' : 'Salarie'}
                          </span>
                        </header>
                        <div className="profile-summary-rights">
                          <div className="profile-summary-right">
                            <span>Source Lucca</span>
                            <strong>{employee.sourceEmployeeId}</strong>
                          </div>
                          <div className="profile-summary-right">
                            <span>Email</span>
                            <strong>{employee.email ?? 'Non renseigne'}</strong>
                          </div>
                          <div className="profile-summary-right">
                            <span>T&eacute;l&eacute;phone</span>
                            <strong>{employee.phoneNumber ?? 'Non renseign&eacute;'}</strong>
                          </div>
                        </div>
                        <div className="profile-summary-actions">
                          <button className="secondary-button" onClick={() => openEditEmployeeModal(employee)} type="button">
                            Configurer le salari&eacute;
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="trace-retention-strip">
                    <strong>R&egrave;gle de s&eacute;curit&eacute;</strong>
                    <span>Un compte issu d&apos;un salari&eacute; import&eacute; devra rester sans droit tant qu&apos;un profil NewNexus n&apos;est pas affect&eacute; explicitement.</span>
                  </div>
                </section>
                ) : null}

                {selectedSettingsSection === thirdPartySettingsSection ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <h3>Tiers</h3>
                    <small>{thirdParties.length} tiers - multi-analytiques</small>
                  </div>
                  <p className="profiles-toolbar-copy">
                    R&eacute;f&eacute;rentiel tiers multi-types avec rattachement possible &agrave; plusieurs analytiques. Les particuliers et entreprises &eacute;trang&egrave;res restent &agrave; arbitrer hors SIRENE.
                  </p>
                  <form className="settings-form settings-create-form" onSubmit={handleCreateThirdParty}>
                    <label>
                      <span>Type</span>
                      <select value={newThirdParty.typeCode} onChange={(event) => handleNewThirdPartyFieldChange('typeCode', event)}>
                        <option value="CLIENT">Client</option>
                        <option value="FOURNISSEUR">Fournisseur</option>
                        <option value="PARTENAIRE">Partenaire</option>
                        <option value="PARTICULIER">Particulier</option>
                        <option value="ETRANGER">Entreprise etrangere</option>
                      </select>
                    </label>
                    <label>
                      <span>Nom du tiers</span>
                      <input value={newThirdParty.displayName} onChange={(event) => handleNewThirdPartyFieldChange('displayName', event)} />
                    </label>
                    <label>
                      <span>SIREN</span>
                      <input inputMode="numeric" value={newThirdParty.siren} onChange={(event) => handleNewThirdPartyFieldChange('siren', event)} />
                    </label>
                    <label>
                      <span>TVA / reference externe</span>
                      <input value={newThirdParty.vatNumber} onChange={(event) => handleNewThirdPartyFieldChange('vatNumber', event)} />
                    </label>
                    <label>
                      <span>Reference externe</span>
                      <input value={newThirdParty.externalReference} onChange={(event) => handleNewThirdPartyFieldChange('externalReference', event)} />
                    </label>
                    <label>
                      <span>Analytiques rattaches</span>
                      <select multiple value={newThirdParty.analyticIds} onChange={handleNewThirdPartyAnalyticChange}>
                        {analytics.map((analytic) => (
                          <option key={analytic.id} value={analytic.id}>{analytic.code} - {analytic.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="toggle-label">
                      <input checked={newThirdParty.isForeignCompany} onChange={(event) => handleNewThirdPartyBooleanChange('isForeignCompany', event)} type="checkbox" />
                      <span>Entreprise etrangere</span>
                    </label>
                    <label className="toggle-label">
                      <input checked={newThirdParty.isActive} onChange={(event) => handleNewThirdPartyBooleanChange('isActive', event)} type="checkbox" />
                      <span>Actif</span>
                    </label>
                    <div className="profile-action-row">
                      <button className="primary-button" disabled={newThirdParty.isSaving} type="submit">
                        {newThirdParty.isSaving ? 'Enregistrement...' : 'Ajouter le tiers'}
                      </button>
                      {newThirdParty.error ? <small className="account-error">{newThirdParty.error}</small> : null}
                    </div>
                  </form>
                  <div className="profiles-overview-grid">
                    {thirdParties.map((thirdParty) => (
                      <article className="profile-summary-card accent-orange" key={thirdParty.id}>
                        <header className="profile-summary-header">
                          <div>
                            <h3>{thirdParty.displayName}</h3>
                            <p>{thirdParty.typeCode}</p>
                          </div>
                          <span className={`profile-status-badge ${thirdParty.isActive ? 'is-active' : 'is-inactive'}`}>
                            {thirdParty.isForeignCompany ? 'Etranger' : 'Actif'}
                          </span>
                        </header>
                        <div className="profile-summary-rights">
                          <div className="profile-summary-right">
                            <span>SIREN</span>
                            <strong>{thirdParty.siren ?? 'Non renseigne'}</strong>
                          </div>
                          <div className="profile-summary-right">
                            <span>Analytiques</span>
                            <strong>{thirdParty.analytics.map((item) => item.code).join(', ') || 'Aucun'}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
                ) : null}

                {selectedSettingsSection === materialSettingsSection ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <h3>Mat&eacute;riels</h3>
                    <small>{materials.length} materiel(s) - parc</small>
                  </div>
                  <p className="profiles-toolbar-copy">
                    R&eacute;f&eacute;rentiel mat&eacute;riels local avec num&eacute;ro de parc unique, pr&ecirc;t pour TruckOnline et YellowBox.
                  </p>
                  <form className="settings-form settings-create-form" onSubmit={handleCreateMaterial}>
                    <label>
                      <span>Numero de parc</span>
                      <input value={newMaterial.fleetNumber} onChange={(event) => handleNewMaterialFieldChange('fleetNumber', event)} />
                    </label>
                    <label>
                      <span>Libelle</span>
                      <input value={newMaterial.label} onChange={(event) => handleNewMaterialFieldChange('label', event)} />
                    </label>
                    <label>
                      <span>Type</span>
                      <select value={newMaterial.materialType} onChange={(event) => handleNewMaterialFieldChange('materialType', event)}>
                        <option value="TRACTEUR">Tracteur</option>
                        <option value="REMORQUE">Remorque</option>
                        <option value="VL">Vehicule leger</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </label>
                    <label>
                      <span>Immatriculation</span>
                      <input value={newMaterial.registrationNumber} onChange={(event) => handleNewMaterialFieldChange('registrationNumber', event)} />
                    </label>
                    <label>
                      <span>Source</span>
                      <select value={newMaterial.sourceSystem} onChange={(event) => handleNewMaterialFieldChange('sourceSystem', event)}>
                        <option value="TruckOnline">TruckOnline</option>
                        <option value="YellowBox">YellowBox</option>
                        <option value="Manuel">Manuel</option>
                      </select>
                    </label>
                    <label>
                      <span>Exploitation</span>
                      <select value={newMaterial.exploitationId} onChange={(event) => handleNewMaterialFieldChange('exploitationId', event)}>
                        <option value="">Non rattache</option>
                        {exploitations.map((exploitation) => (
                          <option key={exploitation.id} value={exploitation.id}>{exploitation.code} - {exploitation.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="toggle-label">
                      <input checked={newMaterial.isActive} onChange={handleNewMaterialStatusChange} type="checkbox" />
                      <span>Actif</span>
                    </label>
                    <div className="profile-action-row">
                      <button className="primary-button" disabled={newMaterial.isSaving} type="submit">
                        {newMaterial.isSaving ? 'Enregistrement...' : 'Ajouter le materiel'}
                      </button>
                      {newMaterial.error ? <small className="account-error">{newMaterial.error}</small> : null}
                    </div>
                  </form>
                  <div className="profiles-overview-grid">
                    {materials.map((material) => (
                      <article className="profile-summary-card accent-navy" key={material.id}>
                        <header className="profile-summary-header">
                          <div>
                            <h3>{material.fleetNumber}</h3>
                            <p>{material.label}</p>
                          </div>
                          <span className={`profile-status-badge ${material.isActive ? 'is-active' : 'is-inactive'}`}>
                            {material.materialType}
                          </span>
                        </header>
                        <div className="profile-summary-rights">
                          <div className="profile-summary-right">
                            <span>Immatriculation</span>
                            <strong>{material.registrationNumber ?? 'Non renseignee'}</strong>
                          </div>
                          <div className="profile-summary-right">
                            <span>Exploitation</span>
                            <strong>{material.exploitation?.label ?? 'Non rattache'}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
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
                <button
                  className={`admin-subnav-link ${selectedToolsSection === 'Sessions' ? 'admin-subnav-link-active' : ''}`}
                  onClick={() => setSelectedToolsSection('Sessions')}
                  type="button"
                >
                  Sessions
                </button>
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
                  <button
                    className="dashboard-action-card"
                    onClick={() => setSelectedToolsSection('Sessions')}
                    type="button"
                  >
                    <span className="eyebrow">Sessions</span>
                    <strong>Sessions utilisateurs</strong>
                    <p>Utilisateurs connectes, historique des connexions et deconnexion forcee.</p>
                  </button>
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

            {selectedToolsSection === 'Sessions' ? (
              <article className="panel-card panel-card-wide admin-tools-card sessions-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Sessions utilisateurs</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Supervision des utilisateurs connectes, historique des connexions et deconnexion forcee.
                </p>
                <div className="administration-synthesis-actions">
                  <button className="secondary-button" onClick={() => void loadUserSessions()} type="button">
                    Rafraichir les sessions
                  </button>
                </div>

                {sessionsError ? (
                  <div className="status-banner status-banner-error">
                    <strong>Sessions indisponibles</strong>
                    <span>{sessionsError}</span>
                  </div>
                ) : null}

                <div className="metrics-grid">
                  <article className="metric-card metric-card-navy">
                    <span className="metric-label">Connectes</span>
                    <strong>{userSessions.active.length}</strong>
                  </article>
                  <article className="metric-card metric-card-champagne">
                    <span className="metric-label">Historique</span>
                    <strong>{userSessions.history.length}</strong>
                  </article>
                  <article className="metric-card metric-card-gold">
                    <span className="metric-label">Expiration defaut</span>
                    <strong>1h</strong>
                  </article>
                  <article className="metric-card metric-card-cyan">
                    <span className="metric-label">Parametrage</span>
                    <strong>Par compte</strong>
                  </article>
                </div>

                <section className="sessions-section">
                  <div className="settings-list-header">
                    <h3>Utilisateurs connectes</h3>
                    <small>{userSessions.active.length} session(s)</small>
                  </div>
                  <div className="sessions-list">
                    {userSessions.active.length > 0 ? (
                      userSessions.active.map((session) => (
                        <article className="session-row-card" key={session.id}>
                          <div>
                            <span className="eyebrow">{session.profileLabel ?? 'Sans profil'}</span>
                            <strong>{session.displayName ?? session.login ?? 'Utilisateur inconnu'}</strong>
                            <small>{session.login ?? 'Login non renseigne'} - {session.ipAddress ?? 'IP inconnue'}</small>
                          </div>
                          <div className="session-row-meta">
                            <span>Connexion: {new Date(session.loginAtUtc).toLocaleString()}</span>
                            <span>Derniere activite: {new Date(session.lastSeenAtUtc).toLocaleString()}</span>
                            <span>Expiration: {new Date(session.expiresAtUtc).toLocaleString()}</span>
                          </div>
                          <button className="secondary-button danger-button" onClick={() => void handleDisconnectUserSession(session.id)} type="button">
                            Deconnecter
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="settings-empty">Aucun utilisateur connecte.</div>
                    )}
                  </div>
                </section>

                <section className="sessions-section">
                  <div className="settings-list-header">
                    <h3>Historique des connexions</h3>
                    <small>{userSessions.history.length} entree(s)</small>
                  </div>
                  <div className="sessions-history-table">
                    <div className="sessions-history-header">
                      <span>Utilisateur</span>
                      <span>Connexion</span>
                      <span>Duree</span>
                      <span>Statut</span>
                    </div>
                    {userSessions.history.length > 0 ? (
                      userSessions.history.map((session) => (
                        <div className="sessions-history-row" key={`history-${session.id}`}>
                          <strong>{session.displayName ?? session.login ?? 'Utilisateur inconnu'}</strong>
                          <span>{new Date(session.loginAtUtc).toLocaleString()}</span>
                          <span>{formatDurationMinutes(session.durationMinutes)}</span>
                          <span className={`profile-status-badge ${session.isActive ? 'is-active' : 'is-inactive'}`}>
                            {session.isActive ? 'Active' : session.revokedAtUtc ? 'Deconnectee' : session.logoutAtUtc ? 'Fermee' : 'Expiree'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="settings-empty">Aucun historique de connexion.</div>
                    )}
                  </div>
                </section>
              </article>
            ) : null}

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
                  <div className="tools-safety-banner">
                    <strong>Readiness backlog 1 + 2 hors SSO/mail + 3 + 5</strong>
                    <span>Vue de pilotage consolidee pour verifier ce qui est testable et ce qui reste conditionne par arbitrage ou contrat API externe.</span>
                  </div>
                  {[
                    ['UX', adminDiagnostics.readiness.ux],
                    ['Securite et administration', adminDiagnostics.readiness.security],
                    ['Parametres transverses', adminDiagnostics.readiness.settings],
                    ['Interfaces', adminDiagnostics.readiness.interfaces],
                  ].map(([sectionLabel, items]) => (
                    <section className="readiness-section" key={sectionLabel as string}>
                      <div className="settings-list-header">
                        <h3>{sectionLabel as string}</h3>
                        <small>{(items as AdminReadinessItem[]).length} chantier(s)</small>
                      </div>
                      <div className="tools-catalog-grid readiness-grid">
                        {(items as AdminReadinessItem[]).map((item) => (
                          <article className="tool-blueprint-card readiness-card" key={`${sectionLabel}-${item.label}`}>
                            <header>
                              <div>
                                <span className="eyebrow">{item.status}</span>
                                <h3>{item.label}</h3>
                              </div>
                            </header>
                            <p>{item.detail}</p>
                            <div className="profile-summary-right">
                              <span>Prochaine etape</span>
                              <strong>{item.nextStep}</strong>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
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

            {selectedToolsSection === 'Tâches planifiées' ? (
              <article className="panel-card panel-card-wide scheduled-tasks-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Tâches planifiées</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Première vue de pilotage des traitements à automatiser. Les connecteurs restent à raccorder avant activation.
                </p>
                <div className="scheduled-tasks-grid">
                  {scheduledTasks.map((task) => (
                    <article className="scheduled-task-card" key={task.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{task.scope}</span>
                          <h3>{task.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">{task.status}</span>
                      </header>
                      <p>{task.description}</p>
                      <div className="profile-summary-rights">
                        <div className="profile-summary-right">
                          <span>Cadence</span>
                          <strong>{task.cadence}</strong>
                        </div>
                        <div className="profile-summary-right">
                          <span>Code technique</span>
                          <strong>{task.code}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {selectedToolsSection === toolsSubmenuEntries[3] ? (
              <article className="panel-card panel-card-wide tools-catalog-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Requ&ecirc;teur SQL</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Espace de cadrage pour des requ&ecirc;tes contr&ocirc;l&eacute;es. Aucun SQL libre n&apos;est ex&eacute;cut&eacute; depuis l&apos;interface &agrave; ce stade.
                </p>
                <div className="tools-safety-banner">
                  <strong>R&egrave;gles &agrave; verrouiller avant activation</strong>
                  <span>Lecture seule, requ&ecirc;tes nomm&eacute;es, param&egrave;tres typ&eacute;s, journalisation et exclusion des secrets.</span>
                </div>
                <div className="tools-catalog-grid">
                  {controlledSqlCatalog.map((query) => (
                    <article className="tool-blueprint-card" key={query.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{query.scope}</span>
                          <h3>{query.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">{query.status}</span>
                      </header>
                      <p>{query.output}</p>
                      <div className="profile-summary-right">
                        <span>Code technique</span>
                        <strong>{query.code}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {selectedToolsSection === 'Requêteur SQL' ? (
              <article className="panel-card panel-card-wide tools-catalog-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Requêteur SQL</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Espace de cadrage pour des requêtes contrôlées. Aucun SQL libre n&apos;est exécuté depuis l&apos;interface à ce stade.
                </p>
                <div className="tools-safety-banner">
                  <strong>Règles à verrouiller avant activation</strong>
                  <span>Lecture seule, requêtes nommées, paramètres typés, journalisation et exclusion des secrets.</span>
                </div>
                <div className="tools-catalog-grid">
                  {controlledSqlQueries.map((query) => (
                    <article className="tool-blueprint-card" key={query.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{query.scope}</span>
                          <h3>{query.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">{query.status}</span>
                      </header>
                      <p>{query.output}</p>
                      <div className="profile-summary-right">
                        <span>Code technique</span>
                        <strong>{query.code}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {selectedToolsSection === toolsSubmenuEntries[4] ? (
              <article className="panel-card panel-card-wide tools-catalog-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Traces</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Pr&eacute;paration de la future consultation des journaux applicatifs et techniques, avec conservation ma&icirc;tris&eacute;e.
                </p>
                <div className="tools-catalog-grid">
                  {traceCatalog.map((stream) => (
                    <article className="tool-blueprint-card" key={stream.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{stream.scope}</span>
                          <h3>{stream.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">&Agrave; raccorder</span>
                      </header>
                      <p>{stream.description}</p>
                      <div className="profile-summary-rights">
                        <div className="profile-summary-right">
                          <span>R&eacute;tention</span>
                          <strong>{stream.retention}</strong>
                        </div>
                        <div className="profile-summary-right">
                          <span>Code technique</span>
                          <strong>{stream.code}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="trace-retention-strip">
                  <strong>Point de vigilance</strong>
                  <span>Les traces devront masquer les secrets, filtrer les donn&eacute;es personnelles et conserver une piste d&apos;audit des consultations.</span>
                </div>
              </article>
            ) : null}

            {selectedToolsSection === 'Traces' && false ? (
              <article className="panel-card panel-card-wide tools-catalog-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Traces</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Préparation de la future consultation des journaux applicatifs et techniques, avec conservation maîtrisée.
                </p>
                <div className="tools-catalog-grid">
                  {traceStreams.map((stream) => (
                    <article className="tool-blueprint-card" key={stream.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{stream.scope}</span>
                          <h3>{stream.label}</h3>
                        </div>
                        <span className="profile-status-badge is-inactive">À raccorder</span>
                      </header>
                      <p>{stream.description}</p>
                      <div className="profile-summary-rights">
                        <div className="profile-summary-right">
                          <span>Rétention</span>
                          <strong>{stream.retention}</strong>
                        </div>
                        <div className="profile-summary-right">
                          <span>Code technique</span>
                          <strong>{stream.code}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="trace-retention-strip">
                  <strong>Point de vigilance</strong>
                  <span>Les traces devront masquer les secrets, filtrer les données personnelles et conserver une piste d&apos;audit des consultations.</span>
                </div>
              </article>
            ) : null}

            {selectedToolsSection !== 'Accueil' &&
            selectedToolsSection !== 'Sessions' &&
            selectedToolsSection !== toolsSubmenuEntries[3] &&
            selectedToolsSection !== toolsSubmenuEntries[4] &&
            selectedToolsSection !== 'Clés API' &&
            selectedToolsSection !== 'Tâches planifiées' &&
            selectedToolsSection !== 'Requêteur SQL' &&
            selectedToolsSection !== 'Traces' &&
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

        {isCreateEmployeeModalOpen || editingEmployee ? (
          <div className="modal-overlay" onClick={closeEmployeeModal} role="presentation">
            <section
              aria-labelledby="employee-modal-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{editingEmployee ? 'Configuration' : 'Création'}</span>
                  <h2 id="employee-modal-title">{editingEmployee ? 'Configurer le salarié' : 'Ajouter un salarié'}</h2>
                </div>
                <button className="modal-close-button" onClick={closeEmployeeModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="settings-form settings-create-form" onSubmit={editingEmployee ? handleSaveEmployee : handleCreateEmployee}>
                <label>
                  <span>ID source Lucca</span>
                  <input value={employeeForm.sourceEmployeeId} onChange={(event) => handleEmployeeFormFieldChange('sourceEmployeeId', event)} />
                </label>
                <label>
                  <span>Matricule</span>
                  <input value={employeeForm.employeeNumber} onChange={(event) => handleEmployeeFormFieldChange('employeeNumber', event)} />
                </label>
                <label>
                  <span>Nom complet</span>
                  <input value={employeeForm.displayName} onChange={(event) => handleEmployeeFormFieldChange('displayName', event)} />
                </label>
                <label>
                  <span>Email</span>
                  <input value={employeeForm.email} onChange={(event) => handleEmployeeFormFieldChange('email', event)} />
                </label>
                <label>
                  <span>Téléphone</span>
                  <input value={employeeForm.phoneNumber} onChange={(event) => handleEmployeeFormFieldChange('phoneNumber', event)} />
                </label>
                <label className="toggle-label">
                  <input checked={employeeForm.isDriver} onChange={(event) => handleEmployeeFormBooleanChange('isDriver', event)} type="checkbox" />
                  <span>Conducteur</span>
                </label>
                <label className="toggle-label">
                  <input checked={employeeForm.isActive} onChange={(event) => handleEmployeeFormBooleanChange('isActive', event)} type="checkbox" />
                  <span>Actif</span>
                </label>
                <div className="profile-action-row">
                  <button className="primary-button" disabled={employeeForm.isSaving} type="submit">
                    {employeeForm.isSaving ? 'Enregistrement...' : editingEmployee ? 'Enregistrer le salarié' : 'Ajouter le salarié'}
                  </button>
                  {employeeForm.error ? <small className="account-error">{employeeForm.error}</small> : null}
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
                  <label>
                    <span>Deconnexion auto (minutes)</span>
                    <input
                      min="5"
                      max="1440"
                      type="number"
                      value={newAccount.sessionTimeoutMinutes}
                      onChange={(event) => handleNewAccountFieldChange('sessionTimeoutMinutes', event)}
                    />
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
                <div className="account-lifecycle-panel">
                  <div className="account-lifecycle-grid">
                    <div>
                      <span className="eyebrow">Dernière connexion</span>
                      <strong>{editingAccount.lastLoginAtUtc ? new Date(editingAccount.lastLoginAtUtc).toLocaleString() : 'Jamais'}</strong>
                    </div>
                    <div>
                      <span className="eyebrow">Création</span>
                      <strong>{new Date(editingAccount.createdAtUtc).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="eyebrow">Import</span>
                      <strong>{editingAccount.lastSyncedAtUtc ? new Date(editingAccount.lastSyncedAtUtc).toLocaleString() : 'Aucun'}</strong>
                    </div>
                    <div>
                      <span className="eyebrow">Mot de passe oublié</span>
                      <strong>{editingAccount.email ? 'Email disponible' : 'Email manquant'}</strong>
                    </div>
                  </div>
                  {!editingAccount.email ? (
                    <p className="settings-note">
                      Renseignez un email pour permettre le futur envoi automatique des liens de réinitialisation.
                    </p>
                  ) : null}
                  <div className="account-reset-actions">
                    <button
                      className="secondary-button"
                      disabled={
                        accountPasswordReset.isResetting && accountPasswordReset.accountId === editingAccount.id
                      }
                      onClick={() => void handleResetAccountPassword(editingAccount.id)}
                      type="button"
                    >
                      {accountPasswordReset.isResetting && accountPasswordReset.accountId === editingAccount.id
                        ? 'Réinitialisation...'
                        : 'Réinitialiser le mot de passe'}
                    </button>
                    {accountPasswordReset.accountId === editingAccount.id && accountPasswordReset.message ? (
                      <small className="form-success">{accountPasswordReset.message}</small>
                    ) : null}
                    {accountPasswordReset.accountId === editingAccount.id && accountPasswordReset.temporaryPassword ? (
                      <code className="temporary-password-code">{accountPasswordReset.temporaryPassword}</code>
                    ) : null}
                    {accountPasswordReset.accountId === editingAccount.id && accountPasswordReset.error ? (
                      <small className="account-error">{accountPasswordReset.error}</small>
                    ) : null}
                  </div>
                </div>
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
                  <label>
                    <span>Deconnexion auto (minutes)</span>
                    <input
                      min="5"
                      max="1440"
                      type="number"
                      value={editingEditableAccount.sessionTimeoutMinutes}
                      onChange={(event) => handleEditableAccountFieldChange(editingAccount.id, 'sessionTimeoutMinutes', event)}
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
    sessionTimeoutMinutes: '60',
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

function createEmptyForgotPasswordForm(): ForgotPasswordState {
  return {
    identifier: '',
    isSubmitting: false,
    message: null,
    error: null,
    resetToken: null,
  }
}

function createEmptyAccountPasswordResetState(): AccountPasswordResetState {
  return {
    accountId: null,
    isResetting: false,
    temporaryPassword: null,
    message: null,
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
    sessionTimeoutMinutes: Number.parseInt(account.sessionTimeoutMinutes, 10) || 60,
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

function createEmptyEmployeeForm(): EmployeeFormState {
  return {
    sourceEmployeeId: '',
    employeeNumber: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    isDriver: false,
    isActive: true,
    isSaving: false,
    error: null,
  }
}

function buildEmployeeFormFromItem(employee: EmployeeItem): EmployeeFormState {
  return {
    sourceEmployeeId: employee.sourceEmployeeId,
    employeeNumber: employee.employeeNumber,
    displayName: employee.displayName,
    email: employee.email ?? '',
    phoneNumber: employee.phoneNumber ?? '',
    isDriver: employee.isDriver,
    isActive: employee.isActive,
    isSaving: false,
    error: null,
  }
}

function buildEmployeePayload(employee: EmployeeFormState, lastSyncedAtUtc: string | null = null) {
  return {
    sourceEmployeeId: employee.sourceEmployeeId.trim(),
    employeeNumber: employee.employeeNumber.trim(),
    displayName: employee.displayName.trim(),
    email: employee.email.trim() || null,
    phoneNumber: employee.phoneNumber.trim() || null,
    isDriver: employee.isDriver,
    isActive: employee.isActive,
    lastSyncedAtUtc,
  }
}

function createEmptyThirdPartyForm(): ThirdPartyFormState {
  return {
    typeCode: 'CLIENT',
    displayName: '',
    siren: '',
    vatNumber: '',
    externalReference: '',
    isForeignCompany: false,
    isActive: true,
    analyticIds: [],
    isSaving: false,
    error: null,
  }
}

function createEmptyMaterialForm(): MaterialFormState {
  return {
    fleetNumber: '',
    label: '',
    materialType: 'TRACTEUR',
    registrationNumber: '',
    sourceSystem: 'TruckOnline',
    exploitationId: '',
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

function normalizeMojibakeText(value: string) {
  return mojibakeTextReplacements.reduce(
    (normalized, [broken, fixed]) => normalized.split(broken).join(fixed),
    value,
  )
}

function normalizeVisibleTextNodes(root: HTMLElement | null) {
  if (!root) {
    return
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text)
  }

  for (const node of nodes) {
    if (node.parentElement?.closest('script, style')) {
      continue
    }

    const normalized = normalizeMojibakeText(node.nodeValue ?? '')
    if (normalized !== node.nodeValue) {
      node.nodeValue = normalized
    }
  }
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

function getToolsSectionDescription(section: string) {
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

function formatDurationMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes)
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}`
}

function getSettingsSectionDescription(section: string) {
  switch (section) {
    case 'Sociétés':
      return 'Créer et maintenir les sociétés Groupe Laure.'
    case 'Analytiques':
      return 'Créer et maintenir les codes analytiques rattachés aux sociétés.'
    case employeeSettingsSection:
      return 'Pr\u00e9parer le r\u00e9f\u00e9rentiel salari\u00e9s Lucca, la qualification conducteur et la cr\u00e9ation de comptes sans droit.'
    case thirdPartySettingsSection:
      return 'Pr\u00e9parer les tiers multi-types et leur rattachement multi-analytiques.'
    case materialSettingsSection:
      return 'Pr\u00e9parer le r\u00e9f\u00e9rentiel mat\u00e9riels, le num\u00e9ro de parc unique et les imports exploitation.'
    case 'Exploitations':
      return 'Créer et maintenir les exploitations rattachées aux sociétés.'
    default:
      return 'Synthèse des référentiels transverses.'
  }
}

function getFunctionalModuleBlueprint(moduleCode: string): FunctionalModuleBlueprint {
  switch (moduleCode) {
    case 'GESTION_CONTRAVENTIONS':
      return {
        intent: 'Suivre les contraventions, leur statut de traitement et les rattachements conducteurs ou vehicules.',
        primaryData: 'Infractions, conducteurs, vehicules, echeances et justificatifs.',
        nextStep: 'Definir le schema metier et le workflow de traitement.',
      }
    case 'CARTE_POINTS_CHARGEMENT_DECHARGEMENT':
      return {
        intent: 'Visualiser les points de chargement et de dechargement utiles aux equipes exploitation.',
        primaryData: 'Sites, adresses, coordonnees, societes et exploitations rattachees.',
        nextStep: 'Raccorder Geoapify / OpenStreetMap et cadrer le modele des points.',
      }
    case 'INDICATEURS_CONDUCTEURS':
      return {
        intent: 'Preparer les indicateurs de suivi conducteurs issus des donnees RH et exploitation.',
        primaryData: 'Salaries Lucca, qualification conducteur, activite et donnees d exploitation.',
        nextStep: 'Importer les salaries Lucca et definir les indicateurs prioritaires.',
      }
    case 'INDICATEURS_TRACTEURS':
      return {
        intent: 'Preparer les indicateurs de suivi du parc tracteurs pour le pilotage exploitation.',
        primaryData: 'Materiels, parc, statuts TruckOnline, telematique YellowBox et exploitations.',
        nextStep: 'Raccorder TruckOnline puis cadrer le modele materiel local.',
      }
    default:
      return {
        intent: 'Module visible par droits, en attente de specification metier detaillee.',
        primaryData: 'Perimetre fonctionnel a confirmer.',
        nextStep: 'Cadrer les donnees, les actions et les droits fins du module.',
      }
  }
}

export default App
