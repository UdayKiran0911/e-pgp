'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { HistoryOutlined, LinkOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, API_URL } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type {
  ChangeRequest,
  ChangeRequestStatus,
  ChecklistItem,
  CreateChangeRequestInput,
  CreateChecklistItemInput,
  CreateCustomerSignoffInput,
  CreateDecisionInput,
  CreateDeploymentApprovalInput,
  CreateDocumentInput,
  CreateExternalReferenceInput,
  CreateGovernanceGateInput,
  CreateIssueInput,
  CreateRequirementInput,
  CreateReviewInput,
  CreateRiskInput,
  CreateSecurityFindingInput,
  CustomerSignoff,
  Decision,
  DeploymentApproval,
  DeploymentStatus,
  Document,
  DocumentVersion,
  ExternalReference,
  ExternalReferenceProvider,
  GateCategory,
  GovernanceGate,
  Issue,
  IssuePriority,
  IssueStatus,
  Project,
  ProjectHealthScore,
  ProjectStatus,
  Requirement,
  RequirementAnalysis,
  RequirementStatus,
  Review,
  ReviewStatus,
  ReviewType,
  Risk,
  RiskLikelihood,
  RiskSeverity,
  RiskStatus,
  SecurityFinding,
  SecurityFindingSeverity,
  SecurityFindingStatus,
  ChecklistTemplate,
  SignoffStatus,
} from '@/lib/types';

const { Text } = Typography;

const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  DRAFT: semanticColor.textSecondary,
  ACTIVE: semanticColor.success,
  ON_HOLD: semanticColor.warning,
  COMPLETED: semanticColor.brand,
  ARCHIVED: semanticColor.textDisabled,
};

const SEVERITY_COLOR: Record<RiskSeverity, string> = {
  LOW: semanticColor.success,
  MEDIUM: semanticColor.warning,
  HIGH: semanticColor.danger,
  CRITICAL: semanticColor.danger,
};

const LIKELIHOOD_COLOR: Record<RiskLikelihood, string> = {
  LOW: semanticColor.success,
  MEDIUM: semanticColor.warning,
  HIGH: semanticColor.danger,
};

const STATUS_COLOR: Record<RiskStatus, string> = {
  OPEN: semanticColor.danger,
  MITIGATED: semanticColor.warning,
  ACCEPTED: semanticColor.brand,
  CLOSED: semanticColor.textDisabled,
};

const RISK_STATUSES: RiskStatus[] = ['OPEN', 'MITIGATED', 'ACCEPTED', 'CLOSED'];

const PRIORITY_COLOR: Record<IssuePriority, string> = {
  LOW: semanticColor.success,
  MEDIUM: semanticColor.warning,
  HIGH: semanticColor.danger,
  CRITICAL: semanticColor.danger,
};

const ISSUE_STATUS_COLOR: Record<IssueStatus, string> = {
  OPEN: semanticColor.danger,
  IN_PROGRESS: semanticColor.warning,
  RESOLVED: semanticColor.brand,
  CLOSED: semanticColor.textDisabled,
};

const ISSUE_STATUSES: IssueStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

const CHANGE_REQUEST_STATUS_COLOR: Record<ChangeRequestStatus, string> = {
  SUBMITTED: semanticColor.textSecondary,
  APPROVED: semanticColor.success,
  REJECTED: semanticColor.danger,
  IMPLEMENTED: semanticColor.brand,
};

// Mirrors the backend's approval workflow
// (apps/api/src/change-requests/change-request-status.ts) — a submitted
// request must be decided before it can move any further.
const CHANGE_REQUEST_ALLOWED_TRANSITIONS: Record<
  ChangeRequestStatus,
  ChangeRequestStatus[]
> = {
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['IMPLEMENTED'],
  REJECTED: [],
  IMPLEMENTED: [],
};

const REQUIREMENT_STATUS_COLOR: Record<RequirementStatus, string> = {
  DRAFT: semanticColor.textSecondary,
  APPROVED: semanticColor.success,
  IMPLEMENTED: semanticColor.brand,
};

const REQUIREMENT_STATUSES: RequirementStatus[] = [
  'DRAFT',
  'APPROVED',
  'IMPLEMENTED',
];

const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  ARCHITECTURE: 'Architecture',
  SECURITY: 'Security',
  PERFORMANCE: 'Performance',
};

const REVIEW_STATUS_COLOR: Record<ReviewStatus, string> = {
  SUBMITTED: semanticColor.textSecondary,
  APPROVED: semanticColor.success,
  CHANGES_REQUESTED: semanticColor.warning,
};

// Mirrors the backend's approval workflow (apps/api/src/reviews/review-status.ts).
const REVIEW_ALLOWED_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  SUBMITTED: ['APPROVED', 'CHANGES_REQUESTED'],
  CHANGES_REQUESTED: ['SUBMITTED'],
  APPROVED: [],
};

const GATE_CATEGORY_LABEL: Record<GateCategory, string> = {
  DEVELOPMENT: 'Development',
  TESTING: 'Testing',
};

const SIGNOFF_STATUS_COLOR: Record<SignoffStatus, string> = {
  PENDING: semanticColor.textSecondary,
  RECEIVED: semanticColor.success,
  DECLINED: semanticColor.danger,
};

const SIGNOFF_STATUSES: SignoffStatus[] = ['PENDING', 'RECEIVED', 'DECLINED'];

const DEPLOYMENT_STATUS_COLOR: Record<DeploymentStatus, string> = {
  REQUESTED: semanticColor.textSecondary,
  APPROVED: semanticColor.success,
  BLOCKED: semanticColor.danger,
};

// Mirrors the backend's approval workflow
// (apps/api/src/deployment-approvals/deployment-status.ts).
const DEPLOYMENT_ALLOWED_TRANSITIONS: Record<DeploymentStatus, DeploymentStatus[]> = {
  REQUESTED: ['APPROVED', 'BLOCKED'],
  BLOCKED: ['REQUESTED'],
  APPROVED: [],
};

const FINDING_SEVERITY_COLOR: Record<SecurityFindingSeverity, string> = {
  LOW: semanticColor.success,
  MEDIUM: semanticColor.warning,
  HIGH: semanticColor.danger,
  CRITICAL: semanticColor.danger,
};

const FINDING_STATUS_COLOR: Record<SecurityFindingStatus, string> = {
  OPEN: semanticColor.danger,
  IN_REMEDIATION: semanticColor.warning,
  RESOLVED: semanticColor.brand,
  ACCEPTED_RISK: semanticColor.textDisabled,
};

const FINDING_STATUSES: SecurityFindingStatus[] = [
  'OPEN',
  'IN_REMEDIATION',
  'RESOLVED',
  'ACCEPTED_RISK',
];

const HEALTH_BAND_COLOR: Record<string, string> = {
  HEALTHY: semanticColor.success,
  AT_RISK: semanticColor.warning,
  CRITICAL: semanticColor.danger,
};

const REQUIREMENT_FLAG_LABEL: Record<string, string> = {
  MISSING_DESCRIPTION: 'Missing description',
  TITLE_TOO_SHORT: 'Title too short',
  DUPLICATE_TITLE: 'Duplicate title',
  STALE_DRAFT: 'Stale draft',
};

// Registers shown as tabs on a project's detail page. Each new register
// module should add one entry here rather than a new stacked <Card> —
// keeps the page a fixed height instead of growing forever as more
// modules ship. As the register count grew past 10, they're grouped into
// a handful of top-level categories (see REGISTER_CATEGORY) rather than
// left as one flat row of tabs.
type RegisterKey =
  | 'risks'
  | 'decisions'
  | 'issues'
  | 'checklist'
  | 'securityFindings'
  | 'requirements'
  | 'reviews'
  | 'changeRequests'
  | 'governanceGates'
  | 'deploymentApprovals'
  | 'documents'
  | 'customerSignoffs';

type CategoryKey = 'planning' | 'governance' | 'documents';

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  planning: 'Planning & Tracking',
  governance: 'Governance & Reviews',
  documents: 'Documents & Sign-off',
};

const CATEGORY_REGISTERS: Record<CategoryKey, RegisterKey[]> = {
  planning: ['risks', 'decisions', 'issues', 'checklist', 'securityFindings'],
  governance: [
    'requirements',
    'reviews',
    'changeRequests',
    'governanceGates',
    'deploymentApprovals',
  ],
  documents: ['documents', 'customerSignoffs'],
};

const REGISTER_CATEGORY: Record<RegisterKey, CategoryKey> = {
  risks: 'planning',
  decisions: 'planning',
  issues: 'planning',
  checklist: 'planning',
  securityFindings: 'planning',
  requirements: 'governance',
  reviews: 'governance',
  changeRequests: 'governance',
  governanceGates: 'governance',
  deploymentApprovals: 'governance',
  documents: 'documents',
  customerSignoffs: 'documents',
};

const REGISTER_ADD_LABEL: Record<RegisterKey, string> = {
  risks: 'Add risk',
  decisions: 'Add decision',
  issues: 'Add issue',
  changeRequests: 'Submit change request',
  requirements: 'Add requirement',
  reviews: 'Submit review',
  checklist: 'Add checklist item',
  documents: 'Add document',
  governanceGates: 'Add gate',
  deploymentApprovals: 'Request deployment approval',
  customerSignoffs: 'Request sign-off',
  securityFindings: 'Log finding',
};

// Registers anyone can submit to — the RBAC gate is on the decision, not
// the submission. Everything else is write-gated to canManage.
const SELF_SERVE_REGISTERS: RegisterKey[] = [
  'changeRequests',
  'reviews',
  'deploymentApprovals',
];

async function fetchProjectData(token: string, projectId: string) {
  const [
    project,
    risks,
    decisions,
    issues,
    changeRequests,
    requirements,
    reviews,
    checklistItems,
    documents,
    governanceGates,
    customerSignoffs,
    deploymentApprovals,
    securityFindings,
    requirementAnalysis,
    healthScore,
  ] = await Promise.all([
    api.getProject(token, projectId),
    api.listRisks(token, projectId),
    api.listDecisions(token, projectId),
    api.listIssues(token, projectId),
    api.listChangeRequests(token, projectId),
    api.listRequirements(token, projectId),
    api.listReviews(token, projectId),
    api.listChecklistItems(token, projectId),
    api.listDocuments(token, projectId),
    api.listGovernanceGates(token, projectId),
    api.listCustomerSignoffs(token, projectId),
    api.listDeploymentApprovals(token, projectId),
    api.listSecurityFindings(token, projectId),
    api.analyzeRequirements(token, projectId),
    api.getProjectHealthScore(token, projectId),
  ]);
  return {
    project,
    risks,
    decisions,
    issues,
    changeRequests,
    requirements,
    reviews,
    checklistItems,
    documents,
    governanceGates,
    customerSignoffs,
    deploymentApprovals,
    securityFindings,
    requirementAnalysis,
    healthScore,
  };
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [governanceGates, setGovernanceGates] = useState<GovernanceGate[]>([]);
  const [customerSignoffs, setCustomerSignoffs] = useState<CustomerSignoff[]>([]);
  const [deploymentApprovals, setDeploymentApprovals] = useState<DeploymentApproval[]>([]);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [requirementAnalysis, setRequirementAnalysis] = useState<RequirementAnalysis[]>([]);
  const [healthScore, setHealthScore] = useState<ProjectHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegister, setActiveRegister] = useState<RegisterKey>('risks');
  const [createRiskOpen, setCreateRiskOpen] = useState(false);
  const [creatingRisk, setCreatingRisk] = useState(false);
  const [logDecisionOpen, setLogDecisionOpen] = useState(false);
  const [loggingDecision, setLoggingDecision] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [createChangeRequestOpen, setCreateChangeRequestOpen] = useState(false);
  const [creatingChangeRequest, setCreatingChangeRequest] = useState(false);
  const [createRequirementOpen, setCreateRequirementOpen] = useState(false);
  const [creatingRequirement, setCreatingRequirement] = useState(false);
  const [createReviewOpen, setCreateReviewOpen] = useState(false);
  const [creatingReview, setCreatingReview] = useState(false);
  const [createChecklistItemOpen, setCreateChecklistItemOpen] = useState(false);
  const [creatingChecklistItem, setCreatingChecklistItem] = useState(false);
  const [createDocumentOpen, setCreateDocumentOpen] = useState(false);
  const [creatingDocument, setCreatingDocument] = useState(false);
  const [createGateOpen, setCreateGateOpen] = useState(false);
  const [creatingGate, setCreatingGate] = useState(false);
  const [createSignoffOpen, setCreateSignoffOpen] = useState(false);
  const [creatingSignoff, setCreatingSignoff] = useState(false);
  const [createDeploymentOpen, setCreateDeploymentOpen] = useState(false);
  const [creatingDeployment, setCreatingDeployment] = useState(false);
  const [createFindingOpen, setCreateFindingOpen] = useState(false);
  const [creatingFinding, setCreatingFinding] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [documentVersionsOpen, setDocumentVersionsOpen] = useState(false);
  const [documentVersionsDoc, setDocumentVersionsDoc] = useState<Document | null>(null);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [loadingDocumentVersions, setLoadingDocumentVersions] = useState(false);
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [reuploadingDocument, setReuploadingDocument] = useState(false);
  const [externalRefsOpen, setExternalRefsOpen] = useState(false);
  const [externalRefsIssue, setExternalRefsIssue] = useState<Issue | null>(null);
  const [externalRefs, setExternalRefs] = useState<ExternalReference[]>([]);
  const [loadingExternalRefs, setLoadingExternalRefs] = useState(false);
  const [addingExternalRef, setAddingExternalRef] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'GOVERNANCE_LEAD';
  const activeCategory = REGISTER_CATEGORY[activeRegister];

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchProjectData(token, projectId)
      .then(
        ({
          project: proj,
          risks: riskList,
          decisions: decisionList,
          issues: issueList,
          changeRequests: changeRequestList,
          requirements: requirementList,
          reviews: reviewList,
          checklistItems: checklistItemList,
          documents: documentList,
          governanceGates: gateList,
          customerSignoffs: signoffList,
          deploymentApprovals: deploymentList,
          securityFindings: findingList,
          requirementAnalysis: analysisList,
          healthScore: health,
        }) => {
          if (cancelled) return;
          setProject(proj);
          setRisks(riskList);
          setDecisions(decisionList);
          setIssues(issueList);
          setChangeRequests(changeRequestList);
          setRequirements(requirementList);
          setReviews(reviewList);
          setChecklistItems(checklistItemList);
          setDocuments(documentList);
          setGovernanceGates(gateList);
          setCustomerSignoffs(signoffList);
          setDeploymentApprovals(deploymentList);
          setSecurityFindings(findingList);
          setRequirementAnalysis(analysisList);
          setHealthScore(health);
          setError(null);
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load project.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, projectId]);

  useEffect(() => {
    if (!token) return;
    api
      .listChecklistTemplates(token)
      .then(setChecklistTemplates)
      .catch(() => {
        // Non-critical background fetch — only used to populate the
        // "Apply Template" dropdown, a failure here shouldn't block the page.
      });
  }, [token]);

  const reload = async () => {
    if (!token) return;
    const {
      project: proj,
      risks: riskList,
      decisions: decisionList,
      issues: issueList,
      changeRequests: changeRequestList,
      requirements: requirementList,
      reviews: reviewList,
      checklistItems: checklistItemList,
      documents: documentList,
      governanceGates: gateList,
      customerSignoffs: signoffList,
      deploymentApprovals: deploymentList,
      securityFindings: findingList,
      requirementAnalysis: analysisList,
      healthScore: health,
    } = await fetchProjectData(token, projectId);
    setProject(proj);
    setRisks(riskList);
    setDecisions(decisionList);
    setIssues(issueList);
    setChangeRequests(changeRequestList);
    setRequirements(requirementList);
    setReviews(reviewList);
    setChecklistItems(checklistItemList);
    setDocuments(documentList);
    setGovernanceGates(gateList);
    setCustomerSignoffs(signoffList);
    setDeploymentApprovals(deploymentList);
    setSecurityFindings(findingList);
    setRequirementAnalysis(analysisList);
    setHealthScore(health);
  };

  const handleCreateRisk = async (values: Omit<CreateRiskInput, 'projectId'>) => {
    if (!token) return;
    setCreatingRisk(true);
    try {
      await api.createRisk(token, { ...values, projectId });
      void message.success('Risk logged.');
      setCreateRiskOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to log the risk.',
      );
    } finally {
      setCreatingRisk(false);
    }
  };

  const handleRiskStatusChange = async (riskId: string, status: RiskStatus) => {
    if (!token) return;
    try {
      await api.updateRisk(token, riskId, { status });
      void message.success('Risk status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the risk.',
      );
    }
  };

  const handleLogDecision = async (
    values: Omit<CreateDecisionInput, 'projectId'>,
  ) => {
    if (!token) return;
    setLoggingDecision(true);
    try {
      await api.createDecision(token, { ...values, projectId });
      void message.success('Decision logged.');
      setLogDecisionOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to log the decision.',
      );
    } finally {
      setLoggingDecision(false);
    }
  };

  const handleCreateIssue = async (
    values: Omit<CreateIssueInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingIssue(true);
    try {
      await api.createIssue(token, { ...values, projectId });
      void message.success('Issue logged.');
      setCreateIssueOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to log the issue.',
      );
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleIssueStatusChange = async (issueId: string, status: IssueStatus) => {
    if (!token) return;
    try {
      await api.updateIssue(token, issueId, { status });
      void message.success('Issue status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the issue.',
      );
    }
  };

  const handleCreateChangeRequest = async (
    values: Omit<CreateChangeRequestInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingChangeRequest(true);
    try {
      await api.createChangeRequest(token, { ...values, projectId });
      void message.success('Change request submitted.');
      setCreateChangeRequestOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to submit the change request.',
      );
    } finally {
      setCreatingChangeRequest(false);
    }
  };

  const handleChangeRequestStatusChange = async (
    changeRequestId: string,
    status: ChangeRequestStatus,
  ) => {
    if (!token) return;
    try {
      await api.updateChangeRequest(token, changeRequestId, { status });
      void message.success('Change request status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update the change request.',
      );
    }
  };

  const handleCreateRequirement = async (
    values: Omit<CreateRequirementInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingRequirement(true);
    try {
      await api.createRequirement(token, { ...values, projectId });
      void message.success('Requirement added.');
      setCreateRequirementOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the requirement.',
      );
    } finally {
      setCreatingRequirement(false);
    }
  };

  const handleRequirementStatusChange = async (
    requirementId: string,
    status: RequirementStatus,
  ) => {
    if (!token) return;
    try {
      await api.updateRequirement(token, requirementId, { status });
      void message.success('Requirement status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the requirement.',
      );
    }
  };

  const handleCreateReview = async (
    values: Omit<CreateReviewInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingReview(true);
    try {
      await api.createReview(token, { ...values, projectId });
      void message.success('Review submitted.');
      setCreateReviewOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to submit the review.',
      );
    } finally {
      setCreatingReview(false);
    }
  };

  const handleReviewStatusChange = async (
    reviewId: string,
    status: ReviewStatus,
  ) => {
    if (!token) return;
    try {
      await api.updateReview(token, reviewId, { status });
      void message.success('Review status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the review.',
      );
    }
  };

  const handleCreateChecklistItem = async (
    values: Omit<CreateChecklistItemInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingChecklistItem(true);
    try {
      await api.createChecklistItem(token, { ...values, projectId });
      void message.success('Checklist item added.');
      setCreateChecklistItemOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the checklist item.',
      );
    } finally {
      setCreatingChecklistItem(false);
    }
  };

  const handleChecklistToggle = async (itemId: string, isDone: boolean) => {
    if (!token) return;
    try {
      await api.updateChecklistItem(token, itemId, { isDone });
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the checklist item.',
      );
    }
  };

  const handleCreateDocument = async (
    values: Omit<CreateDocumentInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingDocument(true);
    try {
      await api.createDocument(token, { ...values, projectId });
      void message.success('Document added.');
      setCreateDocumentOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the document.',
      );
    } finally {
      setCreatingDocument(false);
    }
  };

  const handleCreateGate = async (
    values: Omit<CreateGovernanceGateInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingGate(true);
    try {
      await api.createGovernanceGate(token, { ...values, projectId });
      void message.success('Gate added.');
      setCreateGateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the gate.',
      );
    } finally {
      setCreatingGate(false);
    }
  };

  const handleGateToggle = async (gateId: string, isMet: boolean) => {
    if (!token) return;
    try {
      await api.updateGovernanceGate(token, gateId, { isMet });
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the gate.',
      );
    }
  };

  const handleCreateSignoff = async (
    values: Omit<CreateCustomerSignoffInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingSignoff(true);
    try {
      await api.createCustomerSignoff(token, { ...values, projectId });
      void message.success('Sign-off requested.');
      setCreateSignoffOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to request the sign-off.',
      );
    } finally {
      setCreatingSignoff(false);
    }
  };

  const handleSignoffStatusChange = async (
    signoffId: string,
    status: SignoffStatus,
  ) => {
    if (!token) return;
    try {
      await api.updateCustomerSignoff(token, signoffId, { status });
      void message.success('Sign-off status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the sign-off.',
      );
    }
  };

  const handleCreateDeployment = async (
    values: Omit<CreateDeploymentApprovalInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingDeployment(true);
    try {
      await api.createDeploymentApproval(token, { ...values, projectId });
      void message.success('Deployment approval requested.');
      setCreateDeploymentOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to request the deployment approval.',
      );
    } finally {
      setCreatingDeployment(false);
    }
  };

  const handleDeploymentStatusChange = async (
    deploymentId: string,
    status: DeploymentStatus,
  ) => {
    if (!token) return;
    try {
      await api.updateDeploymentApproval(token, deploymentId, { status });
      void message.success('Deployment approval status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update the deployment approval.',
      );
    }
  };

  const handleCreateFinding = async (
    values: Omit<CreateSecurityFindingInput, 'projectId'>,
  ) => {
    if (!token) return;
    setCreatingFinding(true);
    try {
      await api.createSecurityFinding(token, { ...values, projectId });
      void message.success('Finding logged.');
      setCreateFindingOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to log the finding.',
      );
    } finally {
      setCreatingFinding(false);
    }
  };

  const handleFindingStatusChange = async (
    findingId: string,
    status: SecurityFindingStatus,
  ) => {
    if (!token) return;
    try {
      await api.updateSecurityFinding(token, findingId, { status });
      void message.success('Finding status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the finding.',
      );
    }
  };

  const handleUploadDocument = async (values: { title: string; version?: string }) => {
    if (!token || !uploadFile) {
      void message.error('Choose a file first.');
      return;
    }
    setUploadingDocument(true);
    try {
      await api.uploadDocument(token, {
        projectId,
        title: values.title,
        version: values.version,
        file: uploadFile,
      });
      void message.success('File uploaded.');
      setUploadDocumentOpen(false);
      setUploadFile(null);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to upload the file.',
      );
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleApplyTemplate = async (values: { templateId: string }) => {
    if (!token) return;
    setApplyingTemplate(true);
    try {
      await api.applyChecklistTemplate(token, values.templateId, projectId);
      void message.success('Template applied.');
      setApplyTemplateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to apply the template.',
      );
    } finally {
      setApplyingTemplate(false);
    }
  };

  const openDocumentVersions = async (doc: Document) => {
    if (!token) return;
    setDocumentVersionsDoc(doc);
    setDocumentVersionsOpen(true);
    setLoadingDocumentVersions(true);
    try {
      setDocumentVersions(await api.listDocumentVersions(token, doc.id));
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to load version history.',
      );
    } finally {
      setLoadingDocumentVersions(false);
    }
  };

  const handleReuploadDocument = async (values: { version?: string }) => {
    if (!token || !documentVersionsDoc || !reuploadFile) {
      void message.error('Choose a file first.');
      return;
    }
    setReuploadingDocument(true);
    try {
      await api.reuploadDocument(token, documentVersionsDoc.id, {
        version: values.version,
        file: reuploadFile,
      });
      void message.success('New version uploaded.');
      setReuploadFile(null);
      await reload();
      setDocumentVersions(
        await api.listDocumentVersions(token, documentVersionsDoc.id),
      );
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to upload the new version.',
      );
    } finally {
      setReuploadingDocument(false);
    }
  };

  const openExternalRefs = async (issue: Issue) => {
    if (!token) return;
    setExternalRefsIssue(issue);
    setExternalRefsOpen(true);
    setLoadingExternalRefs(true);
    try {
      setExternalRefs(await api.listExternalReferences(token, issue.id));
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to load external references.',
      );
    } finally {
      setLoadingExternalRefs(false);
    }
  };

  const handleAddExternalRef = async (
    values: Omit<CreateExternalReferenceInput, 'issueId'>,
  ) => {
    if (!token || !externalRefsIssue) return;
    setAddingExternalRef(true);
    try {
      await api.createExternalReference(token, {
        issueId: externalRefsIssue.id,
        ...values,
      });
      setExternalRefs(
        await api.listExternalReferences(token, externalRefsIssue.id),
      );
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to link the reference.',
      );
    } finally {
      setAddingExternalRef(false);
    }
  };

  const handleRemoveExternalRef = async (id: string) => {
    if (!token || !externalRefsIssue) return;
    try {
      await api.deleteExternalReference(token, id);
      setExternalRefs(
        await api.listExternalReferences(token, externalRefsIssue.id),
      );
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to remove the reference.',
      );
    }
  };

  const handleSaveMetadata = async (values: {
    entries?: { key: string; value: string }[];
  }) => {
    if (!token) return;
    setSavingMetadata(true);
    try {
      const metadata = Object.fromEntries(
        (values.entries ?? [])
          .filter((entry) => entry?.key)
          .map((entry) => [entry.key, entry.value ?? '']),
      );
      await api.updateProject(token, projectId, { metadata });
      void message.success('Custom fields updated.');
      setMetadataOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update custom fields.',
      );
    } finally {
      setSavingMetadata(false);
    }
  };

  const handleAddClick = () => {
    if (activeRegister === 'risks') setCreateRiskOpen(true);
    else if (activeRegister === 'decisions') setLogDecisionOpen(true);
    else if (activeRegister === 'issues') setCreateIssueOpen(true);
    else if (activeRegister === 'changeRequests') setCreateChangeRequestOpen(true);
    else if (activeRegister === 'requirements') setCreateRequirementOpen(true);
    else if (activeRegister === 'reviews') setCreateReviewOpen(true);
    else if (activeRegister === 'checklist') setCreateChecklistItemOpen(true);
    else if (activeRegister === 'documents') setCreateDocumentOpen(true);
    else if (activeRegister === 'governanceGates') setCreateGateOpen(true);
    else if (activeRegister === 'deploymentApprovals') setCreateDeploymentOpen(true);
    else if (activeRegister === 'securityFindings') setCreateFindingOpen(true);
    else setCreateSignoffOpen(true);
  };

  const registerTabItems: Record<
    RegisterKey,
    { key: RegisterKey; label: string; children: React.ReactNode }
  > = {
    risks: {
      key: 'risks',
      label: 'Risk Register',
      children: (
        <Table<Risk>
          rowKey="id"
          loading={loading}
          dataSource={risks}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Severity',
              dataIndex: 'severity',
              render: (severity: RiskSeverity) => (
                <Tag color={SEVERITY_COLOR[severity]}>{severity}</Tag>
              ),
            },
            {
              title: 'Likelihood',
              dataIndex: 'likelihood',
              render: (likelihood: RiskLikelihood) => (
                <Tag color={LIKELIHOOD_COLOR[likelihood]}>{likelihood}</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: RiskStatus, record) =>
                canManage ? (
                  <Select<RiskStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 140 }}
                    options={RISK_STATUSES.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) =>
                      void handleRiskStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
          ]}
        />
      ),
    },
    decisions: {
      key: 'decisions',
      label: 'Decision Log',
      children: (
        <Table<Decision>
          rowKey="id"
          loading={loading}
          dataSource={decisions}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            { title: 'Decision', dataIndex: 'decision' },
            {
              title: 'Context',
              dataIndex: 'context',
              render: (context: string | null) =>
                context ?? <Text type="secondary">—</Text>,
            },
            {
              title: 'Decided',
              dataIndex: 'decidedAt',
              render: (decidedAt: string) =>
                new Date(decidedAt).toLocaleDateString(),
            },
          ]}
        />
      ),
    },
    issues: {
      key: 'issues',
      label: 'Issue Register',
      children: (
        <Table<Issue>
          rowKey="id"
          loading={loading}
          dataSource={issues}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Priority',
              dataIndex: 'priority',
              render: (priority: IssuePriority) => (
                <Tag color={PRIORITY_COLOR[priority]}>{priority}</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: IssueStatus, record) =>
                canManage ? (
                  <Select<IssueStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 140 }}
                    options={ISSUE_STATUSES.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) =>
                      void handleIssueStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={ISSUE_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
            {
              title: 'External Refs',
              key: 'externalRefs',
              render: (_, record) => (
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => void openExternalRefs(record)}
                >
                  Links
                </Button>
              ),
            },
          ]}
        />
      ),
    },
    checklist: {
      key: 'checklist',
      label: 'Checklist',
      children: (
        <Table<ChecklistItem>
          rowKey="id"
          loading={loading}
          dataSource={checklistItems}
          pagination={false}
          showHeader={false}
          columns={[
            {
              key: 'isDone',
              render: (_: unknown, record) => (
                <Checkbox
                  checked={record.isDone}
                  disabled={!canManage}
                  onChange={(e) =>
                    void handleChecklistToggle(record.id, e.target.checked)
                  }
                >
                  <Text delete={record.isDone}>{record.title}</Text>
                </Checkbox>
              ),
            },
          ]}
        />
      ),
    },
    securityFindings: {
      key: 'securityFindings',
      label: 'Security Findings',
      children: (
        <Table<SecurityFinding>
          rowKey="id"
          loading={loading}
          dataSource={securityFindings}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Severity',
              dataIndex: 'severity',
              render: (severity: SecurityFindingSeverity) => (
                <Tag color={FINDING_SEVERITY_COLOR[severity]}>{severity}</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: SecurityFindingStatus, record) =>
                canManage ? (
                  <Select<SecurityFindingStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 160 }}
                    options={FINDING_STATUSES.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) =>
                      void handleFindingStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={FINDING_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
          ]}
        />
      ),
    },
    requirements: {
      key: 'requirements',
      label: 'Requirements',
      children: (
        <Table<Requirement>
          rowKey="id"
          loading={loading}
          dataSource={requirements}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: RequirementStatus, record) =>
                canManage ? (
                  <Select<RequirementStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 140 }}
                    options={REQUIREMENT_STATUSES.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) =>
                      void handleRequirementStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={REQUIREMENT_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
            {
              title: 'Flags',
              key: 'flags',
              render: (_: unknown, record) => {
                const flags =
                  requirementAnalysis.find((a) => a.requirementId === record.id)
                    ?.flags ?? [];
                return flags.length === 0 ? (
                  <Text type="secondary">—</Text>
                ) : (
                  <>
                    {flags.map((flag) => (
                      <Tag key={flag} color={semanticColor.warning}>
                        {REQUIREMENT_FLAG_LABEL[flag] ?? flag}
                      </Tag>
                    ))}
                  </>
                );
              },
            },
          ]}
        />
      ),
    },
    reviews: {
      key: 'reviews',
      label: 'Reviews',
      children: (
        <Table<Review>
          rowKey="id"
          loading={loading}
          dataSource={reviews}
          pagination={false}
          columns={[
            {
              title: 'Type',
              dataIndex: 'type',
              render: (type: ReviewType) => REVIEW_TYPE_LABEL[type],
            },
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: ReviewStatus, record) =>
                canManage && REVIEW_ALLOWED_TRANSITIONS[status].length > 0 ? (
                  <Select<ReviewStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 180 }}
                    options={[
                      { value: status, label: status, disabled: true },
                      ...REVIEW_ALLOWED_TRANSITIONS[status].map((value) => ({
                        value,
                        label: value,
                      })),
                    ]}
                    onChange={(value) =>
                      void handleReviewStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={REVIEW_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
          ]}
        />
      ),
    },
    changeRequests: {
      key: 'changeRequests',
      label: 'Change Requests',
      children: (
        <Table<ChangeRequest>
          rowKey="id"
          loading={loading}
          dataSource={changeRequests}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: ChangeRequestStatus, record) =>
                canManage &&
                CHANGE_REQUEST_ALLOWED_TRANSITIONS[status].length > 0 ? (
                  <Select<ChangeRequestStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 160 }}
                    options={[
                      { value: status, label: status, disabled: true },
                      ...CHANGE_REQUEST_ALLOWED_TRANSITIONS[status].map(
                        (value) => ({ value, label: value }),
                      ),
                    ]}
                    onChange={(value) =>
                      void handleChangeRequestStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={CHANGE_REQUEST_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
          ]}
        />
      ),
    },
    governanceGates: {
      key: 'governanceGates',
      label: 'Governance Gates',
      children: (
        <Table<GovernanceGate>
          rowKey="id"
          loading={loading}
          dataSource={governanceGates}
          pagination={false}
          columns={[
            {
              title: 'Category',
              dataIndex: 'category',
              render: (category: GateCategory) => (
                <Tag>{GATE_CATEGORY_LABEL[category]}</Tag>
              ),
            },
            {
              title: 'Gate',
              key: 'gate',
              render: (_: unknown, record) => (
                <Checkbox
                  checked={record.isMet}
                  disabled={!canManage}
                  onChange={(e) =>
                    void handleGateToggle(record.id, e.target.checked)
                  }
                >
                  <Text delete={record.isMet}>{record.title}</Text>
                </Checkbox>
              ),
            },
          ]}
        />
      ),
    },
    deploymentApprovals: {
      key: 'deploymentApprovals',
      label: 'Deployment Governance',
      children: (
        <Table<DeploymentApproval>
          rowKey="id"
          loading={loading}
          dataSource={deploymentApprovals}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: DeploymentStatus, record) =>
                canManage && DEPLOYMENT_ALLOWED_TRANSITIONS[status].length > 0 ? (
                  <Select<DeploymentStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 160 }}
                    options={[
                      { value: status, label: status, disabled: true },
                      ...DEPLOYMENT_ALLOWED_TRANSITIONS[status].map((value) => ({
                        value,
                        label: value,
                      })),
                    ]}
                    onChange={(value) =>
                      void handleDeploymentStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={DEPLOYMENT_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
            {
              title: 'Notes',
              dataIndex: 'notes',
              render: (notes: string | null) =>
                notes ?? <Text type="secondary">—</Text>,
            },
          ]}
        />
      ),
    },
    documents: {
      key: 'documents',
      label: 'Documents',
      children: (
        <Table<Document>
          rowKey="id"
          loading={loading}
          dataSource={documents}
          pagination={false}
          columns={[
            {
              title: 'Title',
              dataIndex: 'title',
              render: (title: string, record) => {
                // Uploaded files have a storage-relative url
                // (/documents/:id/download) that only resolves against
                // the API's own origin, not the web app's.
                const href = record.storageKey
                  ? `${API_URL}${record.url}`
                  : record.url;
                return (
                  <a href={href} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                );
              },
            },
            { title: 'Version', dataIndex: 'version' },
            {
              title: 'History',
              key: 'history',
              render: (_, record) => (
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => void openDocumentVersions(record)}
                >
                  Versions
                </Button>
              ),
            },
          ]}
        />
      ),
    },
    customerSignoffs: {
      key: 'customerSignoffs',
      label: 'Customer Sign-off',
      children: (
        <Table<CustomerSignoff>
          rowKey="id"
          loading={loading}
          dataSource={customerSignoffs}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            { title: 'Customer', dataIndex: 'customerName' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (status: SignoffStatus, record) =>
                canManage ? (
                  <Select<SignoffStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 140 }}
                    options={SIGNOFF_STATUSES.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) =>
                      void handleSignoffStatusChange(record.id, value)
                    }
                  />
                ) : (
                  <Tag color={SIGNOFF_STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
          ]}
        />
      ),
    },
  };

  return (
    <Space orientation="vertical" size={parseInt(spacing[6], 10)} style={{ width: '100%' }}>
      {error && <Alert type="error" title={error} showIcon />}

      <Card
        loading={loading}
        style={glassPanelStyle}
        title={
          project && (
            <Space size={parseInt(spacing[2], 10)} align="center">
              <Text strong>{project.name}</Text>
              <Tag color={PROJECT_STATUS_COLOR[project.status]}>{project.status}</Tag>
              <Tag color={semanticColor.brand}>{project.governanceStage}</Tag>
              {healthScore && (
                <Tag color={HEALTH_BAND_COLOR[healthScore.band]}>
                  Health: {healthScore.score} ({healthScore.band})
                </Tag>
              )}
            </Space>
          )
        }
        extra={
          project && (
            <Button size="small" onClick={() => setMetadataOpen(true)}>
              Custom Fields
              {project.metadata && Object.keys(project.metadata).length > 0
                ? ` (${Object.keys(project.metadata).length})`
                : ''}
            </Button>
          )
        }
      >
        <Tabs
          activeKey={activeCategory}
          onChange={(key) =>
            setActiveRegister(CATEGORY_REGISTERS[key as CategoryKey][0])
          }
          tabBarExtraContent={
            <Space>
              {canManage && activeRegister === 'checklist' && (
                <Button onClick={() => setApplyTemplateOpen(true)}>
                  Apply Template
                </Button>
              )}
              {canManage && activeRegister === 'documents' && (
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => setUploadDocumentOpen(true)}
                >
                  Upload File
                </Button>
              )}
              {
                // Change Requests, Reviews, and Deployment Approvals are
                // self-serve (anyone can submit; the RBAC gate is on the
                // decision, not the submission) — every other register is
                // write-gated.
                (canManage || SELF_SERVE_REGISTERS.includes(activeRegister)) && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
                    {REGISTER_ADD_LABEL[activeRegister]}
                  </Button>
                )
              }
            </Space>
          }
          items={(Object.keys(CATEGORY_REGISTERS) as CategoryKey[]).map((category) => ({
            key: category,
            label: CATEGORY_LABEL[category],
            children: (
              <Tabs
                activeKey={activeRegister}
                onChange={(key) => setActiveRegister(key as RegisterKey)}
                items={CATEGORY_REGISTERS[category].map(
                  (registerKey) => registerTabItems[registerKey],
                )}
              />
            ),
          }))}
        />
      </Card>

      <Modal
        title="Log a risk"
        open={createRiskOpen}
        onCancel={() => setCreateRiskOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateRiskInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateRisk(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'LOW', label: 'LOW' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'CRITICAL', label: 'CRITICAL' },
              ]}
            />
          </Form.Item>
          <Form.Item name="likelihood" label="Likelihood" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'LOW', label: 'LOW' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'HIGH', label: 'HIGH' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingRisk} block>
            Log risk
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Log a decision"
        open={logDecisionOpen}
        onCancel={() => setLogDecisionOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateDecisionInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleLogDecision(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="context" label="Context">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="decision"
            label="Decision"
            rules={[{ required: true, min: 2 }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loggingDecision} block>
            Log decision
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Log an issue"
        open={createIssueOpen}
        onCancel={() => setCreateIssueOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateIssueInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateIssue(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'LOW', label: 'LOW' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'CRITICAL', label: 'CRITICAL' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingIssue} block>
            Log issue
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Submit a change request"
        open={createChangeRequestOpen}
        onCancel={() => setCreateChangeRequestOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateChangeRequestInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateChangeRequest(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={creatingChangeRequest}
            block
          >
            Submit change request
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Add a requirement"
        open={createRequirementOpen}
        onCancel={() => setCreateRequirementOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateRequirementInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateRequirement(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={creatingRequirement}
            block
          >
            Add requirement
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Submit a review"
        open={createReviewOpen}
        onCancel={() => setCreateReviewOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateReviewInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateReview(values)}
        >
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'ARCHITECTURE', label: 'Architecture' },
                { value: 'SECURITY', label: 'Security' },
                { value: 'PERFORMANCE', label: 'Performance' },
              ]}
            />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingReview} block>
            Submit review
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Add a checklist item"
        open={createChecklistItemOpen}
        onCancel={() => setCreateChecklistItemOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateChecklistItemInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateChecklistItem(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={creatingChecklistItem}
            block
          >
            Add checklist item
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Add a document"
        open={createDocumentOpen}
        onCancel={() => setCreateDocumentOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateDocumentInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateDocument(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, type: 'url' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="version" label="Version" initialValue="1.0">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingDocument} block>
            Add document
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Add a governance gate"
        open={createGateOpen}
        onCancel={() => setCreateGateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateGovernanceGateInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateGate(values)}
        >
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'DEVELOPMENT', label: 'Development' },
                { value: 'TESTING', label: 'Testing' },
              ]}
            />
          </Form.Item>
          <Form.Item name="title" label="Gate" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Code review completed" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingGate} block>
            Add gate
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Request a customer sign-off"
        open={createSignoffOpen}
        onCancel={() => setCreateSignoffOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateCustomerSignoffInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateSignoff(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="customerName"
            label="Customer"
            rules={[{ required: true, min: 2 }]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingSignoff} block>
            Request sign-off
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Request a deployment approval"
        open={createDeploymentOpen}
        onCancel={() => setCreateDeploymentOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateDeploymentApprovalInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateDeployment(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Ship v2.0" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingDeployment} block>
            Request deployment approval
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Log a security finding"
        open={createFindingOpen}
        onCancel={() => setCreateFindingOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<Omit<CreateSecurityFindingInput, 'projectId'>>
          layout="vertical"
          onFinish={(values) => void handleCreateFinding(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Outdated TLS cipher suite" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'LOW', label: 'LOW' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'CRITICAL', label: 'CRITICAL' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creatingFinding} block>
            Log finding
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Upload a document"
        open={uploadDocumentOpen}
        onCancel={() => {
          setUploadDocumentOpen(false);
          setUploadFile(null);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form<{ title: string; version?: string }>
          layout="vertical"
          onFinish={(values) => void handleUploadDocument(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="version" label="Version" initialValue="1.0">
            <Input />
          </Form.Item>
          <Form.Item label="File" required>
            <Upload
              maxCount={1}
              beforeUpload={(file) => {
                setUploadFile(file);
                return false;
              }}
              onRemove={() => setUploadFile(null)}
            >
              <Button icon={<UploadOutlined />}>Choose file</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={uploadingDocument} block>
            Upload
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Apply a checklist template"
        open={applyTemplateOpen}
        onCancel={() => setApplyTemplateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<{ templateId: string }>
          layout="vertical"
          onFinish={(values) => void handleApplyTemplate(values)}
        >
          <Form.Item
            name="templateId"
            label="Template"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Choose a template"
              options={checklistTemplates.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.items.length} item${t.items.length === 1 ? '' : 's'})`,
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={applyingTemplate} block>
            Apply Template
          </Button>
        </Form>
      </Modal>

      <Modal
        title={
          documentVersionsDoc
            ? `Version history — ${documentVersionsDoc.title}`
            : 'Version history'
        }
        open={documentVersionsOpen}
        onCancel={() => {
          setDocumentVersionsOpen(false);
          setReuploadFile(null);
        }}
        footer={null}
        destroyOnHidden
      >
        <Table<DocumentVersion>
          rowKey="id"
          size="small"
          loading={loadingDocumentVersions}
          dataSource={documentVersions}
          pagination={false}
          locale={{ emptyText: 'No prior versions yet.' }}
          columns={[
            { title: 'Version', dataIndex: 'version' },
            {
              title: 'Saved',
              dataIndex: 'createdAt',
              render: (createdAt: string) =>
                new Date(createdAt).toLocaleString(),
            },
            {
              title: '',
              key: 'link',
              render: (_, record) =>
                record.storageKey ? (
                  <a
                    href={`${API_URL}/documents/${documentVersionsDoc?.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    download
                  </a>
                ) : (
                  <a href={record.url} target="_blank" rel="noreferrer">
                    link
                  </a>
                ),
            },
          ]}
        />
        {canManage && documentVersionsDoc?.storageKey && (
          <Form<{ version?: string }>
            layout="vertical"
            style={{ marginTop: spacing[4] }}
            onFinish={(values) => void handleReuploadDocument(values)}
          >
            <Form.Item name="version" label="New version label">
              <Input placeholder="e.g. 2.0" />
            </Form.Item>
            <Form.Item label="File" required>
              <Upload
                maxCount={1}
                beforeUpload={(file) => {
                  setReuploadFile(file);
                  return false;
                }}
                onRemove={() => setReuploadFile(null)}
              >
                <Button icon={<UploadOutlined />}>Choose file</Button>
              </Upload>
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={reuploadingDocument}
              block
            >
              Upload new version
            </Button>
          </Form>
        )}
      </Modal>

      <Modal
        title={
          externalRefsIssue
            ? `External references — ${externalRefsIssue.title}`
            : 'External references'
        }
        open={externalRefsOpen}
        onCancel={() => setExternalRefsOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Table<ExternalReference>
          rowKey="id"
          size="small"
          loading={loadingExternalRefs}
          dataSource={externalRefs}
          pagination={false}
          locale={{ emptyText: 'No linked references yet.' }}
          columns={[
            {
              title: 'Provider',
              dataIndex: 'provider',
              render: (provider: ExternalReferenceProvider) => (
                <Tag color={semanticColor.brand}>{provider}</Tag>
              ),
            },
            {
              title: 'External ID',
              dataIndex: 'externalId',
              render: (externalId: string, record) => (
                <a href={record.url} target="_blank" rel="noreferrer">
                  {externalId}
                </a>
              ),
            },
            ...(canManage
              ? [
                  {
                    title: '',
                    key: 'remove',
                    render: (_: unknown, record: ExternalReference) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => void handleRemoveExternalRef(record.id)}
                      >
                        Remove
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
        />
        {canManage && (
          <Form<Omit<CreateExternalReferenceInput, 'issueId'>>
            layout="vertical"
            style={{ marginTop: spacing[4] }}
            onFinish={(values) => void handleAddExternalRef(values)}
          >
            <Form.Item
              name="provider"
              label="Provider"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'JIRA', label: 'Jira' },
                  { value: 'AZURE_DEVOPS', label: 'Azure DevOps' },
                  { value: 'SHAREPOINT', label: 'SharePoint' },
                  { value: 'SERVICENOW', label: 'ServiceNow' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="externalId"
              label="External ID"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. EPG-42" />
            </Form.Item>
            <Form.Item name="url" label="URL" rules={[{ required: true }]}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={addingExternalRef}
              block
            >
              Link reference
            </Button>
          </Form>
        )}
      </Modal>

      <Modal
        title="Custom Fields"
        open={metadataOpen}
        onCancel={() => setMetadataOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<{ entries?: { key: string; value: string }[] }>
          layout="vertical"
          initialValues={{
            entries: Object.entries(project?.metadata ?? {}).map(
              ([key, value]) => ({ key, value }),
            ),
          }}
          onFinish={(values) => void handleSaveMetadata(values)}
        >
          <Form.List name="entries">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex' }}>
                    <Form.Item
                      name={[field.name, 'key']}
                      rules={[{ required: true, message: 'Key required' }]}
                    >
                      <Input placeholder="Key (e.g. costCenter)" disabled={!canManage} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'value']}>
                      <Input placeholder="Value" disabled={!canManage} />
                    </Form.Item>
                    {canManage && (
                      <Button danger onClick={() => remove(field.name)}>
                        Remove
                      </Button>
                    )}
                  </Space>
                ))}
                {canManage && (
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    style={{ marginBottom: spacing[3] }}
                  >
                    Add field
                  </Button>
                )}
              </>
            )}
          </Form.List>
          {canManage && (
            <Button type="primary" htmlType="submit" loading={savingMetadata} block>
              Save
            </Button>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
