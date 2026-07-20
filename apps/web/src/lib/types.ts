export type Role = 'ADMIN' | 'GOVERNANCE_LEAD' | 'MEMBER' | 'AUDITOR';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationInput {
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface RegisterInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  isActive?: boolean;
}

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export type GovernanceStage =
  | 'INITIATION'
  | 'PLANNING'
  | 'EXECUTION'
  | 'MONITORING'
  | 'CLOSURE';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  governanceStage: GovernanceStage;
  metadata: Record<string, string> | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
  status?: ProjectStatus;
  governanceStage?: GovernanceStage;
  metadata?: Record<string, string>;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  projectId: string | null;
  project: { id: string; name: string } | null;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditChainVerification {
  valid: boolean;
  checked: number;
  brokenAtId: string | null;
}

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLikelihood = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';

export interface Risk {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: RiskSeverity;
  likelihood: RiskLikelihood;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRiskInput {
  projectId: string;
  title: string;
  description?: string;
  severity: RiskSeverity;
  likelihood: RiskLikelihood;
}

export interface UpdateRiskInput {
  title?: string;
  description?: string;
  severity?: RiskSeverity;
  likelihood?: RiskLikelihood;
  status?: RiskStatus;
}

export interface Decision {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  context: string | null;
  decision: string;
  decidedById: string;
  decidedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDecisionInput {
  projectId: string;
  title: string;
  context?: string;
  decision: string;
}

export interface UpdateDecisionInput {
  title?: string;
  context?: string;
  decision?: string;
}

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Issue {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueInput {
  projectId: string;
  title: string;
  description?: string;
  priority: IssuePriority;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
}

export type ChangeRequestStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED';

export interface ChangeRequest {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: ChangeRequestStatus;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestInput {
  projectId: string;
  title: string;
  description?: string;
}

export interface UpdateChangeRequestInput {
  title?: string;
  description?: string;
  status?: ChangeRequestStatus;
}

export type RequirementStatus = 'DRAFT' | 'APPROVED' | 'IMPLEMENTED';

export interface Requirement {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequirementInput {
  projectId: string;
  title: string;
  description?: string;
}

export interface UpdateRequirementInput {
  title?: string;
  description?: string;
  status?: RequirementStatus;
}

export type ReviewType = 'ARCHITECTURE' | 'SECURITY' | 'PERFORMANCE';
export type ReviewStatus = 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface Review {
  id: string;
  organizationId: string;
  projectId: string;
  type: ReviewType;
  title: string;
  description: string | null;
  status: ReviewStatus;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  projectId: string;
  type: ReviewType;
  title: string;
  description?: string;
}

export interface UpdateReviewInput {
  title?: string;
  description?: string;
  status?: ReviewStatus;
}

export interface ChecklistItem {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistItemInput {
  projectId: string;
  title: string;
}

export interface UpdateChecklistItemInput {
  title?: string;
  isDone?: boolean;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  parentId?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  parentId?: string;
}

export interface Sop {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSopInput {
  title: string;
  category: string;
  content: string;
}

export interface UpdateSopInput {
  title?: string;
  category?: string;
  content?: string;
}

export interface Document {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  url: string;
  storageKey: string | null;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  projectId: string;
  title: string;
  url: string;
  version?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  url?: string;
  version?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  url: string;
  storageKey: string | null;
  createdAt: string;
}

export type GateCategory = 'DEVELOPMENT' | 'TESTING';

export interface GovernanceGate {
  id: string;
  organizationId: string;
  projectId: string;
  category: GateCategory;
  title: string;
  isMet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGovernanceGateInput {
  projectId: string;
  category: GateCategory;
  title: string;
}

export interface UpdateGovernanceGateInput {
  title?: string;
  isMet?: boolean;
}

export type SignoffStatus = 'PENDING' | 'RECEIVED' | 'DECLINED';

export interface CustomerSignoff {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  customerName: string;
  status: SignoffStatus;
  requestedById: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerSignoffInput {
  projectId: string;
  title: string;
  customerName: string;
}

export interface UpdateCustomerSignoffInput {
  title?: string;
  customerName?: string;
  status?: SignoffStatus;
  notes?: string;
}

export type DeploymentStatus = 'REQUESTED' | 'APPROVED' | 'BLOCKED';

export interface DeploymentApproval {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  status: DeploymentStatus;
  requestedById: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeploymentApprovalInput {
  projectId: string;
  title: string;
  notes?: string;
}

export interface UpdateDeploymentApprovalInput {
  title?: string;
  status?: DeploymentStatus;
  notes?: string;
}

export interface Notification {
  id: string;
  organizationId: string;
  projectId: string | null;
  recipientId: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeArticleInput {
  title: string;
  category: string;
  tags?: string[];
  content: string;
}

export interface UpdateKnowledgeArticleInput {
  title?: string;
  category?: string;
  tags?: string[];
  content?: string;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  projectId: string | null;
  snippet: string | null;
}

export type WebhookProvider = 'SLACK' | 'TEAMS';

export interface WebhookConnector {
  id: string;
  organizationId: string;
  name: string;
  provider: WebhookProvider;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookConnectorInput {
  name: string;
  provider: WebhookProvider;
  url: string;
}

export interface UpdateWebhookConnectorInput {
  name?: string;
  url?: string;
  isActive?: boolean;
}

export interface PluginManifest {
  id: string;
  organizationId: string;
  name: string;
  version: string;
  description: string | null;
  manifest: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePluginManifestInput {
  name: string;
  version: string;
  description?: string;
  manifest: Record<string, unknown>;
}

export interface UpdatePluginManifestInput {
  name?: string;
  version?: string;
  description?: string;
  manifest?: Record<string, unknown>;
  isEnabled?: boolean;
}

export type SecurityFindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityFindingStatus =
  | 'OPEN'
  | 'IN_REMEDIATION'
  | 'RESOLVED'
  | 'ACCEPTED_RISK';

export interface SecurityFinding {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: SecurityFindingSeverity;
  status: SecurityFindingStatus;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecurityFindingInput {
  projectId: string;
  title: string;
  description?: string;
  severity: SecurityFindingSeverity;
}

export interface UpdateSecurityFindingInput {
  title?: string;
  description?: string;
  severity?: SecurityFindingSeverity;
  status?: SecurityFindingStatus;
}

export interface RequirementAnalysis {
  requirementId: string;
  title: string;
  flags: string[];
}

export type ProjectHealthBand = 'HEALTHY' | 'AT_RISK' | 'CRITICAL';

export interface ProjectHealthScore {
  projectId: string;
  score: number;
  band: ProjectHealthBand;
  signals: {
    openHighCriticalRisks: number;
    unresolvedHighCriticalIssues: number;
    unmetGovernanceGates: number;
    pendingCustomerSignoffs: number;
    blockedDeployments: number;
  };
}

export interface AuditSummary {
  totalActions: number;
  byAction: Record<string, number>;
}

export interface AdoptionCounts {
  total: number;
  last30Days: number;
}

export interface AnalyticsOverview {
  governanceHealth: {
    averageScore: number;
    healthy: number;
    atRisk: number;
    critical: number;
  };
  auditReadiness: {
    gateCompletionRate: number;
    signoffCompletionRate: number;
  };
  adoption: Record<string, AdoptionCounts>;
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  title: string;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  items: ChecklistTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistTemplateInput {
  name: string;
  description?: string;
  items: string[];
}

export interface UpdateChecklistTemplateInput {
  name?: string;
  description?: string;
  items?: string[];
}

export interface EmailLog {
  id: string;
  organizationId: string;
  projectId: string | null;
  recipientEmail: string;
  subject: string;
  body: string;
  createdAt: string;
}

export type ExternalReferenceProvider =
  | 'JIRA'
  | 'AZURE_DEVOPS'
  | 'SHAREPOINT'
  | 'SERVICENOW';

export interface ExternalReference {
  id: string;
  organizationId: string;
  issueId: string;
  provider: ExternalReferenceProvider;
  externalId: string;
  url: string;
  createdAt: string;
}

export interface CreateExternalReferenceInput {
  issueId: string;
  provider: ExternalReferenceProvider;
  externalId: string;
  url: string;
}
