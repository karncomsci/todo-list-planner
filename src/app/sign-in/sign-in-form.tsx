"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { safeReturnPath } from "@/lib/auth";
import { api, ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { SessionResponse, SignInRequest } from "@/lib/api/types";

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger";

export function SignInForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string; field?: string }>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const request: SignInRequest = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      remember: form.get("remember") === "on",
    };

    setBusy(true);
    setError(undefined);
    try {
      await api<SessionResponse>("POST", "/session", request);
      const next = new URLSearchParams(window.location.search).get("next");
      // A full navigation, so the proxy sees the new cookie.
      window.location.assign(safeReturnPath(next));
    } catch (err) {
      setBusy(false);
      setError({
        text: errorText(err),
        code: err instanceof ApiError ? err.code : undefined,
        field: err instanceof ApiError ? err.field : undefined,
      });
    }
  }

  // A wrong email or password marks both fields: the API does not say which one (story 5).
  const invalid = (field: string) =>
    error?.field === field || error?.code === "invalid_credentials" ? true : undefined;

  return (
    <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
      <label className="block text-sm font-medium">
        อีเมล
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          aria-invalid={invalid("email")}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        รหัสผ่าน
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={invalid("password")}
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-2.5 text-sm">
        <input name="remember" type="checkbox" className="size-4 accent-primary" />
        จดจำการเข้าสู่ระบบในอุปกรณ์นี้ 30 วัน
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {error.text}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-fg hover:opacity-90 disabled:opacity-60"
      >
        {busy && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
        เข้าสู่ระบบ
      </button>
    </form>
  );
}
