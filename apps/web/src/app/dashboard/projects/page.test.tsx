import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectsPage from "./page";

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client"
  );
  return {
    ...actual,
    api: {
      ...actual.api,
      listProjects: vi.fn().mockResolvedValue([
        {
          id: "p1",
          name: "Website Revamp",
          status: "DRAFT",
          organizationId: "org-1",
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

describe("ProjectsPage", () => {
  it("shows the New project button for an ADMIN", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    render(<ProjectsPage />);

    expect(await screen.findByText("Website Revamp")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });

  it("hides the New project button for a MEMBER", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "MEMBER" },
      token: "token-123",
    });
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText("Website Revamp")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "New project" })
    ).not.toBeInTheDocument();
  });
});
