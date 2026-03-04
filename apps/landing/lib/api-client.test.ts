import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchApi } from "./api-client";

describe("fetchApi", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("prepends the default API URL to the path", async () => {
    await fetchApi("/v1/test");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/v1/test",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("always sets credentials to include", async () => {
    await fetchApi("/v1/endpoint");

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(calledInit.credentials).toBe("include");
  });

  it("merges additional RequestInit options", async () => {
    await fetchApi("/v1/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "value" }),
    });

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(calledInit.method).toBe("POST");
    expect(calledInit.headers).toEqual({ "Content-Type": "application/json" });
    expect(calledInit.body).toBe(JSON.stringify({ key: "value" }));
    expect(calledInit.credentials).toBe("include");
  });

  it("credentials: include overrides any passed credentials value", async () => {
    await fetchApi("/v1/secure", { credentials: "same-origin" } as RequestInit);

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    // The spread puts init first, then credentials overwrites
    expect(calledInit.credentials).toBe("include");
  });

  it("returns the fetch Response", async () => {
    const mockResponse = new Response(JSON.stringify({ data: "test" }), {
      status: 200,
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await fetchApi("/v1/resource");
    expect(result).toBe(mockResponse);
  });

  it("works with no init argument", async () => {
    await fetchApi("/v1/health");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/v1/health",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("propagates fetch errors", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network failure")
    );

    await expect(fetchApi("/v1/broken")).rejects.toThrow("Network failure");
  });
});
