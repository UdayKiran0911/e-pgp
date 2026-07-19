import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App as AntApp } from "antd";
import ProjectDetailPage from "./page";
import { api } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "p1" }),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client"
  );
  return {
    ...actual,
    api: {
      ...actual.api,
      getProject: vi.fn().mockResolvedValue({
        id: "p1",
        name: "Website Revamp",
        status: "ACTIVE",
        governanceStage: "PLANNING",
        organizationId: "org-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      listRisks: vi.fn().mockResolvedValue([
        {
          id: "r1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Vendor lock-in",
          description: null,
          severity: "HIGH",
          likelihood: "MEDIUM",
          status: "OPEN",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listDecisions: vi.fn().mockResolvedValue([
        {
          id: "d1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Adopt Postgres over MySQL",
          context: null,
          decision: "Go with Postgres",
          decidedById: "u1",
          decidedAt: "2026-01-01T00:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listIssues: vi.fn().mockResolvedValue([
        {
          id: "i1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Build failing on main",
          description: null,
          priority: "HIGH",
          status: "OPEN",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listChangeRequests: vi.fn().mockResolvedValue([
        {
          id: "cr1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Extend deployment window",
          description: null,
          status: "SUBMITTED",
          requestedById: "u2",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listRequirements: vi.fn().mockResolvedValue([
        {
          id: "req1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Support SSO login",
          description: null,
          status: "DRAFT",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listReviews: vi.fn().mockResolvedValue([
        {
          id: "rev1",
          organizationId: "org-1",
          projectId: "p1",
          type: "SECURITY",
          title: "Pen-test the auth flow",
          description: null,
          status: "SUBMITTED",
          requestedById: "u2",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listChecklistItems: vi.fn().mockResolvedValue([
        {
          id: "chk1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Confirm rollback plan",
          isDone: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listDocuments: vi.fn().mockResolvedValue([
        {
          id: "doc1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Solution Design Doc",
          url: "https://docs.example.com/solution-design",
          version: "1.0",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listGovernanceGates: vi.fn().mockResolvedValue([
        {
          id: "gate1",
          organizationId: "org-1",
          projectId: "p1",
          category: "DEVELOPMENT",
          title: "Code review completed",
          isMet: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listCustomerSignoffs: vi.fn().mockResolvedValue([
        {
          id: "signoff1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Go-live approval",
          customerName: "Acme Corp",
          status: "PENDING",
          requestedById: "u1",
          notes: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listDeploymentApprovals: vi.fn().mockResolvedValue([
        {
          id: "deploy1",
          organizationId: "org-1",
          projectId: "p1",
          title: "Ship v2.0",
          status: "REQUESTED",
          requestedById: "u2",
          notes: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    },
  };
});

const mockUseAuth = vi.fn();
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderPage() {
  return render(
    <AntApp>
      <ProjectDetailPage />
    </AntApp>
  );
}

describe("ProjectDetailPage", () => {
  it("defaults to the Risk Register tab with an Add risk button for an ADMIN", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderPage();

    expect(await screen.findByText("Website Revamp")).toBeInTheDocument();
    expect(screen.getByText("Vendor lock-in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add risk" })).toBeInTheDocument();
  });

  it("switches the Add button label when the Decision Log and Issue Register tabs are selected", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderPage();
    await screen.findByText("Vendor lock-in");

    await user.click(screen.getByRole("tab", { name: "Decision Log" }));
    expect(await screen.findByText("Adopt Postgres over MySQL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add decision" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Issue Register" }));
    expect(await screen.findByText("Build failing on main")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add issue" })).toBeInTheDocument();
  });

  it("hides the Add button for a MEMBER on gated tabs but shows it on self-serve tabs", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { role: "MEMBER" },
      token: "token-123",
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Vendor lock-in")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Add risk" })).not.toBeInTheDocument();

    // Decision Log is in the same "Planning & Tracking" category as the
    // default Risk Register tab, so no outer category switch is needed.
    await user.click(screen.getByRole("tab", { name: "Decision Log" }));
    await screen.findByText("Adopt Postgres over MySQL");
    expect(
      screen.queryByRole("button", { name: "Add decision" })
    ).not.toBeInTheDocument();

    // Requirements, Change Requests, and Reviews live under the
    // "Governance & Reviews" category — switch to it first.
    await user.click(screen.getByRole("tab", { name: "Governance & Reviews" }));

    await user.click(screen.getByRole("tab", { name: "Requirements" }));
    await screen.findByText("Support SSO login");
    expect(
      screen.queryByRole("button", { name: "Add requirement" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Change Requests" }));
    expect(await screen.findByText("Extend deployment window")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit change request" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Reviews" }));
    expect(await screen.findByText("Pen-test the auth flow")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit review" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Deployment Governance" }));
    expect(await screen.findByText("Ship v2.0")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request deployment approval" })
    ).toBeInTheDocument();
  });

  it("shows the checklist item with a toggleable checkbox", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderPage();
    await screen.findByText("Vendor lock-in");

    await user.click(screen.getByRole("tab", { name: "Checklist" }));
    expect(await screen.findByText("Confirm rollback plan")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("shows documents, governance gates, and customer sign-offs on their tabs", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderPage();
    await screen.findByText("Vendor lock-in");

    // Documents & Customer Sign-off live under "Documents & Sign-off".
    await user.click(screen.getByRole("tab", { name: "Documents & Sign-off" }));

    await user.click(screen.getByRole("tab", { name: "Documents" }));
    expect(
      await screen.findByRole("link", { name: "Solution Design Doc" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Customer Sign-off" }));
    expect(await screen.findByText("Go-live approval")).toBeInTheDocument();

    // Governance Gates lives under "Governance & Reviews".
    await user.click(screen.getByRole("tab", { name: "Governance & Reviews" }));
    await user.click(screen.getByRole("tab", { name: "Governance Gates" }));
    expect(await screen.findByText("Code review completed")).toBeInTheDocument();
  });

  it("calls the API with the project id when fetching risks", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderPage();

    await waitFor(() => {
      expect(api.listRisks).toHaveBeenCalledWith("token-123", "p1");
    });
  });
});
