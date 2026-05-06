import { useEffect, useMemo, useRef, useState } from 'react'
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
  isSidebarCollapsed: boolean
  lastLoginAtUtc: string | null
  profile: {
    id: string
    code: string
    label: string
  } | null
  rights: ProfileRight[]
}

type ClientWeather = {
  code: number | null
  isDay: boolean
  city: string | null
  status: 'loading' | 'ready' | 'unavailable'
}

type NexaSessionInsight = {
  companion: string
  message: string
  generatedAtUtc: string
  mode: string
  profileCode: string
  signals: string[]
  suggestions: string[]
}

type NexaUsageSignal = {
  signalType: string
  navigation: string
  section: string | null
  detail: string | null
  dashboardProfileCode: string | null
}

type NexaChatMessage = {
  role: 'user' | 'assistant'
  content: string
  mode?: string
  warning?: string | null
}

type NexaChatResponse = {
  companion: string
  mode: string
  provider: string
  model: string
  isLocalAiAvailable: boolean
  answer: string
  generatedAtUtc: string
  sources: string[]
  warning: string | null
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

type ControlledSqlQuery = {
  code: string
  scope: string
  label: string
  description: string
  columns: string[]
}

type ControlledSqlQueryResult = {
  query: ControlledSqlQuery
  rows: Record<string, string | number | boolean | null>[]
  rowCount: number
  executedAtUtc: string
}

type TraceStream = {
  code: string
  label: string
  description: string
  retention: string
}

type ApplicationTrace = {
  id: string
  streamCode: string
  streamLabel: string
  eventCode: string
  level: string
  message: string
  detail: string | null
  subject: string | null
  actorUserAccountId: string | null
  actorLogin: string | null
  ipAddress: string | null
  createdAtUtc: string
}

type ApplicationTracesPayload = {
  streams: TraceStream[]
  traces: ApplicationTrace[]
  limit: number
}

type ScheduledTaskItem = {
  code: string
  label: string
  scope: string
  cadence: string
  status: string
  description: string
  isRunnable: boolean
  lastRun: {
    subject: string
    level: string
    message: string
    detail: string | null
    createdAtUtc: string
  } | null
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
  postalCode: string | null
  city: string | null
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

type ContraventionItem = {
  id: string
  noticeNumber: string
  offenseDate: string
  dueDate: string | null
  amount: number
  statusCode: string
  statusLabel: string
  offenseLabel: string
  location: string | null
  notes: string | null
  createdAtUtc: string
  updatedAtUtc: string
  driverEmployee: {
    id: string
    employeeNumber: string
    displayName: string
  } | null
  material: {
    id: string
    fleetNumber: string
    label: string
    registrationNumber: string | null
  } | null
}

type ContraventionFormState = {
  noticeNumber: string
  offenseDate: string
  dueDate: string
  amount: string
  statusCode: string
  offenseLabel: string
  location: string
  notes: string
  driverEmployeeId: string
  materialId: string
  isSaving: boolean
  error: string | null
}

type LoadingPointItem = {
  id: string
  code: string
  label: string
  pointTypeCode: string
  pointTypeLabel: string
  addressLine: string
  postalCode: string
  city: string
  countryCode: string
  latitude: number | null
  longitude: number | null
  isActive: boolean
  notes: string | null
  createdAtUtc: string
  updatedAtUtc: string
  thirdParty: {
    id: string
    typeCode: string
    displayName: string
  } | null
  exploitation: {
    id: string
    code: string
    label: string
  } | null
}

type LoadingPointFormState = {
  code: string
  label: string
  pointTypeCode: string
  addressLine: string
  postalCode: string
  city: string
  countryCode: string
  latitude: string
  longitude: string
  thirdPartyId: string
  exploitationId: string
  isActive: boolean
  notes: string
  isSaving: boolean
  error: string | null
}

type DriverIndicatorsPayload = {
  summary: {
    totalDrivers: number
    activeDrivers: number
    driversWithAccounts: number
    driversWithoutAccount: number
    driversWithOpenContraventions: number
    incompleteContactData: number
  }
  drivers: Array<{
    id: string
    employeeNumber: string
    displayName: string
    email: string | null
    phoneNumber: string | null
    isActive: boolean
    lastSyncedAtUtc: string | null
    accountLogin: string | null
    accountProfile: string | null
    accountIsActive: boolean | null
    openContraventions: number
    totalContraventions: number
    dataQuality: string
  }>
}

type TractorIndicatorsPayload = {
  summary: {
    totalTractors: number
    activeTractors: number
    truckOnlineLinked: number
    yellowBoxLinked: number
    withExploitation: number
    withOpenContraventions: number
  }
  tractors: Array<{
    id: string
    fleetNumber: string
    label: string
    registrationNumber: string | null
    sourceSystem: string | null
    isActive: boolean
    lastSyncedAtUtc: string | null
    exploitation: {
      id: string
      code: string
      label: string
    } | null
    openContraventions: number
    totalContraventions: number
    dataQuality: string
  }>
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
  isSireneValidated: boolean
  isSaving: boolean
  error: string | null
}

type SireneCompanySearchFormState = {
  name: string
  city: string
  postalCode: string
  isSearching: boolean
  results: SireneCompanyLookup[]
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

const commonDataNavigationLabel = 'Donn\u00e9es Communes'
const navigationEntries = ['Administration', commonDataNavigationLabel, 'Exploitation', 'Gestion administrative']
const administrationSettingsSection = 'Param\u00e8tres'
const administrationSubmenuEntries = ['Accueil', 'Comptes utilisateurs', 'Outils', administrationSettingsSection, 'Profils'] as const
const settingsCompaniesSection = 'Soci\u00e9t\u00e9s'
const toolsApiKeysSection = 'Cl\u00e9s API'
const toolsDiagnosticsSection = 'Diagnostics'
const toolsSqlSection = 'Requ\u00eateur SQL'
const toolsSessionsSection = 'Sessions'
const toolsScheduledTasksSection = 'T\u00e2ches planifi\u00e9es'
const toolsTracesSection = 'Traces'
const settingsSubmenuEntries = ['Accueil', 'Analytiques', 'Exploitations', settingsCompaniesSection] as const
const hiddenIntegrationProviderCodes = new Set(['LEGACY_NEXUS', 'TRACTOR_TRACKING'])
const employeeSettingsSection = 'Salari\u00e9s'
const thirdPartySettingsSection = 'Tiers'
const materialSettingsSection = 'Mat\u00e9riels'
const settingsNavigationEntries = [...settingsSubmenuEntries] as const
const dashboardProfileCodes = ['INFORMATIQUE', 'DIRECTION', 'EXPLOITATION', 'ADMINISTRATIF'] as const
const dashboardModuleByProfileCode: Record<string, string> = {
  INFORMATIQUE: 'DASHBOARD_INFORMATIQUE',
  DIRECTION: 'DASHBOARD_DIRECTION',
  EXPLOITATION: 'DASHBOARD_EXPLOITATION',
  ADMINISTRATIF: 'DASHBOARD_ADMINISTRATIF',
}
const dashboardProfileLabels: Record<string, string> = {
  INFORMATIQUE: 'Informatique',
  DIRECTION: 'Direction',
  EXPLOITATION: 'Exploitation',
  ADMINISTRATIF: 'Administratif',
}
const commonDataModuleCode = 'DONNEES_COMMUNES'
const contraventionsModuleCode = 'CONTRAVENTIONS'
const loadingPointsModuleCode = 'CARTE_POINTS_CHARGEMENT_DECHARGEMENT'
const driverIndicatorsModuleCode = 'INDICATEURS_CONDUCTEURS'
const tractorIndicatorsModuleCode = 'INDICATEURS_TRACTEURS'
const contraventionStatuses = [
  { code: 'A_TRAITER', label: 'A traiter' },
  { code: 'EN_CONTESTATION', label: 'En contestation' },
  { code: 'A_PAYER', label: 'A payer' },
  { code: 'PAYEE', label: 'Payee' },
  { code: 'CLASSEE', label: 'Classee' },
]
const loadingPointTypes = [
  { code: 'CHARGEMENT', label: 'Chargement' },
  { code: 'DECHARGEMENT', label: 'Dechargement' },
  { code: 'MIXTE', label: 'Mixte' },
]
const commonDataNavigationEntries = ['Accueil', materialSettingsSection, employeeSettingsSection, thirdPartySettingsSection] as const
const toolsSubmenuEntries = [
  'Accueil',
  toolsApiKeysSection,
  toolsDiagnosticsSection,
  toolsSqlSection,
  toolsSessionsSection,
  toolsScheduledTasksSection,
  toolsTracesSection,
] as const
const postAuthLoaderStorageKey = 'newnexus:post-auth-loader'
const knownSessionStorageKey = 'newnexus:known-session'
const defaultWeatherLocation = {
  city: 'Saint-\u00c9tienne-de-Montluc (44360)',
  latitude: 47.278,
  longitude: -1.779,
}
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
  ['A tester', '\u00c0 tester'],
  ['A planifier', '\u00c0 planifier'],
  ['A raccorder', '\u00c0 raccorder'],
  ['A cadrer', '\u00c0 cadrer'],
  ['a completer', '\u00e0 compl\u00e9ter'],
  ['a confirmer', '\u00e0 confirmer'],
  ['a enregistrer', '\u00e0 enregistrer'],
  ['a jour', '\u00e0 jour'],
  ['a maintenir', '\u00e0 maintenir'],
  ['a valider', '\u00e0 valider'],
  ['acces', 'acc\u00e8s'],
  ['actives', 'activ\u00e9es'],
  ['activee', 'activ\u00e9e'],
  ['activite', 'activit\u00e9'],
  ['cible est valide', 'cible est valid\u00e9'],
  ['cles', 'cl\u00e9s'],
  ['controle', 'contr\u00f4le'],
  ['Controle', 'Contr\u00f4le'],
  ['coordonnees', 'coordonn\u00e9es'],
  ['Coordonnees', 'Coordonn\u00e9es'],
  ['creation', 'cr\u00e9ation'],
  ['Creation', 'Cr\u00e9ation'],
  ['cree(s)', 'cr\u00e9\u00e9(s)'],
  ['Creer', 'Cr\u00e9er'],
  ['declare', 'd\u00e9clar\u00e9'],
  ['dechargement', 'd\u00e9chargement'],
  ['definir', 'd\u00e9finir'],
  ['definitif', 'd\u00e9finitif'],
  ['detaillee', 'd\u00e9taill\u00e9e'],
  ['donnees', 'donn\u00e9es'],
  ['echeances', '\u00e9ch\u00e9ances'],
  ['ecriture', '\u00e9criture'],
  ['edition', '\u00e9dition'],
  ['equipes', '\u00e9quipes'],
  ['etat', '\u00e9tat'],
  ['executions', 'ex\u00e9cutions'],
  ['execute', 'ex\u00e9cut\u00e9'],
  ['Geocodage', 'G\u00e9ocodage'],
  ['ignore(s)', 'ignor\u00e9(s)'],
  ['libelle', 'libell\u00e9'],
  ['lie par matricule', 'li\u00e9 par matricule'],
  ['materiel', 'mat\u00e9riel'],
  ['Materiel', 'Mat\u00e9riel'],
  ['materiels', 'mat\u00e9riels'],
  ['Materiels', 'Mat\u00e9riels'],
  ['metier', 'm\u00e9tier'],
  ['modele', 'mod\u00e8le'],
  ['Numero', 'Num\u00e9ro'],
  ['numero', 'num\u00e9ro'],
  ['operationnels', 'op\u00e9rationnels'],
  ['periodique', 'p\u00e9riodique'],
  ['perimetre', 'p\u00e9rim\u00e8tre'],
  ['planifiee', 'planifi\u00e9e'],
  ['planifiees', 'planifi\u00e9es'],
  ['priorites', 'priorit\u00e9s'],
  ['Priorites', 'Priorit\u00e9s'],
  ['pret', 'pr\u00eat'],
  ['prete', 'pr\u00eate'],
  ['Preparer', 'Pr\u00e9parer'],
  ['Referentiel', 'R\u00e9f\u00e9rentiel'],
  ['referentiel', 'r\u00e9f\u00e9rentiel'],
  ['rattache', 'rattach\u00e9'],
  ['rattachee', 'rattach\u00e9e'],
  ['rattachees', 'rattach\u00e9es'],
  ['reelle', 'r\u00e9elle'],
  ['reel', 'r\u00e9el'],
  ['renseignee', 'renseign\u00e9e'],
  ['reservee', 'r\u00e9serv\u00e9e'],
  ['salarie', 'salari\u00e9'],
  ['Salarie', 'Salari\u00e9'],
  ['salaries', 'salari\u00e9s'],
  ['Salaries', 'Salari\u00e9s'],
  ['societe', 'soci\u00e9t\u00e9'],
  ['Societe', 'Soci\u00e9t\u00e9'],
  ['societes', 'soci\u00e9t\u00e9s'],
  ['Societes', 'Soci\u00e9t\u00e9s'],
  ['specification', 'sp\u00e9cification'],
  ['telematique', 't\u00e9l\u00e9matique'],
  ['tache', 't\u00e2che'],
  ['Tache', 'T\u00e2che'],
  ['taches', 't\u00e2ches'],
  ['Taches', 'T\u00e2ches'],
  ['vehicule', 'v\u00e9hicule'],
  ['vehicules', 'v\u00e9hicules'],
  ['verrouillee', 'verrouill\u00e9e'],
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
  const [contraventions, setContraventions] = useState<ContraventionItem[]>([])
  const [loadingPoints, setLoadingPoints] = useState<LoadingPointItem[]>([])
  const [driverIndicators, setDriverIndicators] = useState<DriverIndicatorsPayload | null>(null)
  const [tractorIndicators, setTractorIndicators] = useState<TractorIndicatorsPayload | null>(null)
  const [adminDiagnostics, setAdminDiagnostics] = useState<AdminDiagnostics | null>(null)
  const [integrationCredentials, setIntegrationCredentials] = useState<IntegrationCredentialItem[]>([])
  const [userSessions, setUserSessions] = useState<UserSessionsPayload>({ active: [], history: [] })
  const [controlledSqlCatalog, setControlledSqlCatalog] = useState<ControlledSqlQuery[]>([])
  const [controlledSqlResult, setControlledSqlResult] = useState<ControlledSqlQueryResult | null>(null)
  const [applicationTraces, setApplicationTraces] = useState<ApplicationTracesPayload>({ streams: [], traces: [], limit: 100 })
  const [selectedTraceStream, setSelectedTraceStream] = useState<string>('ALL')
  const [scheduledTaskCatalog, setScheduledTaskCatalog] = useState<ScheduledTaskItem[]>([])
  const [editableAccounts, setEditableAccounts] = useState<Record<string, EditableAccountState>>({})
  const [editableProfiles, setEditableProfiles] = useState<Record<string, EditableProfileState>>({})
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
  const [newAnalytic, setNewAnalytic] = useState<SettingsReferenceFormState>(createEmptySettingsReferenceForm())
  const [newExploitation, setNewExploitation] = useState<SettingsReferenceFormState>(createEmptySettingsReferenceForm())
  const [newThirdParty, setNewThirdParty] = useState<ThirdPartyFormState>(createEmptyThirdPartyForm())
  const [newMaterial, setNewMaterial] = useState<MaterialFormState>(createEmptyMaterialForm())
  const [contraventionForm, setContraventionForm] = useState<ContraventionFormState>(createEmptyContraventionForm())
  const [loadingPointForm, setLoadingPointForm] = useState<LoadingPointFormState>(createEmptyLoadingPointForm())
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null)
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null)
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdPartyItem | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null)
  const [editingContravention, setEditingContravention] = useState<ContraventionItem | null>(null)
  const [editingLoadingPoint, setEditingLoadingPoint] = useState<LoadingPointItem | null>(null)
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(createEmptyEmployeeForm())
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(createEmptyCompanyForm())
  const [sireneCompanySearch, setSireneCompanySearch] = useState<SireneCompanySearchFormState>(createEmptySireneCompanySearchForm())
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false)
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false)
  const [isThirdPartyModalOpen, setIsThirdPartyModalOpen] = useState(false)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isContraventionModalOpen, setIsContraventionModalOpen] = useState(false)
  const [isLoadingPointModalOpen, setIsLoadingPointModalOpen] = useState(false)
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
  const [selectedWorkspaceSection, setSelectedWorkspaceSection] = useState('Accueil')
  const [selectedDashboardProfileCode, setSelectedDashboardProfileCode] = useState<string | null>(null)
  const [expandedSidebarMenu, setExpandedSidebarMenu] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [controlledSqlError, setControlledSqlError] = useState<string | null>(null)
  const [runningControlledSqlCode, setRunningControlledSqlCode] = useState<string | null>(null)
  const [tracesError, setTracesError] = useState<string | null>(null)
  const [scheduledTasksError, setScheduledTasksError] = useState<string | null>(null)
  const [runningScheduledTaskCode, setRunningScheduledTaskCode] = useState<string | null>(null)
  const [contraventionsError, setContraventionsError] = useState<string | null>(null)
  const [loadingPointsError, setLoadingPointsError] = useState<string | null>(null)
  const [driverIndicatorsError, setDriverIndicatorsError] = useState<string | null>(null)
  const [tractorIndicatorsError, setTractorIndicatorsError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date())
  const [hasKnownSession, setHasKnownSession] = useState(() => localStorage.getItem(knownSessionStorageKey) === 'true')
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)
  const [clientWeather, setClientWeather] = useState<ClientWeather>({
    code: null,
    isDay: true,
    city: defaultWeatherLocation.city,
    status: 'loading',
  })
  const [sessionInsight, setSessionInsight] = useState('')
  const [isNexaAssistantOpen, setIsNexaAssistantOpen] = useState(false)
  const [nexaChatMessages, setNexaChatMessages] = useState<NexaChatMessage[]>([
    {
      role: 'assistant',
      content: 'Je suis Nexa. Posez-moi une question sur vos droits, vos tableaux de bord, les interfaces ou les prochaines actions.',
      mode: 'local-fallback',
    },
  ])
  const [nexaChatPrompt, setNexaChatPrompt] = useState('')
  const [isNexaThinking, setIsNexaThinking] = useState(false)
  const [nexaChatError, setNexaChatError] = useState<string | null>(null)
  const lastNexaUsageSignalRef = useRef('')
  const nexaUsageSignalTimerRef = useRef<number | null>(null)
  const [credentials, setCredentials] = useState({
    login: '',
    password: '',
  })

  const isInformatique = currentUser?.profile?.code === 'INFORMATIQUE'

  useEffect(() => {
    void initialize()
  }, [])

  useEffect(() => {
    const stepTimer = window.setInterval(() => setLoadingStepIndex((current) => current + 1), 780)
    return () => window.clearInterval(stepTimer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    let isCancelled = false

    async function loadWeatherFromCoordinates(latitude: number, longitude: number, cityHint: string | null = null) {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current=weather_code,is_day&timezone=auto`,
      )

      if (!response.ok) {
        throw new Error('weather unavailable')
      }

      const payload = (await response.json()) as {
        current?: {
          weather_code?: number
          is_day?: number
        }
      }

      if (!isCancelled) {
        setClientWeather({
          code: payload.current?.weather_code ?? null,
          isDay: payload.current?.is_day !== 0,
          city: cityHint ?? defaultWeatherLocation.city,
          status: 'ready',
        })
      }
    }

    async function refreshClientWeather() {
      try {
        await loadWeatherFromCoordinates(defaultWeatherLocation.latitude, defaultWeatherLocation.longitude, defaultWeatherLocation.city)
      } catch {
        if (!isCancelled) {
          setClientWeather({
            code: null,
            isDay: true,
            city: defaultWeatherLocation.city,
            status: 'unavailable',
          })
        }
      }
    }

    void refreshClientWeather()
    const timer = window.setInterval(() => void refreshClientWeather(), 15 * 60 * 1000)

    return () => {
      isCancelled = true
      window.clearInterval(timer)
    }
  }, [currentUser?.id])

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
    }, 2800)

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
      return modules.filter((module) => !isDashboardModuleCode(module.code) && canAccessModule(rightsByModuleCode.get(module.code)))
    }

    return (currentUser?.rights ?? [])
      .filter((right) => !isDashboardModuleCode(right.moduleCode) && canAccessModule(right.accessLevel))
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

  const contraventionsAccessLevel = rightsByModuleCode.get(contraventionsModuleCode) ?? 'None'
  const canWriteContraventions = contraventionsAccessLevel === 'Write'
  const loadingPointsAccessLevel = rightsByModuleCode.get(loadingPointsModuleCode) ?? 'None'
  const canWriteLoadingPoints = loadingPointsAccessLevel === 'Write'
  const commonDataAccessLevel = rightsByModuleCode.get(commonDataModuleCode) ?? 'None'
  const canReadCommonData = canAccessModule(commonDataAccessLevel)
  const canWriteCommonData = commonDataAccessLevel === 'Write'

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
        (entry) => entry === 'Accueil' || (canReadCommonData && entry === commonDataNavigationLabel) || (modulesByGroup[entry] ?? []).length > 0,
      ),
    [canReadCommonData, modulesByGroup],
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

  const activeReferenceNavigationEntries =
    selectedNavigation === commonDataNavigationLabel
      ? commonDataNavigationEntries
      : settingsNavigationEntries
  const canEditReferenceData = selectedNavigation === commonDataNavigationLabel ? canWriteCommonData : isInformatique

  const currentWorkspaceModules = selectedNavigation === 'Exploitation' || selectedNavigation === 'Gestion administrative'
    ? modulesByGroup[selectedNavigation] ?? []
    : []
  const visibleWorkspaceModules = selectedWorkspaceSection === 'Accueil'
    ? currentWorkspaceModules
    : currentWorkspaceModules.filter((module) => module.label === selectedWorkspaceSection)
  const sidebarSubmenus = useMemo(() => {
    const exploitationEntries = [
      ...(modulesByGroup.Exploitation ?? []).map((module) => module.label).sort((left, right) => left.localeCompare(right, 'fr')),
    ]
    const administrativeEntries = [
      ...(modulesByGroup['Gestion administrative'] ?? []).map((module) => module.label).sort((left, right) => left.localeCompare(right, 'fr')),
    ]

    return {
      Administration: isInformatique ? administrationSubmenuEntries.filter((entry) => entry !== 'Accueil') : [],
      [commonDataNavigationLabel]: canReadCommonData ? commonDataNavigationEntries.filter((entry) => entry !== 'Accueil') : [],
      Exploitation: exploitationEntries,
      'Gestion administrative': administrativeEntries,
    } as Record<string, string[]>
  }, [canReadCommonData, isInformatique, modulesByGroup])

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

  const displayedScheduledTasks = scheduledTaskCatalog.length > 0
    ? scheduledTaskCatalog
    : scheduledTasks.map((task) => ({
        ...task,
        isRunnable: false,
        lastRun: null,
      }))

  const dashboardProfileOptions = useMemo(() => {
    const allowedProfileCodes = dashboardProfileCodes.filter((profileCode) =>
      canAccessModule(rightsByModuleCode.get(dashboardModuleByProfileCode[profileCode])),
    )

    const options = allowedProfileCodes
      .map((code) => profiles.find((profile) => profile.code === code && profile.isActive))
      .filter((profile): profile is SecurityProfileItem => Boolean(profile))

    if (options.length > 0) {
      return options
    }

    if (allowedProfileCodes.length > 0) {
      return allowedProfileCodes.map((code) => ({
        id: dashboardModuleByProfileCode[code],
        code,
        label: dashboardProfileLabels[code],
        isSystemProfile: true,
        isActive: true,
        moduleRights: currentUser?.rights.map((right) => ({
          securityModuleId: right.moduleCode,
          moduleCode: right.moduleCode,
          moduleLabel: right.moduleLabel,
          navigationGroup: right.navigationGroup,
          accessLevel: right.accessLevel,
        })) ?? [],
      }))
    }

    return currentUser?.profile
      ? [{
          id: currentUser.profile.id,
          code: currentUser.profile.code,
          label: currentUser.profile.label,
          isSystemProfile: true,
          isActive: true,
          moduleRights: currentUser.rights.map((right) => ({
            securityModuleId: right.moduleCode,
            moduleCode: right.moduleCode,
            moduleLabel: right.moduleLabel,
            navigationGroup: right.navigationGroup,
            accessLevel: right.accessLevel,
          })),
        }]
      : []
  }, [currentUser, profiles, rightsByModuleCode])

  const activeDashboardProfileCode = selectedDashboardProfileCode ?? dashboardProfileOptions[0]?.code ?? currentUser?.profile?.code ?? 'SANS_PROFIL'
  const activeDashboardProfileIndex = Math.max(
    0,
    dashboardProfileOptions.findIndex((profile) => profile.code === activeDashboardProfileCode),
  )

  useEffect(() => {
    if (dashboardProfileOptions.length === 0) {
      return
    }

    if (!selectedDashboardProfileCode || !dashboardProfileOptions.some((profile) => profile.code === selectedDashboardProfileCode)) {
      const ownDashboard = dashboardProfileOptions.find((profile) => profile.code === currentUser?.profile?.code)
      setSelectedDashboardProfileCode(ownDashboard?.code ?? dashboardProfileOptions[0].code)
    }
  }, [currentUser?.profile?.code, dashboardProfileOptions, selectedDashboardProfileCode])

  const dashboardVisibleModules = useMemo(() => {
    if (dashboardProfileOptions.length === 0 || profiles.length === 0) {
      return visibleModules
    }

    const selectedProfile = dashboardProfileOptions.find((profile) => profile.code === activeDashboardProfileCode)
    if (!selectedProfile) {
      return visibleModules
    }

    return selectedProfile.moduleRights
      .filter((right) => !isDashboardModuleCode(right.moduleCode) && canAccessModule(right.accessLevel))
      .map((right, index) => {
        const registeredModule = modules.find((module) => module.code === right.moduleCode)
        return registeredModule ?? {
          id: `${right.moduleCode}-${index}`,
          code: right.moduleCode,
          label: right.moduleLabel,
          navigationGroup: right.navigationGroup,
          displayOrder: index,
          isActive: true,
        }
      })
      .sort(compareModules)
  }, [activeDashboardProfileCode, dashboardProfileOptions, modules, profiles.length, visibleModules])

  const dashboardCubeItems = useMemo(
    () =>
      dashboardProfileOptions.map((profile) => {
        const profileVisibleModules = profiles.length === 0
          ? visibleModules
          : profile.moduleRights
              .filter((right) => !isDashboardModuleCode(right.moduleCode) && canAccessModule(right.accessLevel))
              .map((right, index) => {
                const registeredModule = modules.find((module) => module.code === right.moduleCode)
                return registeredModule ?? {
                  id: `${right.moduleCode}-${index}`,
                  code: right.moduleCode,
                  label: right.moduleLabel,
                  navigationGroup: right.navigationGroup,
                  displayOrder: index,
                  isActive: true,
                }
              })
              .sort(compareModules)

        return {
          profile,
          dashboard: buildProfileDashboard({
            profileCode: profile.code,
            visibleModules: profileVisibleModules,
            accounts,
            profiles,
            employees,
            materials,
            thirdParties,
            loadingPoints,
            contraventions,
            driverIndicators,
            tractorIndicators,
          }),
        }
      }),
    [
      accounts,
      contraventions,
      dashboardProfileOptions,
      driverIndicators,
      employees,
      loadingPoints,
      materials,
      modules,
      profiles,
      thirdParties,
      tractorIndicators,
      visibleModules,
    ],
  )

  const profileDashboard = useMemo(
    () =>
      dashboardCubeItems.find((item) => item.profile.code === activeDashboardProfileCode)?.dashboard ??
      buildProfileDashboard({
        profileCode: activeDashboardProfileCode,
        visibleModules: dashboardVisibleModules,
        accounts,
        profiles,
        employees,
        materials,
        thirdParties,
        loadingPoints,
        contraventions,
        driverIndicators,
        tractorIndicators,
      }),
    [
      accounts,
      activeDashboardProfileCode,
      contraventions,
      dashboardCubeItems,
      dashboardVisibleModules,
      driverIndicators,
      employees,
      loadingPoints,
      materials,
      profiles,
      thirdParties,
      tractorIndicators,
    ],
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
        code: 'COMMON_DATA_REFERENTIALS',
        scope: 'Paramètres',
        label: 'Données communes',
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

  useEffect(() => {
    if (visibleNavigationEntries.length === 0) {
      return
    }

    setSelectedNavigation((current) =>
      current === 'Accueil' || visibleNavigationEntries.includes(current) ? current : visibleNavigationEntries[0],
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

  useEffect(() => {
    if (!currentUser) {
      return
    }

    const section = getNexaCurrentSection(
      selectedNavigation,
      selectedAdministrationSection,
      selectedSettingsSection,
      selectedToolsSection,
      selectedWorkspaceSection,
    )
    const signalKey = [
      selectedNavigation,
      section,
      selectedDashboardProfileCode ?? '',
    ].join('|')

    if (signalKey === lastNexaUsageSignalRef.current) {
      return
    }

    if (nexaUsageSignalTimerRef.current !== null) {
      window.clearTimeout(nexaUsageSignalTimerRef.current)
    }

    nexaUsageSignalTimerRef.current = window.setTimeout(() => {
      lastNexaUsageSignalRef.current = signalKey
      void sendNexaUsageSignal({
        signalType: selectedNavigation === 'Accueil' ? 'DASHBOARD_VIEW' : 'NAVIGATION_VIEW',
        navigation: selectedNavigation,
        section,
        detail: selectedNavigation === 'Accueil' ? 'Accueil tableau de bord' : 'Navigation applicative',
        dashboardProfileCode: selectedNavigation === 'Accueil' ? selectedDashboardProfileCode ?? '' : '',
      })
    }, 900)

    return () => {
      if (nexaUsageSignalTimerRef.current !== null) {
        window.clearTimeout(nexaUsageSignalTimerRef.current)
      }
    }
  }, [
    currentUser?.id,
    selectedAdministrationSection,
    selectedDashboardProfileCode,
    selectedNavigation,
    selectedSettingsSection,
    selectedToolsSection,
    selectedWorkspaceSection,
  ])

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
      const shouldShowPostAuthLoader = sessionStorage.getItem(postAuthLoaderStorageKey) === 'pending'
      setShowPostAuthLoader(shouldShowPostAuthLoader)
      await hydrateAuthenticatedState(user)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally {
      setIsLoading(false)
    }
  }

  async function hydrateAuthenticatedState(user: AuthenticatedUser) {
    setCurrentUser(user)
    setHasKnownSession(true)
    localStorage.setItem(knownSessionStorageKey, 'true')
    setIsSidebarCollapsed(user.isSidebarCollapsed)
    setSessionInsight(buildSessionInsight(user))
    void loadNexaSessionInsight(user)
    const hasContraventionsAccess = user.rights.some(
      (right) => right.moduleCode === contraventionsModuleCode && canAccessModule(right.accessLevel),
    )
    const hasLoadingPointsAccess = user.rights.some(
      (right) => right.moduleCode === loadingPointsModuleCode && canAccessModule(right.accessLevel),
    )
    const hasDriverIndicatorsAccess = user.rights.some(
      (right) => right.moduleCode === driverIndicatorsModuleCode && canAccessModule(right.accessLevel),
    )
    const hasTractorIndicatorsAccess = user.rights.some(
      (right) => right.moduleCode === tractorIndicatorsModuleCode && canAccessModule(right.accessLevel),
    )
    const hasCommonDataAccess = user.rights.some(
      (right) => right.moduleCode === commonDataModuleCode && canAccessModule(right.accessLevel),
    )

    if (user.profile?.code === 'INFORMATIQUE') {
      await Promise.all([
        loadAdminSecurityData(),
        hasContraventionsAccess ? loadContraventionsData() : Promise.resolve(),
        hasLoadingPointsAccess ? loadLoadingPointsData() : Promise.resolve(),
        hasDriverIndicatorsAccess ? loadDriverIndicatorsData() : Promise.resolve(),
        hasTractorIndicatorsAccess ? loadTractorIndicatorsData() : Promise.resolve(),
      ])
      return
    }

    setModules([])
    setProfiles([])
    setAccounts([])
    if (hasCommonDataAccess) {
      await loadSettingsData()
    } else {
      setCompanies([])
      setAnalytics([])
      setExploitations([])
      setEmployees([])
      setThirdParties([])
      setMaterials([])
    }
    if (hasContraventionsAccess) {
      await loadContraventionsData()
    } else {
      setContraventions([])
      setContraventionsError(null)
    }
    if (hasLoadingPointsAccess) {
      await loadLoadingPointsData()
    } else {
      setLoadingPoints([])
      setLoadingPointsError(null)
    }
    if (hasDriverIndicatorsAccess) {
      await loadDriverIndicatorsData()
    } else {
      setDriverIndicators(null)
      setDriverIndicatorsError(null)
    }
    if (hasTractorIndicatorsAccess) {
      await loadTractorIndicatorsData()
    } else {
      setTractorIndicators(null)
      setTractorIndicatorsError(null)
    }
    setAdminDiagnostics(null)
    setIntegrationCredentials([])
    setUserSessions({ active: [], history: [] })
    setControlledSqlCatalog([])
    setControlledSqlResult(null)
    setApplicationTraces({ streams: [], traces: [], limit: 100 })
    setSelectedTraceStream('ALL')
    setScheduledTaskCatalog([])
    setEditableAccounts({})
    setEditableProfiles({})
    setEditableAnalytics({})
    setEditableExploitations({})
  }

  async function loadNexaSessionInsight(user: AuthenticatedUser) {
    try {
      const response = await fetch(apiPath('api/nexa/session-insight'))
      if (!response.ok) {
        return
      }

      const insight = (await response.json()) as NexaSessionInsight
      setSessionInsight(insight.message || buildSessionInsight(user))
    } catch {
      setSessionInsight(buildSessionInsight(user))
    }
  }

  async function sendNexaUsageSignal(signal: NexaUsageSignal) {
    try {
      const response = await fetch(apiPath('api/nexa/usage-signal'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signal),
      })

      if (response.ok && currentUser) {
        void loadNexaSessionInsight(currentUser)
      }
    } catch {
      // Nexa usage learning is opportunistic: navigation must stay uninterrupted.
    }
  }

  async function sendNexaChatMessage(messageOverride?: string) {
    const message = (messageOverride ?? nexaChatPrompt).trim()
    if (!message || isNexaThinking) {
      return
    }

    const history = nexaChatMessages.slice(-8)
    setNexaChatPrompt('')
    setNexaChatError(null)
    setIsNexaThinking(true)
    setNexaChatMessages((current) => [...current, { role: 'user', content: message }])

    try {
      const response = await fetch(apiPath('api/nexa/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history.map((item) => ({ role: item.role, content: item.content })),
        }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Nexa n\u2019a pas pu r\u00e9pondre.'))
      }

      const payload = (await response.json()) as NexaChatResponse
      setNexaChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: payload.answer,
          mode: payload.mode,
          warning: payload.warning,
        },
      ])
    } catch (chatError) {
      const message = chatError instanceof Error ? chatError.message : 'Nexa n\u2019a pas pu r\u00e9pondre.'
      setNexaChatError(message)
      setNexaChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: message,
          mode: 'local-fallback',
          warning: message,
        },
      ])
    } finally {
      setIsNexaThinking(false)
    }
  }

  async function loadAdminSecurityData() {
    const [modulesResponse, profilesResponse, accountsResponse] = await Promise.all([
      fetch(apiPath('api/security/modules')),
      fetch(apiPath('api/security/profiles')),
      fetch(apiPath('api/security/accounts')),
    ])

    const failedAdminResponse = [modulesResponse, profilesResponse, accountsResponse].find(
      (response) => !response.ok,
    )
    if (failedAdminResponse) {
      throw new Error(await getRequestError(failedAdminResponse, 'Impossible de charger l’administration de sécurité.'))
    }

    const [modulesPayload, profilesPayload, accountsPayload] = await Promise.all([
      modulesResponse.json() as Promise<SecurityModuleItem[]>,
      profilesResponse.json() as Promise<SecurityProfileItem[]>,
      accountsResponse.json() as Promise<AccountItem[]>,
    ])

    setModules(modulesPayload)
    setProfiles(profilesPayload)
    setAccounts(accountsPayload)
    await loadSettingsData()
  }

  async function loadSettingsData() {
    const settingsResponse = await fetch(apiPath('api/settings/bootstrap'))
    if (!settingsResponse.ok) {
      throw new Error(await getRequestError(settingsResponse, 'Impossible de charger les donnÃ©es communes.'))
    }

    const settingsPayload = (await settingsResponse.json()) as {
      companies: CompanyItem[]
      analytics: AnalyticItem[]
      exploitations: ExploitationItem[]
      employees: EmployeeItem[]
      thirdParties: ThirdPartyItem[]
      materials: MaterialItem[]
    }

    setCompanies(settingsPayload.companies)
    setAnalytics(settingsPayload.analytics)
    setExploitations(settingsPayload.exploitations)
    setEmployees(settingsPayload.employees)
    setThirdParties(settingsPayload.thirdParties)
    setMaterials(settingsPayload.materials)
  }

  async function reloadReferenceData() {
    if (isInformatique) {
      await loadAdminSecurityData()
      return
    }

    await loadSettingsData()
  }

  async function loadContraventionsData() {
    setContraventionsError(null)

    try {
      const [contraventionsResponse, referentialsResponse] = await Promise.all([
        fetch(apiPath('api/modules/contraventions')),
        fetch(apiPath('api/modules/contraventions/referentials')),
      ])

      const failedResponse = [contraventionsResponse, referentialsResponse].find((response) => !response.ok)
      if (failedResponse) {
        throw new Error(await getRequestError(failedResponse, 'Impossible de charger les contraventions.'))
      }

      const [contraventionsPayload, referentialsPayload] = await Promise.all([
        contraventionsResponse.json() as Promise<ContraventionItem[]>,
        referentialsResponse.json() as Promise<{
          drivers: EmployeeItem[]
          materials: MaterialItem[]
        }>,
      ])

      setContraventions(contraventionsPayload)
      setEmployees((current) => (current.length > 0 ? current : referentialsPayload.drivers))
      setMaterials((current) => (current.length > 0 ? current : referentialsPayload.materials))
    } catch (contraventionsLoadError) {
      setContraventionsError(
        contraventionsLoadError instanceof Error ? contraventionsLoadError.message : 'Erreur de chargement des contraventions.',
      )
    }
  }

  async function loadLoadingPointsData() {
    setLoadingPointsError(null)

    try {
      const [pointsResponse, referentialsResponse] = await Promise.all([
        fetch(apiPath('api/modules/loading-points')),
        fetch(apiPath('api/modules/loading-points/referentials')),
      ])

      const failedResponse = [pointsResponse, referentialsResponse].find((response) => !response.ok)
      if (failedResponse) {
        throw new Error(await getRequestError(failedResponse, 'Impossible de charger les points.'))
      }

      const [pointsPayload, referentialsPayload] = await Promise.all([
        pointsResponse.json() as Promise<LoadingPointItem[]>,
        referentialsResponse.json() as Promise<{
          thirdParties: ThirdPartyItem[]
          exploitations: ExploitationItem[]
        }>,
      ])

      setLoadingPoints(pointsPayload)
      setThirdParties((current) => (current.length > 0 ? current : referentialsPayload.thirdParties))
      setExploitations((current) => (current.length > 0 ? current : referentialsPayload.exploitations))
    } catch (pointsLoadError) {
      setLoadingPointsError(
        pointsLoadError instanceof Error ? pointsLoadError.message : 'Erreur de chargement des points.',
      )
    }
  }

  async function loadDriverIndicatorsData() {
    setDriverIndicatorsError(null)

    try {
      const response = await fetch(apiPath('api/modules/driver-indicators'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les indicateurs conducteurs.'))
      }

      setDriverIndicators((await response.json()) as DriverIndicatorsPayload)
    } catch (indicatorsLoadError) {
      setDriverIndicatorsError(
        indicatorsLoadError instanceof Error ? indicatorsLoadError.message : 'Indicateurs conducteurs indisponibles.',
      )
    }
  }

  async function loadTractorIndicatorsData() {
    setTractorIndicatorsError(null)

    try {
      const response = await fetch(apiPath('api/modules/tractor-indicators'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les indicateurs tracteurs.'))
      }

      setTractorIndicators((await response.json()) as TractorIndicatorsPayload)
    } catch (indicatorsLoadError) {
      setTractorIndicatorsError(
        indicatorsLoadError instanceof Error ? indicatorsLoadError.message : 'Indicateurs tracteurs indisponibles.',
      )
    }
  }

  async function loadAdminToolsData() {
    await Promise.all([
      loadAdminDiagnostics(),
      loadIntegrationCredentials(),
      loadUserSessions(),
      loadControlledSqlCatalog(),
      loadApplicationTraces(selectedTraceStream),
      loadScheduledTasks(),
    ])
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

  async function loadControlledSqlCatalog() {
    setControlledSqlError(null)

    try {
      const response = await fetch(apiPath('api/admin/sql-queries'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger le catalogue SQL.'))
      }

      setControlledSqlCatalog((await response.json()) as ControlledSqlQuery[])
    } catch (catalogLoadError) {
      setControlledSqlError(catalogLoadError instanceof Error ? catalogLoadError.message : 'Catalogue SQL indisponible.')
    }
  }

  async function handleRunControlledSqlQuery(queryCode: string) {
    setControlledSqlError(null)
    setRunningControlledSqlCode(queryCode)

    try {
      const response = await fetch(apiPath(`api/admin/sql-queries/${queryCode}/run`), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible d executer cette requete controlee.'))
      }

      setControlledSqlResult((await response.json()) as ControlledSqlQueryResult)
    } catch (queryRunError) {
      setControlledSqlError(queryRunError instanceof Error ? queryRunError.message : 'Execution SQL controlee impossible.')
    } finally {
      setRunningControlledSqlCode(null)
    }
  }

  async function loadApplicationTraces(streamCode = selectedTraceStream) {
    setTracesError(null)

    try {
      const query = streamCode && streamCode !== 'ALL' ? `?streamCode=${encodeURIComponent(streamCode)}` : ''
      const response = await fetch(apiPath(`api/admin/traces${query}`))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les traces.'))
      }

      setApplicationTraces((await response.json()) as ApplicationTracesPayload)
    } catch (traceLoadError) {
      setTracesError(traceLoadError instanceof Error ? traceLoadError.message : 'Traces indisponibles.')
    }
  }

  async function loadScheduledTasks() {
    setScheduledTasksError(null)

    try {
      const response = await fetch(apiPath('api/admin/scheduled-tasks'))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Impossible de charger les tâches planifiées.'))
      }

      setScheduledTaskCatalog((await response.json()) as ScheduledTaskItem[])
    } catch (scheduledTasksLoadError) {
      setScheduledTasksError(
        scheduledTasksLoadError instanceof Error ? scheduledTasksLoadError.message : 'Tâches planifiées indisponibles.',
      )
    }
  }

  async function handleRunScheduledTask(taskCode: string) {
    setScheduledTasksError(null)
    setRunningScheduledTaskCode(taskCode)

    try {
      const response = await fetch(apiPath(`api/admin/scheduled-tasks/${taskCode}/run`), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'Execution de la tâche impossible.'))
      }

      await Promise.all([loadScheduledTasks(), loadApplicationTraces(selectedTraceStream)])
    } catch (taskRunError) {
      setScheduledTasksError(taskRunError instanceof Error ? taskRunError.message : 'Execution de la tâche impossible.')
    } finally {
      setRunningScheduledTaskCode(null)
    }
  }

  function handleTraceStreamChange(event: ChangeEvent<HTMLSelectElement>) {
    const streamCode = event.target.value
    setSelectedTraceStream(streamCode)
    void loadApplicationTraces(streamCode)
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
    await fetch(apiPath('api/auth/logout'), { method: 'POST' })
    sessionStorage.removeItem(postAuthLoaderStorageKey)
    setShowPostAuthLoader(false)
    resetSessionState()
  }

  async function handleSidebarCollapsedChange() {
    if (!currentUser) {
      return
    }

    const nextValue = !isSidebarCollapsed
    setIsSidebarCollapsed(nextValue)
    setCurrentUser((user) => (user ? { ...user, isSidebarCollapsed: nextValue } : user))

    try {
      const response = await fetch(apiPath('api/auth/preferences'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSidebarCollapsed: nextValue }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La préférence du menu n’a pas été enregistrée.'))
      }

      const user = (await response.json()) as AuthenticatedUser
      setCurrentUser(user)
      setIsSidebarCollapsed(user.isSidebarCollapsed)
    } catch (preferenceError) {
      setIsSidebarCollapsed(!nextValue)
      setCurrentUser((user) => (user ? { ...user, isSidebarCollapsed: !nextValue } : user))
      setError(preferenceError instanceof Error ? preferenceError.message : 'La préférence du menu n’a pas été enregistrée.')
    }
  }

  function activateMainNavigation(entry: string) {
    const submenuEntries = sidebarSubmenus[entry] ?? []
    setExpandedSidebarMenu((current) => (submenuEntries.length > 0 && current !== entry ? entry : null))
    setSelectedNavigation(entry)
    if (entry === 'Administration') {
      setSelectedAdministrationSection('Accueil')
      setSelectedSettingsSection('Accueil')
      setSelectedToolsSection('Accueil')
    }
    if (entry === commonDataNavigationLabel) {
      setSelectedSettingsSection('Accueil')
    }
    if (entry === 'Exploitation' || entry === 'Gestion administrative') {
      setSelectedWorkspaceSection('Accueil')
    }
  }

  function activateHomeNavigation() {
    setExpandedSidebarMenu(null)
    setSelectedNavigation('Accueil')
    setSelectedAdministrationSection('Accueil')
    setSelectedSettingsSection('Accueil')
    setSelectedToolsSection('Accueil')
    setSelectedWorkspaceSection('Accueil')
  }

  function activateSidebarSubmenu(parentEntry: string, submenuEntry: string) {
    setExpandedSidebarMenu(parentEntry)
    setSelectedNavigation(parentEntry)

    if (parentEntry === 'Administration' && administrationSubmenuEntries.includes(submenuEntry as (typeof administrationSubmenuEntries)[number])) {
      const administrationEntry = submenuEntry as (typeof administrationSubmenuEntries)[number]
      setSelectedAdministrationSection(administrationEntry)
      if (administrationEntry === 'Outils') {
        setSelectedToolsSection('Accueil')
      }
      if (administrationEntry === administrationSettingsSection) {
        setSelectedSettingsSection('Accueil')
      }
      return
    }

    if (parentEntry === commonDataNavigationLabel && commonDataNavigationEntries.includes(submenuEntry as (typeof commonDataNavigationEntries)[number])) {
      setSelectedSettingsSection(submenuEntry)
      return
    }

    if (parentEntry === 'Exploitation' || parentEntry === 'Gestion administrative') {
      setSelectedWorkspaceSection(submenuEntry)
    }
  }

  function activateDashboardAction(action: {
    navigation: string
    administrationSection?: string
    settingsSection?: string
    workspaceSection?: string
  }) {
    activateMainNavigation(action.navigation)
    if (action.administrationSection) {
      setSelectedAdministrationSection(action.administrationSection as (typeof administrationSubmenuEntries)[number])
    }
    if (action.settingsSection) {
      setSelectedSettingsSection(action.settingsSection)
    }
    if (action.workspaceSection) {
      setSelectedWorkspaceSection(action.workspaceSection)
    }
  }

  function isSidebarSubmenuActive(parentEntry: string, submenuEntry: string) {
    if (selectedNavigation !== parentEntry) {
      return false
    }
    if (parentEntry === 'Administration') {
      return selectedAdministrationSection === submenuEntry
    }
    if (parentEntry === commonDataNavigationLabel) {
      return selectedSettingsSection === submenuEntry
    }
    if (parentEntry === 'Exploitation' || parentEntry === 'Gestion administrative') {
      return selectedWorkspaceSection === submenuEntry
    }

    return false
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
    setHasKnownSession(false)
    localStorage.removeItem(knownSessionStorageKey)
    setModules([])
    setProfiles([])
    setAccounts([])
    setCompanies([])
    setAnalytics([])
    setExploitations([])
    setEmployees([])
    setThirdParties([])
    setMaterials([])
    setContraventions([])
    setLoadingPoints([])
    setDriverIndicators(null)
    setTractorIndicators(null)
    setIntegrationCredentials([])
    setUserSessions({ active: [], history: [] })
    setEditableAccounts({})
    setEditableProfiles({})
    setEditableAnalytics({})
    setEditableExploitations({})
    setChangePassword(createEmptyChangePasswordForm())
    setForgotPassword(createEmptyForgotPasswordForm())
    setAccountPasswordReset(createEmptyAccountPasswordResetState())
    setCredentialForm(createEmptyIntegrationCredentialForm())
    setEditingCompany(null)
    setCompanyForm(createEmptyCompanyForm())
    setIsCreateCompanyModalOpen(false)
    setEditingEmployee(null)
    setEmployeeForm(createEmptyEmployeeForm())
    setEditingThirdParty(null)
    setNewThirdParty(createEmptyThirdPartyForm())
    setIsThirdPartyModalOpen(false)
    setEditingMaterial(null)
    setNewMaterial(createEmptyMaterialForm())
    setIsMaterialModalOpen(false)
    setIsCreateEmployeeModalOpen(false)
    setEmployeeProvisioning({ isProvisioning: false, result: null, error: null })
    setLuccaEmployeeImport({ isImporting: false, result: null, error: null })
    setDiagnosticsError(null)
    setCredentialsError(null)
    setSessionsError(null)
    setControlledSqlError(null)
    setRunningControlledSqlCode(null)
    setTracesError(null)
    setScheduledTasksError(null)
    setRunningScheduledTaskCode(null)
    setContraventionsError(null)
    setLoadingPointsError(null)
    setDriverIndicatorsError(null)
    setTractorIndicatorsError(null)
    setIsSidebarCollapsed(false)
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
      closeCompanyModal()
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
    setCompanyForm((current) => ({
      ...current,
      [field]: field === 'siren' ? event.target.value.replace(/\D/g, '').slice(0, 9) : event.target.value,
      isSireneValidated: field === 'siren' ? false : current.isSireneValidated,
      error: null,
    }))
  }

  function handleNewCompanyStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setCompanyForm((current) => ({
      ...current,
      isActive: event.target.checked,
      error: null,
    }))
  }

  function handleSireneCompanySearchFieldChange(
    field: 'name' | 'city' | 'postalCode',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setSireneCompanySearch((current) => ({
      ...current,
      [field]: field === 'postalCode' ? event.target.value.replace(/\D/g, '').slice(0, 5) : event.target.value,
      error: null,
    }))
  }

  async function handleLookupNewCompanySirene() {
    const siren = companyForm.siren.replace(/\D/g, '')
    if (siren.length !== 9) {
      setCompanyForm((current) => ({ ...current, error: 'Saisissez un SIREN de 9 chiffres avant la recherche SIRENE.' }))
      return
    }

    setIsLookingUpNewCompany(true)
    setCompanyForm((current) => ({ ...current, error: null, isSireneValidated: false }))

    try {
      const response = await fetch(apiPath(`api/settings/companies/sirene/${siren}`))
      if (response.status === 404) {
        throw new Error('Aucune société trouvée pour ce SIREN.')
      }

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La recherche SIRENE a échoué.'))
      }

      const lookup = (await response.json()) as SireneCompanyLookup
      setCompanyForm((current) => ({
        ...current,
        siren: lookup.siren,
        displayName: lookup.displayName ?? current.displayName,
        legalName: lookup.legalName ?? current.legalName,
        isSireneValidated: true,
        error: null,
      }))
    } catch (lookupError) {
      setCompanyForm((current) => ({
        ...current,
        isSireneValidated: false,
        error: lookupError instanceof Error ? lookupError.message : 'Erreur de recherche SIRENE.',
      }))
    } finally {
      setIsLookingUpNewCompany(false)
    }
  }

  async function handleSearchCompaniesSirene() {
    const searchName = sireneCompanySearch.name.trim()
    const searchCity = sireneCompanySearch.city.trim()
    const searchPostalCode = sireneCompanySearch.postalCode.trim()

    if (!searchName && !searchCity && !searchPostalCode) {
      setSireneCompanySearch((current) => ({
        ...current,
        error: 'Saisissez au moins un nom, une ville ou un code postal.',
        results: [],
      }))
      return
    }

    const query = new URLSearchParams()
    if (searchName) {
      query.set('name', searchName)
    }
    if (searchCity) {
      query.set('city', searchCity)
    }
    if (searchPostalCode) {
      query.set('postalCode', searchPostalCode)
    }

    setSireneCompanySearch((current) => ({ ...current, isSearching: true, error: null, results: [] }))

    try {
      const response = await fetch(apiPath(`api/settings/companies/sirene-search?${query.toString()}`))
      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La recherche SIRENE a échoué.'))
      }

      const results = (await response.json()) as SireneCompanyLookup[]
      setSireneCompanySearch((current) => ({
        ...current,
        isSearching: false,
        results,
        error: results.length === 0 ? 'Aucune société trouvée pour ces critères.' : null,
      }))
    } catch (searchError) {
      setSireneCompanySearch((current) => ({
        ...current,
        isSearching: false,
        results: [],
        error: searchError instanceof Error ? searchError.message : 'Erreur de recherche SIRENE.',
      }))
    }
  }

  function selectSireneCompanyResult(company: SireneCompanyLookup) {
    setCompanyForm((current) => ({
      ...current,
      siren: company.siren,
      displayName: company.displayName ?? current.displayName,
      legalName: company.legalName ?? company.displayName ?? current.legalName,
      isSireneValidated: true,
      error: null,
    }))
    setSireneCompanySearch((current) => ({ ...current, error: null }))
  }

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!companyForm.isSireneValidated) {
      setCompanyForm((current) => ({ ...current, error: 'La recherche SIRENE doit etre validee avant la creation.' }))
      return
    }

    setCompanyForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath('api/settings/companies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCompanyPayload(companyForm)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La création de la société a échoué.'))
      }

      await reloadReferenceData()
      closeCompanyModal()
    } catch (createError) {
      setCompanyForm((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de création.',
      }))
    }
  }

  async function handleSaveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingCompany) {
      return
    }

    setCompanyForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(`api/settings/companies/${editingCompany.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCompanyPayload(companyForm)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise a jour de la societe a echoue.'))
      }

      await reloadReferenceData()
      closeCompanyModal()
    } catch (saveError) {
      setCompanyForm((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise a jour.',
      }))
    }
  }

  function openCreateCompanyModal() {
    setEditingCompany(null)
    setCompanyForm(createEmptyCompanyForm())
    setSireneCompanySearch(createEmptySireneCompanySearchForm())
    setIsCreateCompanyModalOpen(true)
  }

  function openEditCompanyModal(company: CompanyItem) {
    setEditingCompany(company)
    setCompanyForm(buildCompanyFormFromItem(company))
    setSireneCompanySearch(createEmptySireneCompanySearchForm())
  }

  function closeCompanyModal() {
    if (companyForm.isSaving) {
      return
    }

    setEditingCompany(null)
    setIsCreateCompanyModalOpen(false)
    setCompanyForm(createEmptyCompanyForm())
    setSireneCompanySearch(createEmptySireneCompanySearchForm())
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

      await reloadReferenceData()
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

      await reloadReferenceData()
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

      await reloadReferenceData()
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

      await reloadReferenceData()
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
    if (!canEditReferenceData) {
      return
    }

    setEditingEmployee(null)
    setEmployeeForm(createEmptyEmployeeForm())
    setIsCreateEmployeeModalOpen(true)
  }

  function openEditEmployeeModal(employee: EmployeeItem) {
    if (!canEditReferenceData) {
      return
    }

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

      await reloadReferenceData()
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

      await reloadReferenceData()
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
    if (!canEditReferenceData) {
      return
    }

    setEmployeeProvisioning({ isProvisioning: true, result: null, error: null })

    try {
      const response = await fetch(apiPath('api/settings/employees/provision-accounts'), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La creation automatique des comptes a echoue.'))
      }

      const result = (await response.json()) as EmployeeAccountProvisioningResult
      await reloadReferenceData()
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
    if (!canEditReferenceData) {
      return
    }

    setLuccaEmployeeImport({ isImporting: true, result: null, error: null })

    try {
      const response = await fetch(apiPath('api/settings/employees/import-lucca'), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'L import Lucca des salaries a echoue.'))
      }

      const result = (await response.json()) as LuccaEmployeeImportResult
      await reloadReferenceData()
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

      await reloadReferenceData()
      closeThirdPartyModal()
    } catch (createError) {
      setNewThirdParty((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de creation.',
      }))
    }
  }

  async function handleSaveThirdParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingThirdParty) {
      return
    }

    setNewThirdParty((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(`api/settings/third-parties/${editingThirdParty.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThirdParty),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise a jour du tiers a echoue.'))
      }

      await reloadReferenceData()
      closeThirdPartyModal()
    } catch (saveError) {
      setNewThirdParty((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise a jour.',
      }))
    }
  }

  function openCreateThirdPartyModal() {
    if (!canEditReferenceData) {
      return
    }

    setEditingThirdParty(null)
    setNewThirdParty(createEmptyThirdPartyForm())
    setIsThirdPartyModalOpen(true)
  }

  function openEditThirdPartyModal(thirdParty: ThirdPartyItem) {
    if (!canEditReferenceData) {
      return
    }

    setEditingThirdParty(thirdParty)
    setNewThirdParty(buildThirdPartyFormFromItem(thirdParty))
    setIsThirdPartyModalOpen(true)
  }

  function closeThirdPartyModal() {
    if (newThirdParty.isSaving) {
      return
    }

    setEditingThirdParty(null)
    setIsThirdPartyModalOpen(false)
    setNewThirdParty(createEmptyThirdPartyForm())
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

      await reloadReferenceData()
      closeMaterialModal()
    } catch (createError) {
      setNewMaterial((current) => ({
        ...current,
        isSaving: false,
        error: createError instanceof Error ? createError.message : 'Erreur de creation.',
      }))
    }
  }

  async function handleSaveMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingMaterial) {
      return
    }

    setNewMaterial((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(`api/settings/materials/${editingMaterial.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMaterial,
          exploitationId: newMaterial.exploitationId || null,
          lastSyncedAtUtc: editingMaterial.lastSyncedAtUtc,
        }),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, 'La mise a jour du materiel a echoue.'))
      }

      await reloadReferenceData()
      closeMaterialModal()
    } catch (saveError) {
      setNewMaterial((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de mise a jour.',
      }))
    }
  }

  function openCreateMaterialModal() {
    if (!canEditReferenceData) {
      return
    }

    setEditingMaterial(null)
    setNewMaterial(createEmptyMaterialForm())
    setIsMaterialModalOpen(true)
  }

  function openEditMaterialModal(material: MaterialItem) {
    if (!canEditReferenceData) {
      return
    }

    setEditingMaterial(material)
    setNewMaterial(buildMaterialFormFromItem(material))
    setIsMaterialModalOpen(true)
  }

  function closeMaterialModal() {
    if (newMaterial.isSaving) {
      return
    }

    setEditingMaterial(null)
    setIsMaterialModalOpen(false)
    setNewMaterial(createEmptyMaterialForm())
  }

  function openCreateContraventionModal() {
    setEditingContravention(null)
    setContraventionForm(createEmptyContraventionForm())
    setIsContraventionModalOpen(true)
  }

  function openEditContraventionModal(contravention: ContraventionItem) {
    setEditingContravention(contravention)
    setContraventionForm(buildContraventionFormFromItem(contravention))
    setIsContraventionModalOpen(true)
  }

  function closeContraventionModal() {
    if (contraventionForm.isSaving) {
      return
    }

    setEditingContravention(null)
    setIsContraventionModalOpen(false)
    setContraventionForm(createEmptyContraventionForm())
  }

  function handleContraventionFormChange(
    field: keyof Omit<ContraventionFormState, 'isSaving' | 'error'>,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setContraventionForm((current) => ({ ...current, [field]: event.target.value, error: null }))
  }

  async function handleSaveContravention(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setContraventionForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(editingContravention ? `api/modules/contraventions/${editingContravention.id}` : 'api/modules/contraventions'), {
        method: editingContravention ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildContraventionPayload(contraventionForm)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, editingContravention ? 'La mise a jour de la contravention a echoue.' : 'La creation de la contravention a echoue.'))
      }

      await loadContraventionsData()
      closeContraventionModal()
    } catch (saveError) {
      setContraventionForm((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de sauvegarde.',
      }))
    }
  }

  function openCreateLoadingPointModal() {
    setEditingLoadingPoint(null)
    setLoadingPointForm(createEmptyLoadingPointForm())
    setIsLoadingPointModalOpen(true)
  }

  function openEditLoadingPointModal(point: LoadingPointItem) {
    setEditingLoadingPoint(point)
    setLoadingPointForm(buildLoadingPointFormFromItem(point))
    setIsLoadingPointModalOpen(true)
  }

  function closeLoadingPointModal() {
    if (loadingPointForm.isSaving) {
      return
    }

    setEditingLoadingPoint(null)
    setIsLoadingPointModalOpen(false)
    setLoadingPointForm(createEmptyLoadingPointForm())
  }

  function handleLoadingPointFormChange(
    field: keyof Omit<LoadingPointFormState, 'isSaving' | 'error'>,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const value = field === 'code' || field === 'countryCode' ? event.target.value.toUpperCase() : event.target.value
    setLoadingPointForm((current) => ({ ...current, [field]: value, error: null }))
  }

  function handleLoadingPointStatusChange(event: ChangeEvent<HTMLInputElement>) {
    setLoadingPointForm((current) => ({ ...current, isActive: event.target.checked, error: null }))
  }

  async function handleSaveLoadingPoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoadingPointForm((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const response = await fetch(apiPath(editingLoadingPoint ? `api/modules/loading-points/${editingLoadingPoint.id}` : 'api/modules/loading-points'), {
        method: editingLoadingPoint ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildLoadingPointPayload(loadingPointForm)),
      })

      if (!response.ok) {
        throw new Error(await getRequestError(response, editingLoadingPoint ? 'La mise a jour du point a echoue.' : 'La creation du point a echoue.'))
      }

      await loadLoadingPointsData()
      closeLoadingPointModal()
    } catch (saveError) {
      setLoadingPointForm((current) => ({
        ...current,
        isSaving: false,
        error: saveError instanceof Error ? saveError.message : 'Erreur de sauvegarde.',
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

  if (isLoading && hasKnownSession) {
    return <div className="auth-shell app-loading-shell app-loading-shell-silent" aria-hidden="true" />
  }

  if (isLoading) {
    const loadingSteps = ['Initialisation du socle', 'Validation de la session', 'Synchronisation des droits']
    const activeLoadingStep = loadingSteps[loadingStepIndex % loadingSteps.length]

    return (
      <div className="auth-shell app-loading-shell">
        <section className="app-loading-card" aria-live="polite">
          <div className="app-loading-brand">
            <img className="app-loading-icon" src={nexusIcon} alt="" aria-hidden="true" />
            <img className="app-loading-wordmark" src={nexusWordmark} alt="Nexus" />
          </div>
          <div className="app-loading-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="app-loading-copy">
            <span className="eyebrow">Espace s\u00e9curis\u00e9</span>
            <h1>Ouverture de votre environnement Nexus</h1>
            <p>{activeLoadingStep}</p>
          </div>
          <div className="app-loading-progress" aria-hidden="true">
            <span />
          </div>
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
    <div className={`nexus-app-shell ${isSidebarCollapsed ? 'nexus-app-shell-sidebar-collapsed' : ''}`}>
      <aside className="nexus-sidebar">
        <div className="brand-panel">
          <button className="brand-home-button" onClick={activateHomeNavigation} type="button">
            <img className="brand-icon" src={nexusIcon} alt="" aria-hidden="true" />
            <img className="brand-wordmark" src={nexusWordmark} alt="Nexus" />
          </button>
          <button
            aria-label={isSidebarCollapsed ? 'Déplier le menu de navigation' : 'Replier le menu de navigation'}
            className="sidebar-collapse-button"
            onClick={() => void handleSidebarCollapsedChange()}
            title={isSidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
            type="button"
          >
            <span aria-hidden="true">{isSidebarCollapsed ? '\u203a' : '\u2039'}</span>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {visibleNavigationEntries.map((entry) => {
            const submenuEntries = sidebarSubmenus[entry] ?? []
            const isExpanded = expandedSidebarMenu === entry

            return (
              <div className="sidebar-nav-group" key={entry}>
                <button
                  aria-controls={submenuEntries.length > 0 ? `sidebar-submenu-${entry}` : undefined}
                  aria-expanded={submenuEntries.length > 0 ? isExpanded : undefined}
                  className={`sidebar-link ${selectedNavigation === entry ? 'sidebar-link-active' : ''} ${isExpanded ? 'sidebar-link-expanded' : ''}`}
                  onClick={() => activateMainNavigation(entry)}
                  title={entry}
                  type="button"
                >
                  <span className="sidebar-link-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      {getNavigationIconPaths(entry).map((path) => (
                        <path d={path} key={path} />
                      ))}
                    </svg>
                  </span>
                  <span className="sidebar-link-label">{entry}</span>
                  <span className="sidebar-link-tooltip" role="tooltip">{entry}</span>
                  {submenuEntries.length > 0 ? <span className="sidebar-link-chevron" aria-hidden="true">{isExpanded ? '\u2303' : '\u2304'}</span> : null}
                </button>
                {submenuEntries.length > 0 ? (
                  <div
                    aria-hidden={!isExpanded}
                    aria-label={`Sous-menu ${entry}`}
                    className={`sidebar-subnav ${isExpanded ? 'sidebar-subnav-expanded' : ''}`}
                    id={`sidebar-submenu-${entry}`}
                  >
                    {submenuEntries.map((submenuEntry) => (
                      <button
                        className={`sidebar-subnav-link ${isSidebarSubmenuActive(entry, submenuEntry) ? 'sidebar-subnav-link-active' : ''}`}
                        key={`${entry}-${submenuEntry}`}
                        onClick={() => activateSidebarSubmenu(entry, submenuEntry)}
                        tabIndex={isExpanded ? 0 : -1}
                        type="button"
                      >
                        {submenuEntry}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <button aria-label="Se déconnecter" className="sidebar-logout-button" onClick={handleLogout} title="Se déconnecter" type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M10 4.5H6.75A2.75 2.75 0 0 0 4 7.25v9.5a2.75 2.75 0 0 0 2.75 2.75H10" />
            <path d="M15.5 8.5 19 12l-3.5 3.5" />
            <path d="M19 12H9" />
          </svg>
        </button>
      </aside>

      <main className={`nexus-main ${selectedNavigation === 'Accueil' ? 'nexus-main-home' : ''}`}>
        <section className="nexus-top-banner" aria-label="Informations de session">
          <div className="nexus-top-hello">
            <strong>Bonjour {getFirstName(currentUser.displayName)}</strong>
            <span>{sessionInsight}</span>
          </div>
          <div className="nexus-top-meta">
            <img
              className="nexus-top-weather"
              src={getWeatherIconDataUri(clientWeather.code, clientWeather.isDay, clientWeather.status)}
              alt={clientWeather.status === 'ready' ? 'Météo locale' : 'Météo locale indisponible'}
            />
            <div>
              <strong>{clientWeather.city ?? (clientWeather.status === 'loading' ? 'Localisation en cours' : 'Ville non disponible')}</strong>
              <time dateTime={currentDateTime.toISOString()}>{formatSidebarDateTime(currentDateTime)}</time>
            </div>
          </div>
        </section>
        {isNexaAssistantOpen ? (
          <section className="nexa-assistant-panel" aria-label="Assistant Nexa">
            <div className="nexa-assistant-header">
              <div>
                <span className="eyebrow">Assistant IA local</span>
                <h2>Nexa</h2>
              </div>
              <button aria-label="Fermer Nexa" className="nexa-assistant-close" onClick={() => setIsNexaAssistantOpen(false)} type="button">
                X
              </button>
            </div>
            <div className="nexa-assistant-messages" aria-live="polite">
              {nexaChatMessages.map((message, index) => (
                <article className={`nexa-message nexa-message-${message.role}`} key={`${message.role}-${index}`}>
                  <span>{message.role === 'user' ? 'Vous' : 'Nexa'}</span>
                  <p>{message.content}</p>
                  {message.warning ? <small>{message.warning}</small> : null}
                  {message.mode ? <small>{message.mode === 'local-llm' ? 'IA locale' : 'Fallback local'}</small> : null}
                </article>
              ))}
              {isNexaThinking ? (
                <article className="nexa-message nexa-message-assistant">
                  <span>Nexa</span>
                  <p>Analyse locale en cours...</p>
                </article>
              ) : null}
            </div>
            {nexaChatError ? <p className="nexa-chat-error">{nexaChatError}</p> : null}
            <form
              className="nexa-chat-form"
              onSubmit={(event) => {
                event.preventDefault()
                void sendNexaChatMessage()
              }}
            >
              <textarea
                aria-label="Question pour Nexa"
                onChange={(event) => setNexaChatPrompt(event.target.value)}
                placeholder="Demandez à Nexa quoi traiter, où aller, ou pourquoi un module n'apparaît pas."
                rows={3}
                value={nexaChatPrompt}
              />
              <div className="nexa-chat-form-actions">
                <button className="ghost-button" onClick={() => setNexaChatPrompt('Explique-moi mes droits et mes prochains points de contrôle.')} type="button">
                  Droits
                </button>
                <button className="ghost-button" onClick={() => setNexaChatPrompt('Quel tableau de bord dois-je consulter en priorité ?')} type="button">
                  Dashboard
                </button>
                <button className="primary-button" disabled={isNexaThinking || !nexaChatPrompt.trim()} type="submit">
                  Envoyer
                </button>
              </div>
            </form>
          </section>
        ) : null}
        {selectedNavigation !== 'Accueil' ? (
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
        ) : null}

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
                  if (entry === administrationSettingsSection) {
                    setSelectedSettingsSection('Accueil')
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

        {!error && visibleModules.length === 0 && dashboardProfileOptions.length === 0 ? (
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
            {dashboardCubeItems.length > 1 ? (
              <section className="profile-dashboard-cube-layout" aria-label="Tableaux de bord profils">
                <button
                  aria-label="Tableau de bord precedent"
                  className="profile-dashboard-side-arrow profile-dashboard-side-arrow-left"
                  onClick={() => {
                    const previousIndex = (activeDashboardProfileIndex - 1 + dashboardCubeItems.length) % dashboardCubeItems.length
                    setSelectedDashboardProfileCode(dashboardCubeItems[previousIndex].profile.code)
                  }}
                  type="button"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <div className="profile-dashboard-cube-stage">
                  <div
                    className="profile-dashboard-cube"
                    style={{ transform: `translateZ(calc(-1 * var(--dashboard-cube-depth))) rotateY(${-activeDashboardProfileIndex * 90}deg)` }}
                  >
                    {dashboardCubeItems.map((item, index) => (
                      <article
                        className={`profile-dashboard-panel profile-dashboard-cube-face ${item.dashboard.accentClass}`}
                        key={`cube-${item.profile.code}`}
                        style={{ transform: `rotateY(${index * 90}deg) translateZ(var(--dashboard-cube-depth))` }}
                      >
                        <div className="panel-heading">
                          <span className="eyebrow">{item.dashboard.eyebrow}</span>
                          <h2>{item.dashboard.title}</h2>
                        </div>
                        <p>{item.dashboard.description}</p>
                        <section className="metrics-grid">
                          {item.dashboard.metrics.map((metric) => (
                            <article className={`metric-card ${metric.className}`} key={`${item.profile.code}-${metric.label}`}>
                              <span className="metric-label">{metric.label}</span>
                              <strong>{metric.value}</strong>
                            </article>
                          ))}
                        </section>
                        <div className="dashboard-actions profile-dashboard-actions">
                          {item.dashboard.actions.map((action) => (
                            <button
                              key={action.label}
                              className="dashboard-action-card"
                              onClick={() => activateDashboardAction(action)}
                              type="button"
                            >
                              <span className="eyebrow">{action.navigation}</span>
                              <strong>{action.label}</strong>
                              <p>{action.detail}</p>
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                <button
                  aria-label="Tableau de bord suivant"
                  className="profile-dashboard-side-arrow profile-dashboard-side-arrow-right"
                  onClick={() => {
                    const nextIndex = (activeDashboardProfileIndex + 1) % dashboardCubeItems.length
                    setSelectedDashboardProfileCode(dashboardCubeItems[nextIndex].profile.code)
                  }}
                  type="button"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </section>
            ) : (
              <article className={`profile-dashboard-panel ${profileDashboard.accentClass}`}>
                <div className="panel-heading">
                  <span className="eyebrow">{profileDashboard.eyebrow}</span>
                  <h2>{profileDashboard.title}</h2>
                </div>
                <p>{profileDashboard.description}</p>
                <section className="metrics-grid">
                  {profileDashboard.metrics.map((metric) => (
                    <article className={`metric-card ${metric.className}`} key={`${activeDashboardProfileCode}-${metric.label}`}>
                      <span className="metric-label">{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </article>
                  ))}
                </section>
                <div className="dashboard-actions profile-dashboard-actions">
                  {profileDashboard.actions.map((action) => (
                    <button
                      key={action.label}
                      className="dashboard-action-card"
                      onClick={() => activateDashboardAction(action)}
                      type="button"
                    >
                      <span className="eyebrow">{action.navigation}</span>
                      <strong>{action.label}</strong>
                      <p>{action.detail}</p>
                    </button>
                  ))}
                </div>
              </article>
            )}

          </section>
        ) : null}

        {selectedNavigation === 'Exploitation' ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide">
              <div className="panel-heading">
                <span className="eyebrow">Exploitation</span>
                <h2>Modules de travail</h2>
              </div>
              <section className="admin-subnav" aria-label="Sous-menu exploitation">
                {['Accueil', ...currentWorkspaceModules.map((module) => module.label).sort((left, right) => left.localeCompare(right, 'fr'))].map((entry) => (
                  <button
                    key={`exploitation-${entry}`}
                    className={`admin-subnav-link ${selectedWorkspaceSection === entry ? 'admin-subnav-link-active' : ''}`}
                    onClick={() => setSelectedWorkspaceSection(entry)}
                    type="button"
                  >
                    {entry}
                  </button>
                ))}
              </section>
              <div className="group-stack">
                <section className="group-card">
                  <header>
                    <h3>Exploitation</h3>
                    <span>{modulesByGroup.Exploitation?.length ?? 0} module(s)</span>
                  </header>
                  <ul className="module-list">
                    {visibleWorkspaceModules.map((module) => (
                      <li key={module.code}>
                        <span>{module.label}</span>
                        <code>{translateAccessLevel(rightsByModuleCode.get(module.code) ?? 'None')}</code>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="functional-module-grid">
                {visibleWorkspaceModules.map((module) => {
                  const blueprint = getFunctionalModuleBlueprint(module.code)
                  const accessLevel = rightsByModuleCode.get(module.code) ?? 'None'

                  if (module.code === loadingPointsModuleCode) {
                    const activeCount = loadingPoints.filter((point) => point.isActive).length
                    const geocodedCount = loadingPoints.filter((point) => point.latitude != null && point.longitude != null).length
                    const cityCount = new Set(loadingPoints.map((point) => point.city.toUpperCase())).size

                    return (
                      <article className="functional-module-card loading-points-module-card" key={`workspace-${module.code}`}>
                        <header>
                          <div>
                            <span className="eyebrow">{module.code}</span>
                            <h3>{module.label}</h3>
                          </div>
                          <span className="profile-status-badge is-active">A tester</span>
                        </header>
                        <p>{blueprint.intent}</p>
                        <div className="contraventions-toolbar">
                          <div className="contraventions-kpis" aria-label="Synthese points">
                            <span><strong>{loadingPoints.length}</strong> points</span>
                            <span><strong>{activeCount}</strong> actifs</span>
                            <span><strong>{geocodedCount}</strong> coordonnes</span>
                            <span><strong>{cityCount}</strong> villes</span>
                          </div>
                          {canWriteLoadingPoints ? (
                            <button className="primary-button" onClick={openCreateLoadingPointModal} type="button">
                              Ajouter
                            </button>
                          ) : null}
                        </div>
                        {loadingPointsError ? <p className="form-error">{loadingPointsError}</p> : null}
                        <div className="loading-points-layout">
                          <div className="loading-points-map" aria-label="Carte locale des points">
                            {loadingPoints.length === 0 ? (
                              <span className="loading-points-map-empty">Aucun point declare</span>
                            ) : (
                              loadingPoints.slice(0, 18).map((point) => (
                                <button
                                  key={`pin-${point.id}`}
                                  className={`loading-point-pin pin-${point.pointTypeCode.toLowerCase()}`}
                                  disabled={!canWriteLoadingPoints}
                                  onClick={() => canWriteLoadingPoints && openEditLoadingPointModal(point)}
                                  type="button"
                                >
                                  <strong>{point.code}</strong>
                                  <span>{point.city}</span>
                                </button>
                              ))
                            )}
                          </div>
                          <div className="contraventions-table">
                            {loadingPoints.length === 0 ? (
                              <div className="workspace-empty">
                                <strong>Aucun point charge/decharge</strong>
                                <span>Le module est pret a enregistrer les sites, tiers, exploitations et coordonnees.</span>
                              </div>
                            ) : (
                              loadingPoints.map((point) => (
                                <article className="contravention-row" key={point.id}>
                                  <div>
                                    <strong>{point.code} - {point.label}</strong>
                                    <span>{point.pointTypeLabel}</span>
                                  </div>
                                  <div>
                                    <span>{point.addressLine}</span>
                                    <span>{point.postalCode} {point.city} ({point.countryCode})</span>
                                  </div>
                                  <div>
                                    <span>{point.thirdParty?.displayName ?? 'Tiers non rattache'}</span>
                                    <span>{point.exploitation ? `${point.exploitation.code} - ${point.exploitation.label}` : 'Exploitation non rattachee'}</span>
                                  </div>
                                  <div>
                                    <strong>{point.latitude != null && point.longitude != null ? `${point.latitude}, ${point.longitude}` : 'Coordonnees a completer'}</strong>
                                    <span>{point.isActive ? 'Actif' : 'Inactif'}</span>
                                  </div>
                                  <div className="contravention-row-actions">
                                    <span className={`profile-status-badge ${point.isActive ? 'is-active' : 'is-inactive'}`}>
                                      {point.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                    {canWriteLoadingPoints ? (
                                      <button className="secondary-button" onClick={() => openEditLoadingPointModal(point)} type="button">
                                        Modifier
                                      </button>
                                    ) : null}
                                  </div>
                                </article>
                              ))
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  }

                  if (module.code === driverIndicatorsModuleCode) {
                    const summary = driverIndicators?.summary
                    const rows = driverIndicators?.drivers ?? []

                    return (
                      <article className="functional-module-card indicators-module-card" key={`workspace-${module.code}`}>
                        <header>
                          <div>
                            <span className="eyebrow">{module.code}</span>
                            <h3>{module.label}</h3>
                          </div>
                          <span className="profile-status-badge is-active">A tester</span>
                        </header>
                        <p>{blueprint.intent}</p>
                        {driverIndicatorsError ? <p className="form-error">{driverIndicatorsError}</p> : null}
                        <div className="contraventions-kpis indicators-kpis" aria-label="Synthese conducteurs">
                          <span><strong>{summary?.totalDrivers ?? 0}</strong> conducteurs</span>
                          <span><strong>{summary?.driversWithAccounts ?? 0}</strong> comptes</span>
                          <span><strong>{summary?.driversWithOpenContraventions ?? 0}</strong> avec avis ouverts</span>
                          <span><strong>{summary?.incompleteContactData ?? 0}</strong> fiches a completer</span>
                        </div>
                        <div className="indicator-table">
                          {rows.length === 0 ? (
                            <div className="workspace-empty">
                              <strong>Aucun conducteur qualifie</strong>
                              <span>Marquez les salaries conducteurs dans Donnees Communes pour alimenter ces indicateurs.</span>
                            </div>
                          ) : rows.map((driver) => (
                            <article className="indicator-row" key={driver.id}>
                              <div>
                                <strong>{driver.displayName}</strong>
                                <span>{driver.employeeNumber}</span>
                              </div>
                              <div>
                                <span>{driver.accountLogin ?? 'Compte non cree'}</span>
                                <span>{driver.accountProfile ?? 'Sans profil'}</span>
                              </div>
                              <div>
                                <strong>{driver.openContraventions}</strong>
                                <span>avis ouverts</span>
                              </div>
                              <span className={`profile-status-badge ${driver.dataQuality === 'Complet' ? 'is-active' : 'is-inactive'}`}>
                                {driver.dataQuality}
                              </span>
                            </article>
                          ))}
                        </div>
                      </article>
                    )
                  }

                  if (module.code === tractorIndicatorsModuleCode) {
                    const summary = tractorIndicators?.summary
                    const rows = tractorIndicators?.tractors ?? []

                    return (
                      <article className="functional-module-card indicators-module-card" key={`workspace-${module.code}`}>
                        <header>
                          <div>
                            <span className="eyebrow">{module.code}</span>
                            <h3>{module.label}</h3>
                          </div>
                          <span className="profile-status-badge is-active">A tester</span>
                        </header>
                        <p>{blueprint.intent}</p>
                        {tractorIndicatorsError ? <p className="form-error">{tractorIndicatorsError}</p> : null}
                        <div className="contraventions-kpis indicators-kpis" aria-label="Synthese tracteurs">
                          <span><strong>{summary?.totalTractors ?? 0}</strong> tracteurs</span>
                          <span><strong>{summary?.truckOnlineLinked ?? 0}</strong> TruckOnline</span>
                          <span><strong>{summary?.yellowBoxLinked ?? 0}</strong> YellowBox</span>
                          <span><strong>{summary?.withOpenContraventions ?? 0}</strong> avec avis ouverts</span>
                        </div>
                        <div className="indicator-table">
                          {rows.length === 0 ? (
                            <div className="workspace-empty">
                              <strong>Aucun tracteur charge</strong>
                              <span>Ajoutez ou importez les materiels tracteurs pour alimenter le pilotage exploitation.</span>
                            </div>
                          ) : rows.map((tractor) => (
                            <article className="indicator-row" key={tractor.id}>
                              <div>
                                <strong>{tractor.fleetNumber}</strong>
                                <span>{tractor.label}</span>
                              </div>
                              <div>
                                <span>{tractor.registrationNumber ?? 'Immatriculation non renseignee'}</span>
                                <span>{tractor.exploitation?.label ?? 'Exploitation non rattachee'}</span>
                              </div>
                              <div>
                                <strong>{tractor.openContraventions}</strong>
                                <span>avis ouverts</span>
                              </div>
                              <span className={`profile-status-badge ${tractor.dataQuality === 'Complet' ? 'is-active' : 'is-inactive'}`}>
                                {tractor.dataQuality}
                              </span>
                            </article>
                          ))}
                        </div>
                      </article>
                    )
                  }

                  if (module.code === contraventionsModuleCode) {
                    const openCount = contraventions.filter((item) => !['PAYEE', 'CLASSEE'].includes(item.statusCode)).length
                    const dueSoonCount = contraventions.filter((item) => {
                      if (!item.dueDate || ['PAYEE', 'CLASSEE'].includes(item.statusCode)) {
                        return false
                      }

                      const dueDate = new Date(item.dueDate)
                      const today = new Date()
                      const limit = new Date()
                      limit.setDate(today.getDate() + 15)
                      return dueDate >= today && dueDate <= limit
                    }).length

                    return (
                      <article className="functional-module-card contraventions-module-card" key={`workspace-${module.code}`}>
                        <header>
                          <div>
                            <span className="eyebrow">{module.code}</span>
                            <h3>{module.label}</h3>
                          </div>
                          <span className="profile-status-badge is-active">A tester</span>
                        </header>
                        <p>{blueprint.intent}</p>
                        <div className="contraventions-toolbar">
                          <div className="contraventions-kpis" aria-label="Synthese contraventions">
                            <span><strong>{contraventions.length}</strong> avis</span>
                            <span><strong>{openCount}</strong> ouverts</span>
                            <span><strong>{dueSoonCount}</strong> echeance 15 j</span>
                          </div>
                          {canWriteContraventions ? (
                            <button className="primary-button" onClick={openCreateContraventionModal} type="button">
                              Ajouter
                            </button>
                          ) : null}
                        </div>
                        {contraventionsError ? <p className="form-error">{contraventionsError}</p> : null}
                        {contraventions.length === 0 ? (
                          <div className="workspace-empty">
                            <strong>Aucune contravention suivie</strong>
                            <span>Le module est pret a enregistrer les avis, statuts, conducteurs et materiels.</span>
                          </div>
                        ) : (
                          <div className="contraventions-table">
                            {contraventions.map((contravention) => (
                              <article className="contravention-row" key={contravention.id}>
                                <div>
                                  <strong>{contravention.noticeNumber}</strong>
                                  <span>{contravention.offenseLabel}</span>
                                </div>
                                <div>
                                  <span>{new Date(contravention.offenseDate).toLocaleDateString()}</span>
                                  <span>{contravention.location ?? '-'}</span>
                                </div>
                                <div>
                                  <span>{contravention.driverEmployee?.displayName ?? 'Conducteur non rattache'}</span>
                                  <span>{contravention.material ? `${contravention.material.fleetNumber} - ${contravention.material.label}` : 'Materiel non rattache'}</span>
                                </div>
                                <div>
                                  <strong>{contravention.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                                  <span>{contravention.dueDate ? `Echeance ${new Date(contravention.dueDate).toLocaleDateString()}` : 'Sans echeance'}</span>
                                </div>
                                <div className="contravention-row-actions">
                                  <span className="profile-status-badge is-active">{contravention.statusLabel}</span>
                                  {canWriteContraventions ? (
                                    <button className="secondary-button" onClick={() => openEditContraventionModal(contravention)} type="button">
                                      Modifier
                                    </button>
                                  ) : null}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </article>
                    )
                  }

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
              <section className="admin-subnav" aria-label="Sous-menu gestion administrative">
                {['Accueil', ...currentWorkspaceModules.map((module) => module.label).sort((left, right) => left.localeCompare(right, 'fr'))].map((entry) => (
                  <button
                    key={`gestion-${entry}`}
                    className={`admin-subnav-link ${selectedWorkspaceSection === entry ? 'admin-subnav-link-active' : ''}`}
                    onClick={() => setSelectedWorkspaceSection(entry)}
                    type="button"
                  >
                    {entry}
                  </button>
                ))}
              </section>
              <div className="group-stack">
                <section className="group-card">
                  <header>
                    <h3>Gestion administrative</h3>
                    <span>{modulesByGroup['Gestion administrative']?.length ?? 0} module(s)</span>
                  </header>
                  <ul className="module-list">
                    {visibleWorkspaceModules.map((module) => (
                      <li key={module.code}>
                        <span>{module.label}</span>
                        <code>{translateAccessLevel(rightsByModuleCode.get(module.code) ?? 'None')}</code>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="functional-module-grid">
                {visibleWorkspaceModules.map((module) => {
                  const blueprint = getFunctionalModuleBlueprint(module.code)
                  const accessLevel = rightsByModuleCode.get(module.code) ?? 'None'

                  if (module.code === contraventionsModuleCode) {
                    const openCount = contraventions.filter((item) => !['PAYEE', 'CLASSEE'].includes(item.statusCode)).length
                    const dueSoonCount = contraventions.filter((item) => {
                      if (!item.dueDate || ['PAYEE', 'CLASSEE'].includes(item.statusCode)) {
                        return false
                      }

                      const dueDate = new Date(item.dueDate)
                      const today = new Date()
                      const limit = new Date()
                      limit.setDate(today.getDate() + 15)
                      return dueDate >= today && dueDate <= limit
                    }).length

                    return (
                      <article className="functional-module-card contraventions-module-card" key={`workspace-${module.code}`}>
                        <header>
                          <div>
                            <span className="eyebrow">{module.code}</span>
                            <h3>{module.label}</h3>
                          </div>
                          <span className="profile-status-badge is-active">A tester</span>
                        </header>
                        <p>{blueprint.intent}</p>
                        <div className="contraventions-toolbar">
                          <div className="contraventions-kpis" aria-label="Synthese contraventions">
                            <span><strong>{contraventions.length}</strong> avis</span>
                            <span><strong>{openCount}</strong> ouverts</span>
                            <span><strong>{dueSoonCount}</strong> echeance 15 j</span>
                          </div>
                          {canWriteContraventions ? (
                            <button className="primary-button" onClick={openCreateContraventionModal} type="button">
                              Ajouter
                            </button>
                          ) : null}
                        </div>
                        {contraventionsError ? <p className="form-error">{contraventionsError}</p> : null}
                        {contraventions.length === 0 ? (
                          <div className="workspace-empty">
                            <strong>Aucune contravention suivie</strong>
                            <span>Le module est pret a enregistrer les avis, statuts, conducteurs et materiels.</span>
                          </div>
                        ) : (
                          <div className="contraventions-table">
                            {contraventions.map((contravention) => (
                              <article className="contravention-row" key={contravention.id}>
                                <div>
                                  <strong>{contravention.noticeNumber}</strong>
                                  <span>{contravention.offenseLabel}</span>
                                </div>
                                <div>
                                  <span>{new Date(contravention.offenseDate).toLocaleDateString()}</span>
                                  <span>{contravention.location ?? '-'}</span>
                                </div>
                                <div>
                                  <span>{contravention.driverEmployee?.displayName ?? 'Conducteur non rattache'}</span>
                                  <span>{contravention.material ? `${contravention.material.fleetNumber} - ${contravention.material.label}` : 'Materiel non rattache'}</span>
                                </div>
                                <div>
                                  <strong>{contravention.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                                  <span>{contravention.dueDate ? `Echeance ${new Date(contravention.dueDate).toLocaleDateString()}` : 'Sans echeance'}</span>
                                </div>
                                <div className="contravention-row-actions">
                                  <span className="profile-status-badge is-active">{contravention.statusLabel}</span>
                                  {canWriteContraventions ? (
                                    <button className="secondary-button" onClick={() => openEditContraventionModal(contravention)} type="button">
                                      Modifier
                                    </button>
                                  ) : null}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </article>
                    )
                  }

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

        {((selectedNavigation === 'Administration' && isInformatique && selectedAdministrationSection === administrationSettingsSection) ||
          (selectedNavigation === commonDataNavigationLabel && canReadCommonData)) ? (
          <section className="workspace-grid">
            <article className="panel-card panel-card-wide settings-card">
              <div className="panel-heading">
                <span className="eyebrow">{activeReferenceNavigationEntries === commonDataNavigationEntries ? commonDataNavigationLabel : administrationSettingsSection}</span>
                <h2>{activeReferenceNavigationEntries === commonDataNavigationEntries ? 'Donn\u00e9es Communes' : 'Socle de paramétrage'}</h2>
              </div>
              <div className="settings-intro-grid">
                <div className="settings-intro-copy">
                  <p>
                    {activeReferenceNavigationEntries === commonDataNavigationEntries
                      ? 'Cette vue centralise les données communes opérationnelles de NewNexus.'
                      : 'Cette vue centralise les paramètres de structure de NewNexus.'}
                  </p>
                  <p>
                    {activeReferenceNavigationEntries === commonDataNavigationEntries
                      ? `${employees.length} salarié(s), ${thirdParties.length} tiers et ${materials.length} matériel(s) actuellement chargé(s).`
                      : `${companies.length} société(s), ${analytics.length} analytique(s) et ${exploitations.length} exploitation(s) actuellement chargée(s).`}
                  </p>
                  <p className="settings-note">
                    {activeReferenceNavigationEntries === commonDataNavigationEntries
                      ? 'Les salariés, tiers et matériels ne sont pas des paramètres: ils restent dans Données Communes.'
                      : 'Les sociétés Groupe Laure sont alimentées via SIRENE. Les analytiques et exploitations sont rattachés aux sociétés validées.'}
                  </p>
                </div>
                <div className="settings-kpis">
                  <div className="metric-card metric-card-navy">
                    <span className="metric-label">{activeReferenceNavigationEntries === commonDataNavigationEntries ? 'Salariés' : 'Sociétés'}</span>
                    <strong>{activeReferenceNavigationEntries === commonDataNavigationEntries ? employees.length : companies.length}</strong>
                  </div>
                  <div className="metric-card metric-card-champagne">
                    <span className="metric-label">{activeReferenceNavigationEntries === commonDataNavigationEntries ? 'Tiers' : 'Analytiques'}</span>
                    <strong>{activeReferenceNavigationEntries === commonDataNavigationEntries ? thirdParties.length : analytics.length}</strong>
                  </div>
                  <div className="metric-card metric-card-cyan">
                    <span className="metric-label">{activeReferenceNavigationEntries === commonDataNavigationEntries ? 'Matériels' : 'Exploitations'}</span>
                    <strong>{activeReferenceNavigationEntries === commonDataNavigationEntries ? materials.length : exploitations.length}</strong>
                  </div>
                </div>
              </div>

              {activeReferenceNavigationEntries === settingsNavigationEntries && companies.length === 0 ? (
                <div className="status-banner status-banner-warning">
                  <strong>Paramétrage bloqué</strong>
                  <span>Ajoutez d’abord une société Groupe Laure pour créer les analytiques et exploitations.</span>
                </div>
              ) : null}

              <section className="admin-subnav" aria-label="Sous-menu paramètres">
                {activeReferenceNavigationEntries.map((entry) => (
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
                  {activeReferenceNavigationEntries
                    .filter((entry) => entry !== 'Accueil')
                    .map((entry) => (
                      <button
                        key={entry}
                        className="dashboard-action-card"
                        onClick={() => setSelectedSettingsSection(entry)}
                        type="button"
                      >
                        <span className="eyebrow">{activeReferenceNavigationEntries === commonDataNavigationEntries ? commonDataNavigationLabel : administrationSettingsSection}</span>
                        <strong>{entry}</strong>
                        <p>{getSettingsSectionDescription(entry)}</p>
                      </button>
                    ))}
                </div>
              ) : null}

              {selectedSettingsSection !== 'Accueil' ? (
              <div className="settings-reference-grid settings-reference-grid-single">
                {selectedSettingsSection === settingsCompaniesSection ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <div>
                      <h3>Sociétés Groupe Laure</h3>
                      <small>Liste des sociétés validées par SIRENE</small>
                    </div>
                    <button className="primary-button" onClick={openCreateCompanyModal} type="button">
                      Ajouter une société
                    </button>
                  </div>
                  <div className="settings-list">
                    {companies.length === 0 ? (
                      <div className="settings-empty">Aucune société chargée pour le moment.</div>
                    ) : (
                      companies.map((company) => (
                        <article className="profile-summary-card accent-navy" key={company.id}>
                          <header className="profile-summary-header">
                            <div>
                              <h3>{company.displayName}</h3>
                              <p>{company.legalName}</p>
                            </div>
                            <span className={`profile-status-badge ${company.isActive ? 'is-active' : 'is-inactive'}`}>
                              {company.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </header>
                          <div className="profile-summary-rights">
                            <div className="profile-summary-right">
                              <span>SIREN</span>
                              <strong>{company.siren}</strong>
                            </div>
                            <div className="profile-summary-right">
                              <span>Créée le</span>
                              <strong>{new Date(company.createdAtUtc).toLocaleDateString()}</strong>
                            </div>
                          </div>
                          <div className="settings-inline-actions">
                            <button className="secondary-button" onClick={() => openEditCompanyModal(company)} type="button">
                              Configurer la société
                            </button>
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
                    <button className="secondary-button" disabled={!canEditReferenceData || luccaEmployeeImport.isImporting} onClick={() => void handleImportLuccaEmployees()} type="button">
                      {luccaEmployeeImport.isImporting ? 'Import Lucca...' : 'Importer depuis Lucca'}
                    </button>
                    <button className="primary-button" disabled={!canEditReferenceData} onClick={openCreateEmployeeModal} type="button">
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
                      disabled={!canEditReferenceData || employeeProvisioning.isProvisioning || employees.length === 0}
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
                          <button className="secondary-button" disabled={!canEditReferenceData} onClick={() => openEditEmployeeModal(employee)} type="button">
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
                    <div>
                      <h3>Tiers</h3>
                      <small>{thirdParties.length} tiers - multi-analytiques</small>
                    </div>
                    <button className="primary-button" disabled={!canEditReferenceData} onClick={openCreateThirdPartyModal} type="button">
                      Ajouter un tiers
                    </button>
                  </div>
                  <p className="profiles-toolbar-copy">
                    R&eacute;f&eacute;rentiel tiers multi-types avec rattachement possible &agrave; plusieurs analytiques. Les particuliers et entreprises &eacute;trang&egrave;res restent &agrave; arbitrer hors SIRENE.
                  </p>
                  <div className="profiles-overview-grid">
                    {thirdParties.length === 0 ? (
                      <div className="settings-empty">Aucun tiers charg&eacute; pour le moment.</div>
                    ) : thirdParties.map((thirdParty) => (
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
                        <div className="profile-summary-actions">
                          <button className="secondary-button" disabled={!canEditReferenceData} onClick={() => openEditThirdPartyModal(thirdParty)} type="button">
                            Configurer le tiers
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
                ) : null}

                {selectedSettingsSection === materialSettingsSection ? (
                <section className="settings-list-section">
                  <div className="settings-list-header">
                    <div>
                      <h3>Mat&eacute;riels</h3>
                      <small>{materials.length} materiel(s) - parc</small>
                    </div>
                    <button className="primary-button" disabled={!canEditReferenceData} onClick={openCreateMaterialModal} type="button">
                      Ajouter un mat&eacute;riel
                    </button>
                  </div>
                  <p className="profiles-toolbar-copy">
                    R&eacute;f&eacute;rentiel mat&eacute;riels local avec num&eacute;ro de parc unique, pr&ecirc;t pour TruckOnline et YellowBox.
                  </p>
                  <div className="profiles-overview-grid">
                    {materials.length === 0 ? (
                      <div className="settings-empty">Aucun mat&eacute;riel charg&eacute; pour le moment.</div>
                    ) : materials.map((material) => (
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
                        <div className="profile-summary-actions">
                          <button className="secondary-button" disabled={!canEditReferenceData} onClick={() => openEditMaterialModal(material)} type="button">
                            Configurer le mat&eacute;riel
                          </button>
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

            {selectedToolsSection === toolsSessionsSection ? (
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

            {selectedToolsSection === toolsDiagnosticsSection ? (
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
                    ['Param\u00e8tres', adminDiagnostics.readiness.settings],
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
            {selectedToolsSection === toolsApiKeysSection ? (
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

            {selectedToolsSection === toolsScheduledTasksSection ? (
              <article className="panel-card panel-card-wide scheduled-tasks-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Tâches planifiées</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Première vue de pilotage des traitements à automatiser. Les connecteurs restent à raccorder avant activation.
                </p>
                <div className="administration-synthesis-actions">
                  <button className="secondary-button" onClick={() => void loadScheduledTasks()} type="button">
                    Rafraîchir
                  </button>
                </div>
                {scheduledTasksError ? (
                  <div className="status-banner status-banner-error">
                    <strong>Tâches indisponibles</strong>
                    <span>{scheduledTasksError}</span>
                  </div>
                ) : null}
                <div className="scheduled-tasks-grid">
                  {displayedScheduledTasks.map((task) => (
                    <article className="scheduled-task-card" key={task.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{task.scope}</span>
                          <h3>{task.label}</h3>
                        </div>
                        <span className={`profile-status-badge ${task.isRunnable ? 'is-active' : 'is-inactive'}`}>{task.status}</span>
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
                        <div className="profile-summary-right">
                          <span>Dernière exécution</span>
                          <strong>{task.lastRun ? new Date(task.lastRun.createdAtUtc).toLocaleString() : 'Jamais'}</strong>
                        </div>
                      </div>
                      <button
                        className="secondary-button"
                        disabled={!task.isRunnable || runningScheduledTaskCode === task.code}
                        onClick={() => void handleRunScheduledTask(task.code)}
                        type="button"
                      >
                        {runningScheduledTaskCode === task.code ? 'Exécution...' : task.isRunnable ? 'Exécuter maintenant' : 'À raccorder'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            {selectedToolsSection === toolsSqlSection ? (
              <article className="panel-card panel-card-wide tools-catalog-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Requ&ecirc;teur SQL</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Ex&eacute;cution de requ&ecirc;tes nomm&eacute;es en lecture seule. Aucun SQL libre n&apos;est accept&eacute; depuis l&apos;interface.
                </p>
                <div className="tools-safety-banner">
                  <strong>Cadre verrouill&eacute;</strong>
                  <span>Catalogue serveur, lecture seule via le DbContext, secrets masqu&eacute;s et journalisation de chaque lancement.</span>
                </div>
                {controlledSqlError ? (
                  <div className="status-banner status-banner-error">
                    <strong>Requêteur indisponible</strong>
                    <span>{controlledSqlError}</span>
                  </div>
                ) : null}
                <div className="tools-catalog-grid">
                  {controlledSqlCatalog.map((query) => (
                    <article className="tool-blueprint-card" key={query.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{query.scope}</span>
                          <h3>{query.label}</h3>
                        </div>
                        <span className="profile-status-badge is-active">Disponible</span>
                      </header>
                      <p>{query.description}</p>
                      <div className="profile-summary-right">
                        <span>Code technique</span>
                        <strong>{query.code}</strong>
                      </div>
                      <button
                        className="secondary-button"
                        disabled={runningControlledSqlCode === query.code}
                        onClick={() => void handleRunControlledSqlQuery(query.code)}
                        type="button"
                      >
                        {runningControlledSqlCode === query.code ? 'Exécution...' : 'Exécuter'}
                      </button>
                    </article>
                  ))}
                </div>
                {controlledSqlCatalog.length === 0 && !controlledSqlError ? (
                  <div className="settings-empty">Chargement du catalogue SQL...</div>
                ) : null}
                {controlledSqlResult ? (
                  <section className="controlled-sql-result">
                    <div className="settings-list-header">
                      <div>
                        <span className="eyebrow">Résultat</span>
                        <h3>{controlledSqlResult.query.label}</h3>
                      </div>
                      <small>
                        {controlledSqlResult.rowCount} ligne(s) - {new Date(controlledSqlResult.executedAtUtc).toLocaleString()}
                      </small>
                    </div>
                    {controlledSqlResult.rows.length > 0 ? (
                      <div className="controlled-sql-table">
                        <div className="controlled-sql-table-head">
                          {controlledSqlResult.query.columns.map((column) => (
                            <span key={column}>{formatControlledSqlColumn(column)}</span>
                          ))}
                        </div>
                        {controlledSqlResult.rows.map((row, rowIndex) => (
                          <div className="controlled-sql-table-row" key={`${controlledSqlResult.query.code}-${rowIndex}`}>
                            {controlledSqlResult.query.columns.map((column) => (
                              <span key={column}>{formatControlledSqlValue(row[column])}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="settings-empty">Aucune donnée pour cette requête.</div>
                    )}
                  </section>
                ) : null}
              </article>
            ) : null}

            {false ? (
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

            {selectedToolsSection === toolsTracesSection ? (
              <article className="panel-card panel-card-wide tools-catalog-card">
                <div className="panel-heading">
                  <span className="eyebrow">Outils</span>
                  <h2>Traces</h2>
                </div>
                <p className="profiles-toolbar-copy">
                  Consultation des traces applicatives collect&eacute;es par flux, avec secrets masqu&eacute;s et conservation ma&icirc;tris&eacute;e.
                </p>
                <div className="administration-synthesis-actions">
                  <label className="trace-stream-filter">
                    <span>Flux</span>
                    <select value={selectedTraceStream} onChange={handleTraceStreamChange}>
                      <option value="ALL">Tous les flux</option>
                      {applicationTraces.streams.map((stream) => (
                        <option key={stream.code} value={stream.code}>
                          {stream.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="secondary-button" onClick={() => void loadApplicationTraces()} type="button">
                    Rafraîchir
                  </button>
                </div>
                {tracesError ? (
                  <div className="status-banner status-banner-error">
                    <strong>Traces indisponibles</strong>
                    <span>{tracesError}</span>
                  </div>
                ) : null}
                <div className="tools-catalog-grid">
                  {applicationTraces.streams.map((stream) => (
                    <article className="tool-blueprint-card" key={stream.code}>
                      <header>
                        <div>
                          <span className="eyebrow">{stream.code}</span>
                          <h3>{stream.label}</h3>
                        </div>
                        <span className="profile-status-badge is-active">{stream.retention}</span>
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
                <section className="trace-events-list">
                  <div className="settings-list-header">
                    <div>
                      <span className="eyebrow">Journal</span>
                      <h3>{applicationTraces.traces.length} trace(s)</h3>
                    </div>
                    <small>Limite: {applicationTraces.limit}</small>
                  </div>
                  {applicationTraces.traces.length > 0 ? (
                    applicationTraces.traces.map((trace) => (
                      <article className="trace-event-card" key={trace.id}>
                        <header>
                          <div>
                            <span className="eyebrow">{trace.streamLabel} - {trace.eventCode}</span>
                            <h3>{trace.message}</h3>
                          </div>
                          <span className={`profile-status-badge ${trace.level === 'Warning' ? 'is-inactive' : 'is-active'}`}>
                            {trace.level}
                          </span>
                        </header>
                        <div className="session-row-meta">
                          <span>{new Date(trace.createdAtUtc).toLocaleString()}</span>
                          <span>{trace.actorLogin ?? 'Systeme'}</span>
                          <span>{trace.subject ?? 'Sans objet'}</span>
                          <span>{trace.ipAddress ?? 'IP non renseignee'}</span>
                        </div>
                        {trace.detail ? <p>{trace.detail}</p> : null}
                      </article>
                    ))
                  ) : (
                    <div className="settings-empty">Aucune trace pour le filtre courant.</div>
                  )}
                </section>
                <div className="trace-retention-strip">
                  <strong>Point de vigilance</strong>
                  <span>Les traces masquent les secrets et ne stockent pas les mots de passe, jetons ou valeurs de cl&eacute;s API.</span>
                </div>
              </article>
            ) : null}

            {false ? (
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
            selectedToolsSection !== toolsSessionsSection &&
            selectedToolsSection !== toolsSqlSection &&
            selectedToolsSection !== toolsTracesSection &&
            selectedToolsSection !== toolsApiKeysSection &&
            selectedToolsSection !== toolsScheduledTasksSection &&
            selectedToolsSection !== toolsDiagnosticsSection ? (
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

        {isCreateCompanyModalOpen || editingCompany ? (
          <div className="modal-overlay" onClick={closeCompanyModal} role="presentation">
            <section
              aria-labelledby="company-modal-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{editingCompany ? 'Configuration' : 'Création SIRENE'}</span>
                  <h2 id="company-modal-title">{editingCompany ? 'Configurer la société' : 'Ajouter une société'}</h2>
                </div>
                <button className="modal-close-button" onClick={closeCompanyModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="settings-form settings-create-form" onSubmit={editingCompany ? handleSaveCompany : handleCreateCompany}>
                <div className="status-banner status-banner-warning account-form-warning">
                  <strong>Recherche SIRENE obligatoire</strong>
                  <span>La création d'une société est bloquée tant que le SIREN n'a pas été validé par SIRENE.</span>
                </div>
                <label>
                  <span>SIREN</span>
                  <input
                    disabled={Boolean(editingCompany)}
                    inputMode="numeric"
                    maxLength={32}
                    placeholder="123 456 789"
                    value={companyForm.siren}
                    onChange={(event) => handleNewCompanyFieldChange('siren', event)}
                  />
                  {!editingCompany ? (
                    <small className="settings-field-help">Saisissez ou collez le SIREN: espaces, points et tirets sont acceptés.</small>
                  ) : null}
                </label>
                {!editingCompany ? (
                  <button
                    className="secondary-button settings-lookup-button"
                    disabled={isLookingUpNewCompany || companyForm.isSaving}
                    onClick={() => void handleLookupNewCompanySirene()}
                    type="button"
                  >
                    {isLookingUpNewCompany ? 'Recherche...' : 'Rechercher SIRENE'}
                  </button>
                ) : null}
                {!editingCompany ? (
                  <section className="sirene-search-panel">
                    <div className="settings-list-header">
                      <div>
                        <h3>Recherche par critères</h3>
                        <small>Nom, ville et/ou code postal</small>
                      </div>
                      <button
                        className="secondary-button"
                        disabled={sireneCompanySearch.isSearching || companyForm.isSaving}
                        onClick={() => void handleSearchCompaniesSirene()}
                        type="button"
                      >
                        {sireneCompanySearch.isSearching ? 'Recherche...' : 'Rechercher'}
                      </button>
                    </div>
                    <div className="sirene-search-grid">
                      <label>
                        <span>Nom</span>
                        <input value={sireneCompanySearch.name} onChange={(event) => handleSireneCompanySearchFieldChange('name', event)} />
                      </label>
                      <label>
                        <span>Ville</span>
                        <input value={sireneCompanySearch.city} onChange={(event) => handleSireneCompanySearchFieldChange('city', event)} />
                      </label>
                      <label>
                        <span>Code postal</span>
                        <input inputMode="numeric" maxLength={5} value={sireneCompanySearch.postalCode} onChange={(event) => handleSireneCompanySearchFieldChange('postalCode', event)} />
                      </label>
                    </div>
                    {sireneCompanySearch.error ? <small className="account-error">{sireneCompanySearch.error}</small> : null}
                    {sireneCompanySearch.results.length > 0 ? (
                      <div className="sirene-search-results">
                        {sireneCompanySearch.results.map((company) => (
                          <button
                            className={`sirene-result-card ${companyForm.siren === company.siren ? 'sirene-result-card-selected' : ''}`}
                            key={`${company.siren}-${company.siret ?? 'siege'}`}
                            onClick={() => selectSireneCompanyResult(company)}
                            type="button"
                          >
                            <strong>{company.displayName ?? company.legalName ?? company.siren}</strong>
                            <span>{company.siren}{company.siret ? ` - ${company.siret}` : ''}</span>
                            <small>{[company.postalCode, company.city].filter(Boolean).join(' ') || 'Localisation non renseignée'}</small>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ) : null}
                <label>
                  <span>Nom affiché</span>
                  <input value={companyForm.displayName} onChange={(event) => handleNewCompanyFieldChange('displayName', event)} />
                </label>
                <label>
                  <span>Raison sociale</span>
                  <input value={companyForm.legalName} onChange={(event) => handleNewCompanyFieldChange('legalName', event)} />
                </label>
                <label className="toggle-label settings-toggle">
                  <input checked={companyForm.isActive} onChange={handleNewCompanyStatusChange} type="checkbox" />
                  <span>{companyForm.isActive ? 'Active' : 'Inactive'}</span>
                </label>
                <div className="profile-action-row">
                  <button className="primary-button" disabled={companyForm.isSaving || (!editingCompany && !companyForm.isSireneValidated)} type="submit">
                    {companyForm.isSaving ? 'Enregistrement...' : editingCompany ? 'Enregistrer la société' : 'Ajouter la société'}
                  </button>
                  {companyForm.isSireneValidated ? <small className="form-success">SIRENE validé pour ce SIREN.</small> : null}
                  {companyForm.error ? <small className="account-error">{companyForm.error}</small> : null}
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

        {isThirdPartyModalOpen || editingThirdParty ? (
          <div className="modal-overlay" onClick={closeThirdPartyModal} role="presentation">
            <section
              aria-labelledby="third-party-modal-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{editingThirdParty ? 'Configuration' : 'Cr\u00e9ation'}</span>
                  <h2 id="third-party-modal-title">{editingThirdParty ? 'Configurer le tiers' : 'Ajouter un tiers'}</h2>
                </div>
                <button className="modal-close-button" onClick={closeThirdPartyModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="settings-form settings-create-form" onSubmit={editingThirdParty ? handleSaveThirdParty : handleCreateThirdParty}>
                <label>
                  <span>Type</span>
                  <select value={newThirdParty.typeCode} onChange={(event) => handleNewThirdPartyFieldChange('typeCode', event)}>
                    <option value="CLIENT">Client</option>
                    <option value="FOURNISSEUR">Fournisseur</option>
                    <option value="PARTENAIRE">Partenaire</option>
                    <option value="PARTICULIER">Particulier</option>
                    <option value="ETRANGER">Entreprise &eacute;trang&egrave;re</option>
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
                  <span>TVA</span>
                  <input value={newThirdParty.vatNumber} onChange={(event) => handleNewThirdPartyFieldChange('vatNumber', event)} />
                </label>
                <label>
                  <span>R&eacute;f&eacute;rence externe</span>
                  <input value={newThirdParty.externalReference} onChange={(event) => handleNewThirdPartyFieldChange('externalReference', event)} />
                </label>
                <label>
                  <span>Analytiques rattach&eacute;s</span>
                  <select multiple value={newThirdParty.analyticIds} onChange={handleNewThirdPartyAnalyticChange}>
                    {analytics.map((analytic) => (
                      <option key={analytic.id} value={analytic.id}>{analytic.code} - {analytic.label}</option>
                    ))}
                  </select>
                </label>
                <label className="toggle-label">
                  <input checked={newThirdParty.isForeignCompany} onChange={(event) => handleNewThirdPartyBooleanChange('isForeignCompany', event)} type="checkbox" />
                  <span>Entreprise &eacute;trang&egrave;re</span>
                </label>
                <label className="toggle-label">
                  <input checked={newThirdParty.isActive} onChange={(event) => handleNewThirdPartyBooleanChange('isActive', event)} type="checkbox" />
                  <span>Actif</span>
                </label>
                <div className="profile-action-row">
                  <button className="primary-button" disabled={newThirdParty.isSaving} type="submit">
                    {newThirdParty.isSaving ? 'Enregistrement...' : editingThirdParty ? 'Enregistrer le tiers' : 'Ajouter le tiers'}
                  </button>
                  {newThirdParty.error ? <small className="account-error">{newThirdParty.error}</small> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isMaterialModalOpen || editingMaterial ? (
          <div className="modal-overlay" onClick={closeMaterialModal} role="presentation">
            <section
              aria-labelledby="material-modal-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{editingMaterial ? 'Configuration' : 'Cr\u00e9ation'}</span>
                  <h2 id="material-modal-title">{editingMaterial ? 'Configurer le mat&eacute;riel' : 'Ajouter un mat&eacute;riel'}</h2>
                </div>
                <button className="modal-close-button" onClick={closeMaterialModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="settings-form settings-create-form" onSubmit={editingMaterial ? handleSaveMaterial : handleCreateMaterial}>
                <label>
                  <span>Num&eacute;ro de parc</span>
                  <input value={newMaterial.fleetNumber} onChange={(event) => handleNewMaterialFieldChange('fleetNumber', event)} />
                </label>
                <label>
                  <span>Libell&eacute;</span>
                  <input value={newMaterial.label} onChange={(event) => handleNewMaterialFieldChange('label', event)} />
                </label>
                <label>
                  <span>Type</span>
                  <select value={newMaterial.materialType} onChange={(event) => handleNewMaterialFieldChange('materialType', event)}>
                    <option value="TRACTEUR">Tracteur</option>
                    <option value="REMORQUE">Remorque</option>
                    <option value="VL">V&eacute;hicule l&eacute;ger</option>
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
                    <option value="">Non rattach&eacute;</option>
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
                    {newMaterial.isSaving ? 'Enregistrement...' : editingMaterial ? 'Enregistrer le mat&eacute;riel' : 'Ajouter le mat&eacute;riel'}
                  </button>
                  {newMaterial.error ? <small className="account-error">{newMaterial.error}</small> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isContraventionModalOpen || editingContravention ? (
          <div className="modal-overlay" onClick={closeContraventionModal} role="presentation">
            <section
              aria-labelledby="contravention-modal-title"
              className="modal-card profile-modal-card contravention-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{editingContravention ? 'Traitement' : 'Creation'}</span>
                  <h2 id="contravention-modal-title">{editingContravention ? 'Modifier la contravention' : 'Ajouter une contravention'}</h2>
                </div>
                <button className="modal-close-button" onClick={closeContraventionModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="settings-form settings-create-form" onSubmit={handleSaveContravention}>
                <label>
                  <span>Numero d'avis</span>
                  <input value={contraventionForm.noticeNumber} onChange={(event) => handleContraventionFormChange('noticeNumber', event)} />
                </label>
                <label>
                  <span>Statut</span>
                  <select value={contraventionForm.statusCode} onChange={(event) => handleContraventionFormChange('statusCode', event)}>
                    {contraventionStatuses.map((status) => (
                      <option key={status.code} value={status.code}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Date d'infraction</span>
                  <input type="date" value={contraventionForm.offenseDate} onChange={(event) => handleContraventionFormChange('offenseDate', event)} />
                </label>
                <label>
                  <span>Echeance</span>
                  <input type="date" value={contraventionForm.dueDate} onChange={(event) => handleContraventionFormChange('dueDate', event)} />
                </label>
                <label>
                  <span>Montant</span>
                  <input inputMode="decimal" value={contraventionForm.amount} onChange={(event) => handleContraventionFormChange('amount', event)} />
                </label>
                <label>
                  <span>Infraction</span>
                  <input value={contraventionForm.offenseLabel} onChange={(event) => handleContraventionFormChange('offenseLabel', event)} />
                </label>
                <label>
                  <span>Conducteur</span>
                  <select value={contraventionForm.driverEmployeeId} onChange={(event) => handleContraventionFormChange('driverEmployeeId', event)}>
                    <option value="">Non rattache</option>
                    {employees.filter((employee) => employee.isDriver).map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.displayName} - {employee.employeeNumber}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Materiel</span>
                  <select value={contraventionForm.materialId} onChange={(event) => handleContraventionFormChange('materialId', event)}>
                    <option value="">Non rattache</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>{material.fleetNumber} - {material.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Lieu</span>
                  <input value={contraventionForm.location} onChange={(event) => handleContraventionFormChange('location', event)} />
                </label>
                <label className="settings-form-wide">
                  <span>Notes</span>
                  <textarea value={contraventionForm.notes} onChange={(event) => handleContraventionFormChange('notes', event)} />
                </label>
                <div className="profile-action-row">
                  <button className="primary-button" disabled={contraventionForm.isSaving} type="submit">
                    {contraventionForm.isSaving ? 'Enregistrement...' : editingContravention ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {contraventionForm.error ? <small className="account-error">{contraventionForm.error}</small> : null}
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {isLoadingPointModalOpen || editingLoadingPoint ? (
          <div className="modal-overlay" onClick={closeLoadingPointModal} role="presentation">
            <section
              aria-labelledby="loading-point-modal-title"
              className="modal-card profile-modal-card"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <div>
                  <span className="eyebrow">{editingLoadingPoint ? 'Site' : 'Creation'}</span>
                  <h2 id="loading-point-modal-title">{editingLoadingPoint ? 'Modifier le point' : 'Ajouter un point'}</h2>
                </div>
                <button className="modal-close-button" onClick={closeLoadingPointModal} type="button">
                  Fermer
                </button>
              </div>

              <form className="settings-form settings-create-form" onSubmit={handleSaveLoadingPoint}>
                <label>
                  <span>Code</span>
                  <input value={loadingPointForm.code} onChange={(event) => handleLoadingPointFormChange('code', event)} />
                </label>
                <label>
                  <span>Type</span>
                  <select value={loadingPointForm.pointTypeCode} onChange={(event) => handleLoadingPointFormChange('pointTypeCode', event)}>
                    {loadingPointTypes.map((type) => (
                      <option key={type.code} value={type.code}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Libelle</span>
                  <input value={loadingPointForm.label} onChange={(event) => handleLoadingPointFormChange('label', event)} />
                </label>
                <label>
                  <span>Adresse</span>
                  <input value={loadingPointForm.addressLine} onChange={(event) => handleLoadingPointFormChange('addressLine', event)} />
                </label>
                <label>
                  <span>Code postal</span>
                  <input value={loadingPointForm.postalCode} onChange={(event) => handleLoadingPointFormChange('postalCode', event)} />
                </label>
                <label>
                  <span>Ville</span>
                  <input value={loadingPointForm.city} onChange={(event) => handleLoadingPointFormChange('city', event)} />
                </label>
                <label>
                  <span>Pays</span>
                  <input maxLength={2} value={loadingPointForm.countryCode} onChange={(event) => handleLoadingPointFormChange('countryCode', event)} />
                </label>
                <label>
                  <span>Tiers</span>
                  <select value={loadingPointForm.thirdPartyId} onChange={(event) => handleLoadingPointFormChange('thirdPartyId', event)}>
                    <option value="">Non rattache</option>
                    {thirdParties.map((thirdParty) => (
                      <option key={thirdParty.id} value={thirdParty.id}>{thirdParty.displayName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Exploitation</span>
                  <select value={loadingPointForm.exploitationId} onChange={(event) => handleLoadingPointFormChange('exploitationId', event)}>
                    <option value="">Non rattachee</option>
                    {exploitations.map((exploitation) => (
                      <option key={exploitation.id} value={exploitation.id}>{exploitation.code} - {exploitation.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Latitude</span>
                  <input inputMode="decimal" value={loadingPointForm.latitude} onChange={(event) => handleLoadingPointFormChange('latitude', event)} />
                </label>
                <label>
                  <span>Longitude</span>
                  <input inputMode="decimal" value={loadingPointForm.longitude} onChange={(event) => handleLoadingPointFormChange('longitude', event)} />
                </label>
                <label className="toggle-label">
                  <input checked={loadingPointForm.isActive} onChange={handleLoadingPointStatusChange} type="checkbox" />
                  <span>Actif</span>
                </label>
                <label className="settings-form-wide">
                  <span>Notes</span>
                  <textarea value={loadingPointForm.notes} onChange={(event) => handleLoadingPointFormChange('notes', event)} />
                </label>
                <div className="profile-action-row">
                  <button className="primary-button" disabled={loadingPointForm.isSaving} type="submit">
                    {loadingPointForm.isSaving ? 'Enregistrement...' : editingLoadingPoint ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  {loadingPointForm.error ? <small className="account-error">{loadingPointForm.error}</small> : null}
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
      <button
        aria-label="Interroger Nexa"
        className="nexa-floating-button"
        onClick={() => setIsNexaAssistantOpen((isOpen) => !isOpen)}
        title="Interroger Nexa"
        type="button"
      >
        <span aria-hidden="true">N</span>
        <strong>Nexa</strong>
      </button>
    </div>
  )
}

function canAccessModule(accessLevel: string | undefined) {
  return accessLevel === 'Read' || accessLevel === 'Write'
}

function isDashboardModuleCode(moduleCode: string) {
  return Object.values(dashboardModuleByProfileCode).includes(moduleCode)
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
    isSireneValidated: false,
    isSaving: false,
    error: null,
  }
}

function createEmptySireneCompanySearchForm(): SireneCompanySearchFormState {
  return {
    name: '',
    city: '',
    postalCode: '',
    isSearching: false,
    results: [],
    error: null,
  }
}

function buildCompanyFormFromItem(company: CompanyItem): CompanyFormState {
  return {
    siren: company.siren,
    displayName: company.displayName,
    legalName: company.legalName,
    isActive: company.isActive,
    isSireneValidated: true,
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

function buildThirdPartyFormFromItem(thirdParty: ThirdPartyItem): ThirdPartyFormState {
  return {
    typeCode: thirdParty.typeCode,
    displayName: thirdParty.displayName,
    siren: thirdParty.siren ?? '',
    vatNumber: thirdParty.vatNumber ?? '',
    externalReference: thirdParty.externalReference ?? '',
    isForeignCompany: thirdParty.isForeignCompany,
    isActive: thirdParty.isActive,
    analyticIds: thirdParty.analytics.map((analytic) => analytic.analyticId),
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

function buildMaterialFormFromItem(material: MaterialItem): MaterialFormState {
  return {
    fleetNumber: material.fleetNumber,
    label: material.label,
    materialType: material.materialType,
    registrationNumber: material.registrationNumber ?? '',
    sourceSystem: material.sourceSystem ?? 'TruckOnline',
    exploitationId: material.exploitation?.id ?? '',
    isActive: material.isActive,
    isSaving: false,
    error: null,
  }
}

function createEmptyContraventionForm(): ContraventionFormState {
  return {
    noticeNumber: '',
    offenseDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    amount: '',
    statusCode: 'A_TRAITER',
    offenseLabel: '',
    location: '',
    notes: '',
    driverEmployeeId: '',
    materialId: '',
    isSaving: false,
    error: null,
  }
}

function buildContraventionFormFromItem(contravention: ContraventionItem): ContraventionFormState {
  return {
    noticeNumber: contravention.noticeNumber,
    offenseDate: toDateInputValue(contravention.offenseDate),
    dueDate: contravention.dueDate ? toDateInputValue(contravention.dueDate) : '',
    amount: String(contravention.amount),
    statusCode: contravention.statusCode,
    offenseLabel: contravention.offenseLabel,
    location: contravention.location ?? '',
    notes: contravention.notes ?? '',
    driverEmployeeId: contravention.driverEmployee?.id ?? '',
    materialId: contravention.material?.id ?? '',
    isSaving: false,
    error: null,
  }
}

function buildContraventionPayload(form: ContraventionFormState) {
  return {
    noticeNumber: form.noticeNumber.trim(),
    offenseDate: form.offenseDate,
    dueDate: form.dueDate || null,
    amount: Number.parseFloat(form.amount.replace(',', '.')) || 0,
    statusCode: form.statusCode,
    offenseLabel: form.offenseLabel.trim(),
    location: form.location.trim() || null,
    notes: form.notes.trim() || null,
    driverEmployeeId: form.driverEmployeeId || null,
    materialId: form.materialId || null,
  }
}

function toDateInputValue(value: string) {
  return value.slice(0, 10)
}

function createEmptyLoadingPointForm(): LoadingPointFormState {
  return {
    code: '',
    label: '',
    pointTypeCode: 'MIXTE',
    addressLine: '',
    postalCode: '',
    city: '',
    countryCode: 'FR',
    latitude: '',
    longitude: '',
    thirdPartyId: '',
    exploitationId: '',
    isActive: true,
    notes: '',
    isSaving: false,
    error: null,
  }
}

function buildLoadingPointFormFromItem(point: LoadingPointItem): LoadingPointFormState {
  return {
    code: point.code,
    label: point.label,
    pointTypeCode: point.pointTypeCode,
    addressLine: point.addressLine,
    postalCode: point.postalCode,
    city: point.city,
    countryCode: point.countryCode,
    latitude: point.latitude == null ? '' : String(point.latitude),
    longitude: point.longitude == null ? '' : String(point.longitude),
    thirdPartyId: point.thirdParty?.id ?? '',
    exploitationId: point.exploitation?.id ?? '',
    isActive: point.isActive,
    notes: point.notes ?? '',
    isSaving: false,
    error: null,
  }
}

function buildLoadingPointPayload(form: LoadingPointFormState) {
  return {
    code: form.code.trim(),
    label: form.label.trim(),
    pointTypeCode: form.pointTypeCode,
    addressLine: form.addressLine.trim(),
    postalCode: form.postalCode.trim(),
    city: form.city.trim(),
    countryCode: form.countryCode.trim() || 'FR',
    latitude: parseOptionalDecimal(form.latitude),
    longitude: parseOptionalDecimal(form.longitude),
    thirdPartyId: form.thirdPartyId || null,
    exploitationId: form.exploitationId || null,
    isActive: form.isActive,
    notes: form.notes.trim() || null,
  }
}

function parseOptionalDecimal(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) {
    return null
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
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
    detail?: string
    errors?: Record<string, string[]>
  } | null

  const validationMessage = Object.values(payload?.errors ?? {}).flat()[0]
  const problemMessage = [payload?.title, payload?.detail].filter(Boolean).join(' - ')
  return validationMessage ?? (problemMessage || fallback)
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

  if (selectedNavigation === commonDataNavigationLabel) {
    return commonDataNavigationLabel
  }

  if (selectedNavigation === 'Gestion administrative') {
    return 'Gestion administrative'
  }

  return 'Exploitation'
}

function getNavigationIconPaths(entry: string) {
  if (entry === 'Administration') {
    return [
      'M12 3.5 5.5 6.25v4.9c0 4.15 2.58 7.85 6.5 9.35 3.92-1.5 6.5-5.2 6.5-9.35v-4.9L12 3.5Z',
      'M9.2 12.2h5.6M12 9.4V15',
    ]
  }

  if (entry === commonDataNavigationLabel) {
    return [
      'M5.5 7.2c0-1.5 2.9-2.7 6.5-2.7s6.5 1.2 6.5 2.7-2.9 2.7-6.5 2.7-6.5-1.2-6.5-2.7Z',
      'M5.5 7.2v5.1c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7V7.2',
      'M5.5 12.3v4.5c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7v-4.5',
    ]
  }

  if (entry === 'Exploitation') {
    return [
      'M6 18.5c2.8-5.4 4.2-7.8 6-7.8s3.2 2.4 6 7.8',
      'M12 10.7a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z',
      'M4.5 18.5h15',
    ]
  }

  return [
    'M7 4.5h7.2L18 8.3v11.2H7V4.5Z',
    'M14 4.8v4h4',
    'M9.5 13h5',
    'M9.5 16h5',
  ]
}

function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || displayName
}

function getNexaCurrentSection(
  selectedNavigation: string,
  selectedAdministrationSection: string,
  selectedSettingsSection: string,
  selectedToolsSection: string,
  selectedWorkspaceSection: string,
) {
  if (selectedNavigation === 'Administration') {
    return selectedAdministrationSection === 'Outils'
      ? `${selectedAdministrationSection} / ${selectedToolsSection}`
      : selectedAdministrationSection
  }

  if (selectedNavigation === commonDataNavigationLabel) {
    return selectedSettingsSection
  }

  if (selectedNavigation === 'Exploitation' || selectedNavigation === 'Gestion administrative') {
    return selectedWorkspaceSection
  }

  return selectedNavigation
}

function formatSidebarDateTime(value: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function buildSessionInsight(user: AuthenticatedUser) {
  const profileCode = user.profile?.code ?? 'SANS_PROFIL'
  const lastLoginAt = user.lastLoginAtUtc ? new Date(user.lastLoginAtUtc) : null
  const writableModules = user.rights.filter((right) => right.accessLevel === 'Write' && !isDashboardModuleCode(right.moduleCode)).length
  const readableModules = user.rights.filter((right) => canAccessModule(right.accessLevel) && !isDashboardModuleCode(right.moduleCode)).length
  const dashboardCount = user.rights.filter((right) => canAccessModule(right.accessLevel) && isDashboardModuleCode(right.moduleCode)).length
  const hour = new Date().getHours()
  const dayMoment = hour < 11 ? 'ce matin' : hour < 18 ? 'cet apr\u00e8s-midi' : 'ce soir'
  const lastLoginHint = lastLoginAt && !Number.isNaN(lastLoginAt.getTime())
    ? `depuis votre derni\u00e8re connexion du ${lastLoginAt.toLocaleDateString('fr-FR')}`
    : 'pour cette premi\u00e8re session suivie'

  const profileOpenings: Record<string, string[]> = {
    INFORMATIQUE: ['Nexa pr\u00e9pare votre poste de pilotage technique', 'Votre espace de supervision est ouvert', 'Le socle est align\u00e9 pour vos contr\u00f4les'],
    DIRECTION: ['Votre synth\u00e8se de pilotage est pr\u00eate', 'Nexa met en avant les signaux de d\u00e9cision', 'Votre lecture ex\u00e9cutive est assembl\u00e9e'],
    EXPLOITATION: ['Votre cockpit op\u00e9rationnel est pr\u00eat', 'Nexa recentre les priorit\u00e9s terrain', 'Les vues exploitation sont organis\u00e9es'],
    ADMINISTRATIF: ['Votre suivi administratif est disponible', 'Nexa pr\u00e9pare les dossiers utiles', 'Votre espace de traitement est pr\u00eat'],
  }

  const profileFocus: Record<string, string[]> = {
    INFORMATIQUE: ['droits, interfaces et qualit\u00e9 applicative', 'readiness, traces et raccords sensibles', 's\u00e9curit\u00e9, modules et coh\u00e9rence du socle'],
    DIRECTION: ['arbitrages, tendances et points de vigilance', 'vision globale, priorit\u00e9s et trajectoire', 'indicateurs consolid\u00e9s et alertes utiles'],
    EXPLOITATION: ['points, conducteurs, tracteurs et op\u00e9rations', 'parc, terrain et actions \u00e0 suivre', 'flux exploitation et donn\u00e9es \u00e0 fiabiliser'],
    ADMINISTRATIF: ['contraventions, rattachements et traitements', 'dossiers ouverts et contr\u00f4les administratifs', 'suivi documentaire et prochaines actions'],
  }

  const openings = profileOpenings[profileCode] ?? ['Votre environnement Nexus est pr\u00eat', 'Nexa charge votre espace', 'Votre session est personnalis\u00e9e']
  const focuses = profileFocus[profileCode] ?? ['vos espaces accessibles', 'les informations disponibles', 'les actions autoris\u00e9es']
  const rhythms = [
    `${dayMoment}`,
    lastLoginHint,
    `avec ${readableModules} module(s) accessible(s)`,
    dashboardCount > 1 ? `avec ${dashboardCount} tableaux de bord consultables` : 'avec votre tableau de bord principal',
  ]
  const endings = [
    writableModules > 0 ? `${writableModules} zone(s) modifiable(s) sont pr\u00eates.` : 'les vues sont ouvertes en consultation.',
    'les raccourcis essentiels sont d\u00e9j\u00e0 charg\u00e9s.',
    'le bandeau restera votre point de rep\u00e8re pendant la navigation.',
    'les donn\u00e9es visibles suivent vos droits actifs.',
  ]

  return `${pickGeneratedPhrasePart(openings)} pour ${pickGeneratedPhrasePart(focuses)}, ${pickGeneratedPhrasePart(rhythms)}: ${pickGeneratedPhrasePart(endings)}`
}

function pickGeneratedPhrasePart(values: string[]) {
  if (values.length === 0) {
    return ''
  }

  const randomBuffer = new Uint32Array(1)
  crypto.getRandomValues(randomBuffer)
  return values[randomBuffer[0] % values.length]
}
function getWeatherIconDataUri(code: number | null, isDay: boolean, status: ClientWeather['status']) {
  const icon = getWeatherIconKind(code, status)
  const sky = isDay ? '#171b24' : '#05070c'
  const horizon = isDay ? '#080b12' : '#020306'
  const sun = isDay ? '#f7d98a' : '#fff0c9'
  const cloud = '#d8c188'
  const rain = '#9ba8b8'
  const snow = '#fff0c9'
  const stroke = '#04060a'

  const precipitation =
    icon === 'rain'
      ? `<path d="M52 67 47 78M70 67 65 78M88 67 83 78" stroke="${rain}" stroke-width="5" stroke-linecap="round"/>`
      : icon === 'snow'
        ? `<g fill="${snow}"><circle cx="52" cy="74" r="3"/><circle cx="70" cy="78" r="3"/><circle cx="88" cy="74" r="3"/></g>`
        : ''

  const lightning =
    icon === 'storm'
      ? `<path d="M72 63 62 84h12l-7 18 23-28H77l9-11Z" fill="${sun}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
      : ''

  const fog =
    icon === 'fog'
      ? `<g stroke="${cloud}" stroke-width="5" stroke-linecap="round" opacity=".86"><path d="M34 72h78"/><path d="M26 86h72"/><path d="M45 100h65"/></g>`
      : ''

  const celestial =
    icon === 'clear'
      ? `<circle cx="64" cy="54" r="24" fill="${sun}"/><g stroke="${sun}" stroke-width="5" stroke-linecap="round"><path d="M64 14v12"/><path d="M64 82v12"/><path d="M24 54h12"/><path d="M92 54h12"/><path d="m36 26 8 8"/><path d="m84 74 8 8"/><path d="m92 26-8 8"/><path d="m44 74-8 8"/></g>`
      : `<circle cx="53" cy="49" r="20" fill="${sun}" opacity=".95"/>`

  const clouds =
    icon === 'clear'
      ? ''
      : `<path d="M42 75c-10 0-18-7-18-16 0-8 6-15 15-16 4-12 15-20 29-20 16 0 29 11 32 26 11 2 19 11 19 22 0 13-11 23-25 23H42Z" fill="${cloud}" opacity=".96"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${horizon}"/></linearGradient><radialGradient id="a" cx=".25" cy=".2" r=".9"><stop stop-color="#f7d98a" stop-opacity=".22"/><stop offset=".68" stop-color="#f7d98a" stop-opacity="0"/></radialGradient></defs><rect width="128" height="128" rx="28" fill="url(#g)"/><rect width="128" height="128" rx="28" fill="url(#a)"/><rect x="1" y="1" width="126" height="126" rx="27" fill="none" stroke="#f7d98a" stroke-opacity=".24" stroke-width="2"/>${celestial}${clouds}${precipitation}${lightning}${fog}</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function getWeatherIconKind(code: number | null, status: ClientWeather['status']) {
  if (status !== 'ready' || code === null) {
    return 'fog'
  }

  if (code === 0) {
    return 'clear'
  }

  if ([1, 2, 3].includes(code)) {
    return 'cloud'
  }

  if ([45, 48].includes(code)) {
    return 'fog'
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return 'snow'
  }

  if ([95, 96, 99].includes(code)) {
    return 'storm'
  }

  return 'rain'
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

  if (selectedNavigation === commonDataNavigationLabel) {
    return 'Donn\u00e9es Communes: salariés, tiers et matériels partagés par les modules métier.'
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
    case administrationSettingsSection:
      return 'Administrer les paramètres de structure de base.'
    case 'Outils':
      return 'Préparer les futurs outils techniques et de maintenance.'
    default:
      return 'Vue d’ensemble des espaces d’administration.'
  }
}

function getToolsSectionDescription(section: string) {
  switch (section) {
    case toolsApiKeysSection:
      return 'Déclarer et maintenir les accès API par logiciel externe.'
    case toolsScheduledTasksSection:
      return 'Préparer le suivi des traitements planifiés, exécutions et historiques.'
    case toolsSqlSection:
      return 'Préparer un espace de requêtes d’analyse contrôlées.'
    case toolsSessionsSection:
      return 'Utilisateurs connectés, historique des connexions et déconnexion forcée.'
    case toolsTracesSection:
      return 'Préparer la consultation des journaux applicatifs et techniques.'
    case toolsDiagnosticsSection:
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

function formatControlledSqlColumn(column: string) {
  const labels: Record<string, string> = {
    accessLevel: 'Droit',
    code: 'Code',
    displayName: 'Nom',
    hasValue: 'Valeur',
    isSecret: 'Secret',
    keyName: 'Clé',
    label: 'Libellé',
    lastLoginAtUtc: 'Dernière connexion',
    lastSyncedAtUtc: 'Dernière synchro',
    login: 'Login',
    module: 'Module',
    mustChangePassword: 'Mot de passe',
    navigationGroup: 'Groupe',
    parent: 'Rattachement',
    profile: 'Profil',
    profileStatus: 'État profil',
    provider: 'Fournisseur',
    referential: 'Référentiel',
    sessionTimeoutMinutes: 'Expiration',
    status: 'État',
    updatedAtUtc: 'Mise à jour',
  }

  return labels[column] ?? column
}

function formatControlledSqlValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString()
    }
  }

  return value
}

function getSettingsSectionDescription(section: string) {
  switch (section) {
    case settingsCompaniesSection:
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
      return 'Synthèse des données communes.'
  }
}

function getFunctionalModuleBlueprint(moduleCode: string): FunctionalModuleBlueprint {
  switch (moduleCode) {
    case 'CONTRAVENTIONS':
      return {
        intent: 'Suivre les contraventions, leur statut de traitement et les rattachements conducteurs ou vehicules.',
        primaryData: 'Avis, infractions, conducteurs, vehicules, echeances et statuts.',
        nextStep: 'Recetter la creation, les rattachements et les changements de statut.',
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

function buildProfileDashboard(context: {
  profileCode: string
  visibleModules: SecurityModuleItem[]
  accounts: AccountItem[]
  profiles: SecurityProfileItem[]
  employees: EmployeeItem[]
  materials: MaterialItem[]
  thirdParties: ThirdPartyItem[]
  loadingPoints: LoadingPointItem[]
  contraventions: ContraventionItem[]
  driverIndicators: DriverIndicatorsPayload | null
  tractorIndicators: TractorIndicatorsPayload | null
}) {
  const baseMetrics = [
    { label: 'Modules visibles', value: String(context.visibleModules.length), className: 'metric-card-navy' },
    { label: 'Points actifs', value: String(context.loadingPoints.filter((point) => point.isActive).length), className: 'metric-card-champagne' },
    { label: 'Avis ouverts', value: String(context.contraventions.filter((item) => !['PAYEE', 'CLASSEE'].includes(item.statusCode)).length), className: 'metric-card-gold' },
    { label: 'Profil courant', value: context.profileCode.replace('_', ' '), className: 'metric-card-cyan' },
  ]
  const moduleLabel = (code: string, fallback: string) =>
    context.visibleModules.find((module) => module.code === code)?.label ?? fallback

  if (context.profileCode === 'INFORMATIQUE') {
    return {
      eyebrow: 'Tableau de bord Informatique',
      title: 'Pilotage socle, droits et readiness',
      description: 'Priorites: recetter les droits, surveiller les interfaces et verrouiller les outils critiques.',
      accentClass: 'accent-champagne',
      metrics: [
        { label: 'Profils actifs', value: String(context.profiles.filter((profile) => profile.isActive).length), className: 'metric-card-champagne' },
        { label: 'Comptes actifs', value: String(context.accounts.filter((account) => account.isActive).length), className: 'metric-card-gold' },
        { label: 'Salaries', value: String(context.employees.length), className: 'metric-card-navy' },
        { label: 'Materiels', value: String(context.materials.length), className: 'metric-card-cyan' },
      ],
      actions: [
        { navigation: 'Administration', administrationSection: 'Outils', label: 'Outils et diagnostics', detail: 'Readiness, traces, taches planifiees et cles API.' },
        { navigation: 'Administration', administrationSection: 'Comptes utilisateurs', label: 'Comptes', detail: 'Cycle de vie, profils, sessions et resets temporaires.' },
        { navigation: commonDataNavigationLabel, settingsSection: materialSettingsSection, label: 'Referentiel materiels', detail: 'Base locale prete pour TruckOnline et YellowBox.' },
      ],
    }
  }

  if (context.profileCode === 'EXPLOITATION') {
    return {
      eyebrow: 'Tableau de bord Exploitation',
      title: 'Points, conducteurs et tracteurs',
      description: 'Priorites: maintenir les points operationnels, suivre les conducteurs et fiabiliser le parc tracteurs.',
      accentClass: 'accent-green',
      metrics: [
        { label: 'Points actifs', value: String(context.loadingPoints.filter((point) => point.isActive).length), className: 'metric-card-champagne' },
        { label: 'Conducteurs', value: String(context.driverIndicators?.summary.activeDrivers ?? 0), className: 'metric-card-green' },
        { label: 'Tracteurs actifs', value: String(context.tractorIndicators?.summary.activeTractors ?? 0), className: 'metric-card-navy' },
        { label: 'Avis ouverts', value: String(context.contraventions.filter((item) => !['PAYEE', 'CLASSEE'].includes(item.statusCode)).length), className: 'metric-card-gold' },
      ],
      actions: [
        { navigation: 'Exploitation', workspaceSection: moduleLabel(loadingPointsModuleCode, 'Carte des points chargements/dechargements'), label: 'Carte des points', detail: 'Sites, coordonnees et rattachements tiers/exploitations.' },
        { navigation: 'Exploitation', workspaceSection: moduleLabel(driverIndicatorsModuleCode, 'Les indicateurs conducteurs'), label: 'Conducteurs', detail: 'Comptes, qualite des fiches et contraventions rattachees.' },
        { navigation: 'Exploitation', workspaceSection: moduleLabel(tractorIndicatorsModuleCode, 'Les indicateurs des tracteurs'), label: 'Tracteurs', detail: 'Parc, sources TruckOnline/YellowBox et rattachements.' },
      ],
    }
  }

  if (context.profileCode === 'ADMINISTRATIF') {
    return {
      eyebrow: 'Tableau de bord Administratif',
      title: 'Suivi des contraventions',
      description: 'Priorites: traiter les avis ouverts, rattacher conducteurs et materiels, surveiller les echeances.',
      accentClass: 'accent-orange',
      metrics: [
        { label: 'Avis suivis', value: String(context.contraventions.length), className: 'metric-card-gold' },
        { label: 'Avis ouverts', value: String(context.contraventions.filter((item) => !['PAYEE', 'CLASSEE'].includes(item.statusCode)).length), className: 'metric-card-navy' },
        { label: 'Conducteurs', value: String(context.driverIndicators?.summary.activeDrivers ?? 0), className: 'metric-card-green' },
        { label: 'Materiels', value: String(context.materials.length), className: 'metric-card-cyan' },
      ],
      actions: [
        { navigation: 'Gestion administrative', workspaceSection: moduleLabel(contraventionsModuleCode, 'Gestion des contraventions'), label: 'Contraventions', detail: 'Creation, suivi et mise a jour des statuts.' },
      ],
    }
  }

  if (context.profileCode === 'DIRECTION') {
    return {
      eyebrow: 'Tableau de bord Direction',
      title: 'Vue de pilotage transverse',
      description: 'Priorites: lecture des indicateurs exploitation, suivi des avis et qualite des referentiels.',
      accentClass: 'accent-cyan',
      metrics: baseMetrics,
      actions: [
        { navigation: 'Exploitation', workspaceSection: moduleLabel(driverIndicatorsModuleCode, 'Les indicateurs conducteurs'), label: 'Indicateurs conducteurs', detail: 'Lecture des effectifs conducteurs et points de vigilance.' },
        { navigation: 'Exploitation', workspaceSection: moduleLabel(tractorIndicatorsModuleCode, 'Les indicateurs des tracteurs'), label: 'Indicateurs tracteurs', detail: 'Lecture du parc et des raccords TruckOnline/YellowBox.' },
        { navigation: 'Gestion administrative', workspaceSection: moduleLabel(contraventionsModuleCode, 'Gestion des contraventions'), label: 'Contraventions', detail: 'Lecture des avis et des echeances.' },
      ],
    }
  }

  return {
    eyebrow: 'Tableau de bord',
    title: 'Accueil personnalise',
    description: 'Ce compte dispose d une lecture limitee tant qu un profil complet n est pas affecte.',
    accentClass: 'accent-navy',
    metrics: baseMetrics,
    actions: context.visibleModules.slice(0, 3).map((module) => ({
      navigation: module.navigationGroup,
      workspaceSection: module.label,
      label: module.label,
      detail: getFunctionalModuleBlueprint(module.code).intent,
    })),
  }
}

export default App
