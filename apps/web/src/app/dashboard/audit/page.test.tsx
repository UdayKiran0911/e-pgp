import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuditLogPage from "./page";

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client"
  );
  return {
    ...actual,
    api: {
      ...actual.api,
      listAuditLogs: vi.fn().mockResolvedValue([
        {
          id: "log-1",
          organizationId: "org-1",
          projectId: "p1",
          project: { id: "p1", name: "Website Revamp" },
          actorId: "u1",
          action: "PROJECT_CREATED",
          metadata: { name: "Website Revamp" },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      listUsers: vi.fn().mockResolvedValue([
        {
          id: "u1",
          email: "admin@acme.test",
          name: "Ada Admin",
          role: "ADMIN",
          organizationId: "org-1",
          isActive: true,
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

describe("AuditLogPage", () => {
  it("renders audit log entries with the resolved actor name and project", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    render(<AuditLogPage />);

    expect(await screen.findByText("PROJECT_CREATED")).toBeInTheDocument();
    expect(screen.getByText("Ada Admin (admin@acme.test)")).toBeInTheDocument();
    expect(screen.getByText("Website Revamp")).toBeInTheDocument();
  });
});
