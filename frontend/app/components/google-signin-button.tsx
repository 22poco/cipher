"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ApiError, fetchAuthConfig, loginWithGoogle } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { GoogleGlyph } from "./auth-shell";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const GIS_SRC = "https://accounts.google.com/gsi/client";

// Minimal shape of the Google Identity Services global we use.
type GoogleId = {
  initialize: (config: Record<string, unknown>) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });
}

/**
 * Google sign-in that keeps the mockup's custom button: the real (accessible)
 * Google Identity Services button is rendered transparently on top of a styled
 * button so clicks hit Google while the user sees Cipher's design. The ID token
 * Google returns is verified server-side (`POST /auth/google`, baisedu.org only).
 */
export function GoogleSignInButton({
  onError,
  onBusyChange,
}: {
  onError: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        onError("Google sign-in was cancelled.");
        return;
      }
      setBusy(true);
      onBusyChange?.(true);
      try {
        const auth = await loginWithGoogle(response.credential);
        saveSession(auth);
        router.push(auth.user.role === "student" ? "/dashboard" : "/teacher");
      } catch (err) {
        onError(
          err instanceof ApiError ? err.message : "We couldn't sign you in with Google.",
        );
        setBusy(false);
        onBusyChange?.(false);
      }
    },
    [onError, onBusyChange, router],
  );

  const renderOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const id = window.google?.accounts?.id;
    if (!overlay || !id) return;
    overlay.innerHTML = "";
    const width = Math.round(containerRef.current?.clientWidth ?? 240);
    id.renderButton(overlay, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: String(Math.min(400, Math.max(200, width))),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      let config;
      try {
        config = await fetchAuthConfig();
      } catch {
        return; // backend unreachable — leave the fallback button in place
      }
      if (cancelled || !config.google_enabled || !config.google_client_id) return;
      try {
        await loadGisScript();
      } catch {
        return;
      }
      const id = window.google?.accounts?.id;
      if (cancelled || !id) return;
      id.initialize({
        client_id: config.google_client_id,
        callback: handleCredential,
        ux_mode: "popup",
        hosted_domain: config.google_allowed_domain || undefined,
      });
      renderOverlay();
      setReady(true);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [handleCredential, renderOverlay]);

  useEffect(() => {
    if (!ready) return;
    const onResize = () => renderOverlay();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready, renderOverlay]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          // Only reachable before GIS is wired up; the transparent overlay
          // intercepts the click once Google is ready.
          if (!ready) onError("Google sign-in is still loading — try again in a moment.");
        }}
        className={`inline-flex h-[58px] w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-base font-semibold text-navy transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 ${
          ready ? "pointer-events-none" : ""
        }`}
      >
        {busy ? (
          <>
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            <GoogleGlyph />
            Continue with Google
          </>
        )}
      </button>
      {/* Real Google button, transparent, centered so its click area lines up. */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 grid place-items-center overflow-hidden opacity-0 ${
          busy ? "pointer-events-none" : ""
        }`}
        aria-hidden={!ready}
      />
    </div>
  );
}
