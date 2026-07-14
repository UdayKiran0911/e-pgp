import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "@/lib/auth-context";
import Home from "./page";

function renderHome() {
  return render(
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}

describe("Home", () => {
  it("renders the platform motto", () => {
    renderHome();
    expect(
      screen.getByText("Standardize. Govern. Audit. Deliver.")
    ).toBeInTheDocument();
  });

  it("renders the EPG Platform header", () => {
    renderHome();
    expect(screen.getByText("EPG Platform")).toBeInTheDocument();
  });

  it("shows sign in and register actions when logged out", async () => {
    renderHome();
    expect(await screen.findByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText("Register an organization")).toBeInTheDocument();
  });
});
