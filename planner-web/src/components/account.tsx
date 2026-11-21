"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { SessionResponse } from "@/lib/api/types";

/**
 * The signed-in Owner's email. Loading it also confirms the session is still
 * valid: a rejected session sends the browser to the sign-in page.
 */
export function OwnerEmail() {
  const [email, setEmail] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    api<SessionResponse>("GET", "/session")
      .then(({ owner }) => {
        if (!cancelled) setEmail(owner.email);
      })
      .catch(() => {
        // Unauthorized already redirects; other failures leave the email blank.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="block truncate text-sm text-muted" title={email}>
      {email ?? " "}
    </span>
  );
}

/** Signs out, deleting the session at once (D17, story 4). */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await api("DELETE", "/session");
      router.replace("/sign-in");
    } catch (error) {
      setBusy(false);
      toast.error("ออกจากระบบไม่สำเร็จ", { description: errorText(error) });
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      aria-label="ออกจากระบบ"
      title="ออกจากระบบ"
      className="inline-flex size-10 items-center justify-center rounded-xl text-muted hover:bg-primary-soft hover:text-danger disabled:opacity-50"
    >
      <LogOut className="size-5" aria-hidden />
    </button>
  );
}
