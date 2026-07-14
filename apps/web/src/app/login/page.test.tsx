import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/lib/auth-context";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

describe("LoginPage", () => {
  it("renders email and password fields with a submit button", () => {
    renderLoginPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows a validation error when submitting without an email", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const errors = await screen.findAllByText(/required/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("links to the register page", () => {
    renderLoginPage();
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register"
    );
  });
});
