import { test, expect } from "@playwright/test";

test("homepage shows the platform motto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Standardize. Govern. Audit. Deliver.")).toBeVisible();
});
