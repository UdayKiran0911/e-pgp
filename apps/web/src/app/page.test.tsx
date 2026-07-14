import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the platform motto", () => {
    render(<Home />);
    expect(
      screen.getByText("Standardize. Govern. Audit. Deliver.")
    ).toBeInTheDocument();
  });

  it("renders the EPG Platform header", () => {
    render(<Home />);
    expect(screen.getByText("EPG Platform")).toBeInTheDocument();
  });
});
