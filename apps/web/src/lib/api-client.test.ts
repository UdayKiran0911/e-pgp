import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api-client";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: "Error",
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe("api client", () => {
  it("returns the parsed body on a successful login", async () => {
    mockFetchOnce(200, {
      accessToken: "token-123",
      user: { id: "u1", email: "a@b.com" },
    });

    const result = await api.login({ email: "a@b.com", password: "password1" });

    expect(result.accessToken).toBe("token-123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws an ApiError with the server message on failure", async () => {
    mockFetchOnce(401, { message: "Invalid email or password." });

    await expect(
      api.login({ email: "a@b.com", password: "wrong" })
    ).rejects.toThrow(ApiError);
    await expect(
      api.login({ email: "a@b.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password.");
  });

  it("attaches the bearer token for authenticated requests", async () => {
    mockFetchOnce(200, { id: "u1", email: "a@b.com" });

    await api.me("token-123");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
      })
    );
  });
});
