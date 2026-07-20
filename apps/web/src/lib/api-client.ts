import type {
  AnalyticsOverview,
  AuditChainVerification,
  AuditLogEntry,
  AuditSummary,
  AuthResponse,
  ChangeRequest,
  ChecklistItem,
  ChecklistTemplate,
  CreateChangeRequestInput,
  CreateChecklistItemInput,
  CreateChecklistTemplateInput,
  CreateCustomerSignoffInput,
  CreateDecisionInput,
  CreateDepartmentInput,
  CreateDeploymentApprovalInput,
  CreateDocumentInput,
  CreateExternalReferenceInput,
  CreateGovernanceGateInput,
  CreateIssueInput,
  CreateKnowledgeArticleInput,
  CreatePluginManifestInput,
  CreateProjectInput,
  CreateRequirementInput,
  CreateReviewInput,
  CreateRiskInput,
  CreateSecurityFindingInput,
  CreateSopInput,
  CreateUserInput,
  CreateWebhookConnectorInput,
  CustomerSignoff,
  Decision,
  Department,
  DeploymentApproval,
  Document,
  DocumentVersion,
  EmailLog,
  ExternalReference,
  GovernanceGate,
  Issue,
  KnowledgeArticle,
  LoginInput,
  Notification,
  Organization,
  PluginManifest,
  Project,
  ProjectHealthScore,
  PublicUser,
  RegisterInput,
  Requirement,
  RequirementAnalysis,
  Review,
  Risk,
  SearchResult,
  SecurityFinding,
  Sop,
  UpdateChangeRequestInput,
  UpdateChecklistItemInput,
  UpdateChecklistTemplateInput,
  UpdateCustomerSignoffInput,
  UpdateDecisionInput,
  UpdateDepartmentInput,
  UpdateDeploymentApprovalInput,
  UpdateDocumentInput,
  UpdateGovernanceGateInput,
  UpdateIssueInput,
  UpdateKnowledgeArticleInput,
  UpdateOrganizationInput,
  UpdatePluginManifestInput,
  UpdateProjectInput,
  UpdateRequirementInput,
  UpdateReviewInput,
  UpdateRiskInput,
  UpdateSecurityFindingInput,
  UpdateSopInput,
  UpdateUserInput,
  UpdateWebhookConnectorInput,
  WebhookConnector,
} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  message?: string | string[];
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body: ErrorBody = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? response.statusText);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  register: (data: RegisterInput) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginInput) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) => request<PublicUser>('/auth/me', {}, token),

  getMyOrganization: (token: string) =>
    request<Organization>('/organizations/me', {}, token),

  listUsers: (token: string) => request<PublicUser[]>('/users', {}, token),

  createUser: (token: string, data: CreateUserInput) =>
    request<PublicUser>(
      '/users',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateUser: (token: string, id: string, data: UpdateUserInput) =>
    request<PublicUser>(
      `/users/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listProjects: (token: string) => request<Project[]>('/projects', {}, token),

  getProject: (token: string, id: string) =>
    request<Project>(`/projects/${id}`, {}, token),

  createProject: (token: string, data: CreateProjectInput) =>
    request<Project>(
      '/projects',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateProject: (token: string, id: string, data: UpdateProjectInput) =>
    request<Project>(
      `/projects/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listAuditLogs: (token: string) =>
    request<AuditLogEntry[]>('/audit-logs', {}, token),

  verifyAuditChain: (token: string) =>
    request<AuditChainVerification>('/audit-logs/verify', {}, token),

  listRisks: (token: string, projectId: string) =>
    request<Risk[]>(`/risks?projectId=${projectId}`, {}, token),

  createRisk: (token: string, data: CreateRiskInput) =>
    request<Risk>(
      '/risks',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateRisk: (token: string, id: string, data: UpdateRiskInput) =>
    request<Risk>(
      `/risks/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listDecisions: (token: string, projectId: string) =>
    request<Decision[]>(`/decisions?projectId=${projectId}`, {}, token),

  createDecision: (token: string, data: CreateDecisionInput) =>
    request<Decision>(
      '/decisions',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateDecision: (token: string, id: string, data: UpdateDecisionInput) =>
    request<Decision>(
      `/decisions/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listIssues: (token: string, projectId: string) =>
    request<Issue[]>(`/issues?projectId=${projectId}`, {}, token),

  createIssue: (token: string, data: CreateIssueInput) =>
    request<Issue>(
      '/issues',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateIssue: (token: string, id: string, data: UpdateIssueInput) =>
    request<Issue>(
      `/issues/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listChangeRequests: (token: string, projectId: string) =>
    request<ChangeRequest[]>(
      `/change-requests?projectId=${projectId}`,
      {},
      token,
    ),

  createChangeRequest: (token: string, data: CreateChangeRequestInput) =>
    request<ChangeRequest>(
      '/change-requests',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateChangeRequest: (
    token: string,
    id: string,
    data: UpdateChangeRequestInput,
  ) =>
    request<ChangeRequest>(
      `/change-requests/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listRequirements: (token: string, projectId: string) =>
    request<Requirement[]>(`/requirements?projectId=${projectId}`, {}, token),

  createRequirement: (token: string, data: CreateRequirementInput) =>
    request<Requirement>(
      '/requirements',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateRequirement: (
    token: string,
    id: string,
    data: UpdateRequirementInput,
  ) =>
    request<Requirement>(
      `/requirements/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listReviews: (token: string, projectId: string) =>
    request<Review[]>(`/reviews?projectId=${projectId}`, {}, token),

  createReview: (token: string, data: CreateReviewInput) =>
    request<Review>(
      '/reviews',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateReview: (token: string, id: string, data: UpdateReviewInput) =>
    request<Review>(
      `/reviews/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listChecklistItems: (token: string, projectId: string) =>
    request<ChecklistItem[]>(
      `/checklist-items?projectId=${projectId}`,
      {},
      token,
    ),

  createChecklistItem: (token: string, data: CreateChecklistItemInput) =>
    request<ChecklistItem>(
      '/checklist-items',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateChecklistItem: (
    token: string,
    id: string,
    data: UpdateChecklistItemInput,
  ) =>
    request<ChecklistItem>(
      `/checklist-items/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listDepartments: (token: string) =>
    request<Department[]>('/departments', {}, token),

  createDepartment: (token: string, data: CreateDepartmentInput) =>
    request<Department>(
      '/departments',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateDepartment: (token: string, id: string, data: UpdateDepartmentInput) =>
    request<Department>(
      `/departments/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listSops: (token: string, category?: string) =>
    request<Sop[]>(
      category ? `/sops?category=${encodeURIComponent(category)}` : '/sops',
      {},
      token,
    ),

  createSop: (token: string, data: CreateSopInput) =>
    request<Sop>(
      '/sops',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateSop: (token: string, id: string, data: UpdateSopInput) =>
    request<Sop>(
      `/sops/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listDocuments: (token: string, projectId: string) =>
    request<Document[]>(`/documents?projectId=${projectId}`, {}, token),

  createDocument: (token: string, data: CreateDocumentInput) =>
    request<Document>(
      '/documents',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateDocument: (token: string, id: string, data: UpdateDocumentInput) =>
    request<Document>(
      `/documents/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listDocumentVersions: (token: string, id: string) =>
    request<DocumentVersion[]>(`/documents/${id}/versions`, {}, token),

  reuploadDocument: async (
    token: string,
    id: string,
    data: { version?: string; file: File },
  ): Promise<Document> => {
    const form = new FormData();
    if (data.version) form.append('version', data.version);
    form.append('file', data.file);

    const response = await fetch(`${API_URL}/documents/${id}/reupload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!response.ok) {
      const body: { message?: string | string[] } = await response
        .json()
        .catch(() => ({}));
      const message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? response.statusText);
      throw new ApiError(response.status, message);
    }
    return (await response.json()) as Document;
  },

  listGovernanceGates: (token: string, projectId: string) =>
    request<GovernanceGate[]>(
      `/governance-gates?projectId=${projectId}`,
      {},
      token,
    ),

  createGovernanceGate: (token: string, data: CreateGovernanceGateInput) =>
    request<GovernanceGate>(
      '/governance-gates',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateGovernanceGate: (
    token: string,
    id: string,
    data: UpdateGovernanceGateInput,
  ) =>
    request<GovernanceGate>(
      `/governance-gates/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listCustomerSignoffs: (token: string, projectId: string) =>
    request<CustomerSignoff[]>(
      `/customer-signoffs?projectId=${projectId}`,
      {},
      token,
    ),

  createCustomerSignoff: (token: string, data: CreateCustomerSignoffInput) =>
    request<CustomerSignoff>(
      '/customer-signoffs',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateCustomerSignoff: (
    token: string,
    id: string,
    data: UpdateCustomerSignoffInput,
  ) =>
    request<CustomerSignoff>(
      `/customer-signoffs/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  updateOrganization: (token: string, data: UpdateOrganizationInput) =>
    request<Organization>(
      '/organizations/me',
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listDeploymentApprovals: (token: string, projectId: string) =>
    request<DeploymentApproval[]>(
      `/deployment-approvals?projectId=${projectId}`,
      {},
      token,
    ),

  createDeploymentApproval: (
    token: string,
    data: CreateDeploymentApprovalInput,
  ) =>
    request<DeploymentApproval>(
      '/deployment-approvals',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateDeploymentApproval: (
    token: string,
    id: string,
    data: UpdateDeploymentApprovalInput,
  ) =>
    request<DeploymentApproval>(
      `/deployment-approvals/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listMyNotifications: (token: string, unreadOnly?: boolean) =>
    request<Notification[]>(
      unreadOnly ? '/notifications?unread=true' : '/notifications',
      {},
      token,
    ),

  markNotificationRead: (token: string, id: string) =>
    request<Notification>(
      `/notifications/${id}`,
      { method: 'PATCH' },
      token,
    ),

  markAllNotificationsRead: (token: string) =>
    request<{ success: boolean }>(
      '/notifications/read-all',
      { method: 'PATCH' },
      token,
    ),

  listKnowledgeArticles: (token: string, category?: string) =>
    request<KnowledgeArticle[]>(
      category
        ? `/knowledge-articles?category=${encodeURIComponent(category)}`
        : '/knowledge-articles',
      {},
      token,
    ),

  createKnowledgeArticle: (token: string, data: CreateKnowledgeArticleInput) =>
    request<KnowledgeArticle>(
      '/knowledge-articles',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateKnowledgeArticle: (
    token: string,
    id: string,
    data: UpdateKnowledgeArticleInput,
  ) =>
    request<KnowledgeArticle>(
      `/knowledge-articles/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  search: (token: string, q: string) =>
    request<SearchResult[]>(
      `/search?q=${encodeURIComponent(q)}`,
      {},
      token,
    ),

  listWebhookConnectors: (token: string) =>
    request<WebhookConnector[]>('/webhook-connectors', {}, token),

  createWebhookConnector: (token: string, data: CreateWebhookConnectorInput) =>
    request<WebhookConnector>(
      '/webhook-connectors',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateWebhookConnector: (
    token: string,
    id: string,
    data: UpdateWebhookConnectorInput,
  ) =>
    request<WebhookConnector>(
      `/webhook-connectors/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listPlugins: (token: string) =>
    request<PluginManifest[]>('/plugins', {}, token),

  createPlugin: (token: string, data: CreatePluginManifestInput) =>
    request<PluginManifest>(
      '/plugins',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updatePlugin: (token: string, id: string, data: UpdatePluginManifestInput) =>
    request<PluginManifest>(
      `/plugins/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  listSecurityFindings: (token: string, projectId: string) =>
    request<SecurityFinding[]>(
      `/security-findings?projectId=${projectId}`,
      {},
      token,
    ),

  createSecurityFinding: (token: string, data: CreateSecurityFindingInput) =>
    request<SecurityFinding>(
      '/security-findings',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateSecurityFinding: (
    token: string,
    id: string,
    data: UpdateSecurityFindingInput,
  ) =>
    request<SecurityFinding>(
      `/security-findings/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  analyzeRequirements: (token: string, projectId: string) =>
    request<RequirementAnalysis[]>(
      `/requirements/analysis?projectId=${projectId}`,
      {},
      token,
    ),

  getProjectHealthScore: (token: string, projectId: string) =>
    request<ProjectHealthScore>(
      `/projects/${projectId}/health-score`,
      {},
      token,
    ),

  getAuditSummary: (token: string, projectId?: string) =>
    request<AuditSummary>(
      projectId
        ? `/audit-logs/summary?projectId=${projectId}`
        : '/audit-logs/summary',
      {},
      token,
    ),

  getAnalyticsOverview: (token: string) =>
    request<AnalyticsOverview>('/analytics/overview', {}, token),

  exportOrganizationData: (token: string) =>
    request<Record<string, unknown>>('/organizations/me/export', {}, token),

  listChecklistTemplates: (token: string) =>
    request<ChecklistTemplate[]>('/checklist-templates', {}, token),

  createChecklistTemplate: (token: string, data: CreateChecklistTemplateInput) =>
    request<ChecklistTemplate>(
      '/checklist-templates',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  updateChecklistTemplate: (
    token: string,
    id: string,
    data: UpdateChecklistTemplateInput,
  ) =>
    request<ChecklistTemplate>(
      `/checklist-templates/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      token,
    ),

  applyChecklistTemplate: (token: string, id: string, projectId: string) =>
    request<ChecklistItem[]>(
      `/checklist-templates/${id}/apply`,
      { method: 'POST', body: JSON.stringify({ projectId }) },
      token,
    ),

  uploadDocument: async (
    token: string,
    data: { projectId: string; title: string; version?: string; file: File },
  ): Promise<Document> => {
    const form = new FormData();
    form.append('projectId', data.projectId);
    form.append('title', data.title);
    if (data.version) form.append('version', data.version);
    form.append('file', data.file);

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!response.ok) {
      const body: { message?: string | string[] } = await response
        .json()
        .catch(() => ({}));
      const message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? response.statusText);
      throw new ApiError(response.status, message);
    }
    return (await response.json()) as Document;
  },

  listEmailLogs: (token: string, projectId?: string) =>
    request<EmailLog[]>(
      projectId ? `/email-logs?projectId=${projectId}` : '/email-logs',
      {},
      token,
    ),

  listExternalReferences: (token: string, issueId: string) =>
    request<ExternalReference[]>(
      `/external-references?issueId=${issueId}`,
      {},
      token,
    ),

  createExternalReference: (
    token: string,
    data: CreateExternalReferenceInput,
  ) =>
    request<ExternalReference>(
      '/external-references',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  deleteExternalReference: (token: string, id: string) =>
    request<void>(
      `/external-references/${id}`,
      { method: 'DELETE' },
      token,
    ),
};
