import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./client";

function respondWith(status: number, body: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("returns the JSON body of a successful call", async () => {
    respondWith(200, '{"status":"ok"}');
    await expect(api("GET", "/health")).resolves.toEqual({ status: "ok" });
    expect(fetch).toHaveBeenCalledWith("/api/health", expect.objectContaining({ method: "GET" }));
  });

  it("turns the API error shape into an ApiError with code and field", async () => {
    respondWith(
      422,
      '{"error":{"code":"validation_failed","message":"due date is required","field":"dueDate"}}',
    );
    const error = await api("POST", "/tasks", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: "validation_failed", field: "dueDate" });
  });

  it("reports an unreachable server as a network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("failed to fetch"))));
    await expect(api("GET", "/health")).rejects.toMatchObject({ code: "network" });
  });

  it("reports a non-JSON response as an internal error", async () => {
    respondWith(502, "<html>Bad Gateway</html>");
    await expect(api("GET", "/health")).rejects.toMatchObject({ status: 502, code: "internal" });
  });
});
