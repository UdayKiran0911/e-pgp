import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App as AntApp } from "antd";
import ProjectsPage from "./page";
import { api } from "@/lib/api-client";

function renderProjectsPage() {
  return render(
    <AntApp>
      <ProjectsPage />
    </AntApp>
  );
}

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
          governanceStage: "INITIATION",
          organizationId: "org-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
      updateProject: vi.fn().mockResolvedValue({
        id: "p1",
        name: "Website Revamp",
        status: "DRAFT",
        governanceStage: "PLANNING",
        organizationId: "org-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
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
    renderProjectsPage();

    expect(await screen.findByText("Website Revamp")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });

  it("hides the New project button for a MEMBER", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "MEMBER" },
      token: "token-123",
    });
    renderProjectsPage();

    await waitFor(() => {
      expect(screen.getByText("Website Revamp")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "New project" })
    ).not.toBeInTheDocument();
  });

  it("shows the governance stage stepper starting at Initiation", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderProjectsPage();

    expect(await screen.findByText("INITIATION")).toBeInTheDocument();
    expect(screen.getByText("PLANNING")).toBeInTheDocument();
    expect(screen.getByText("CLOSURE")).toBeInTheDocument();
  });

  it("advances the governance stage when the next step is clicked", async () => {
    vi.mocked(api.updateProject).mockClear();
    mockUseAuth.mockReturnValue({
      user: { role: "ADMIN" },
      token: "token-123",
    });
    renderProjectsPage();

    const planningStep = await screen.findByText("PLANNING");
    planningStep.click();

    await waitFor(() => {
      expect(api.updateProject).toHaveBeenCalledWith("token-123", "p1", {
        governanceStage: "PLANNING",
      });
    });
  });
});
