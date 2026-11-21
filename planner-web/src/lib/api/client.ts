import { signInPath } from "@/lib/auth";
import type { ApiErrorBody } from "./types";

/** A failed API call. `code` and `field` choose the Thai text shown to the Owner. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Calls the API through this origin and returns the JSON body, or throws ApiError.
 * A call rejected for lack of a session sends the browser to the sign-in page.
 */
export async function api<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network", "cannot reach the server");
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(response.status, "internal", "the server sent a response that is not JSON");
  }

  if (!response.ok) {
    const error = (data as Partial<ApiErrorBody> | undefined)?.error;
    const apiError = new ApiError(
      response.status,
      error?.code ?? "internal",
      error?.message ?? response.statusText,
      error?.field,
    );
    if (apiError.code === "unauthorized" && typeof window !== "undefined") {
      window.location.assign(signInPath(window.location.pathname + window.location.search));
    }
    throw apiError;
  }
  return data as T;
}
