/** Minimal shapes for asserting on supertest response bodies in integration tests. */

export interface PublicUserBody {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  isActive: boolean;
}

export interface AuthResponseBody {
  accessToken: string;
  user: PublicUserBody;
}

export interface ProjectBody {
  id: string;
  name: string;
  status: string;
  governanceStage: string;
  organizationId: string;
}

export interface AuditLogBody {
  id: string;
  organizationId: string;
  projectId: string | null;
  project: { id: string; name: string } | null;
  actorId: string;
  action: string;
  metadata: unknown;
  createdAt: string;
}

export interface RiskBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  severity: string;
  likelihood: string;
  status: string;
}

export interface DecisionBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  context: string | null;
  decision: string;
  decidedById: string;
  decidedAt: string;
}

export interface IssueBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  priority: string;
  status: string;
}

export interface ChangeRequestBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  status: string;
  requestedById: string;
}

export interface RequirementBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  status: string;
}

export interface ReviewBody {
  id: string;
  organizationId: string;
  projectId: string;
  type: string;
  title: string;
  status: string;
  requestedById: string;
}

export interface ChecklistItemBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  isDone: boolean;
}

export interface DepartmentBody {
  id: string;
  organizationId: string;
  name: string;
  parentId: string | null;
}

export interface SopBody {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  content: string;
}

export interface DocumentBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  url: string;
  version: string;
}

export interface GovernanceGateBody {
  id: string;
  organizationId: string;
  projectId: string;
  category: string;
  title: string;
  isMet: boolean;
}

export interface CustomerSignoffBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  customerName: string;
  status: string;
}

export interface DeploymentApprovalBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  status: string;
  requestedById: string;
  notes: string | null;
}

export interface NotificationBody {
  id: string;
  organizationId: string;
  projectId: string | null;
  recipientId: string;
  title: string;
  body: string | null;
  isRead: boolean;
}

export interface KnowledgeArticleBody {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
}

export interface SearchResultBody {
  type: string;
  id: string;
  title: string;
  projectId: string | null;
  snippet: string | null;
}

export interface WebhookConnectorBody {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  isActive: boolean;
}

export interface PluginManifestBody {
  id: string;
  organizationId: string;
  name: string;
  version: string;
  isEnabled: boolean;
}

export interface SecurityFindingBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  severity: string;
  status: string;
}

export interface RequirementAnalysisBody {
  requirementId: string;
  title: string;
  flags: string[];
}

export interface ProjectHealthScoreBody {
  projectId: string;
  score: number;
  band: string;
  signals: Record<string, number>;
}

export interface AuditSummaryBody {
  totalActions: number;
  byAction: Record<string, number>;
}

export interface AnalyticsOverviewBody {
  governanceHealth: {
    averageScore: number;
    healthy: number;
    atRisk: number;
    critical: number;
  };
  auditReadiness: { gateCompletionRate: number; signoffCompletionRate: number };
  adoption: Record<string, { total: number; last30Days: number }>;
}

export interface ChecklistTemplateItemBody {
  id: string;
  templateId: string;
  title: string;
  order: number;
}

export interface ChecklistTemplateBody {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  items: ChecklistTemplateItemBody[];
}

export interface DocumentUploadBody {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  url: string;
  storageKey: string | null;
  version: string;
}

export interface EmailLogBody {
  id: string;
  organizationId: string;
  projectId: string | null;
  recipientEmail: string;
  subject: string;
  body: string;
}
