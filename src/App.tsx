// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2026 the Mosaic authors

/*
 * The Shell is a pure renderer over a live session (ADR 0031 + 0032). It signs
 * in, opens one WebSocket, and renders whatever the Platform pushes: the app
 * shell, and its content region. It streams intents up — navigate, search input
 * (as-you-type), invoke — and applies the pushed updates. It owns only the
 * connection, a client-only Standby state, and the SDUI runtime.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShellProvider, RenderNode, OverlayHost, ToastHost, refreshArtLight } from "@mosaic-media/sdui-react";
import type { UINode } from "@mosaic-media/sdui-react";
import { devSignIn } from "@/lib/session";
import { useLive } from "@/lib/live";

export function App() {
  const [session, setSession] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [screen, setScreen] = useState("search");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    refreshArtLight();
  }, []);

  // Sign in once; the socket opens as soon as we have a session.
  useEffect(() => {
    let cancelled = false;
    devSignIn().then(
      (s) => !cancelled && setSession(s),
      (e: unknown) => !cancelled && setAuthError(e instanceof Error ? e.message : "Sign-in failed"),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const { status, shell, content, toasts, send, dismissToast } = useLive(session);

  const navigate = useCallback(
    (screenName: string, params?: Record<string, unknown>) => {
      setScreen(screenName);
      send({ kind: "navigate", screen: screenName, params });
    },
    [send],
  );
  const onInvoke = useCallback(
    (mutation: string, input?: Record<string, unknown>) => send({ kind: "invoke", mutation, input }),
    [send],
  );
  const onInput = useCallback(
    (value: string) => {
      setScreen("search");
      send({ kind: "input", value });
    },
    [send],
  );

  // Put the pushed content into the shell's content region.
  const composed = useMemo<UINode | null>(() => {
    if (!shell) return null;
    const inner: UINode = content ?? { type: "Fragment" };
    return { ...shell, slots: { ...(shell.slots ?? {}), content: [inner] } };
  }, [shell, content]);

  if (authError) return <Standby title="Can’t reach the Platform" message={authError} />;
  if (status === "closed") return <Standby title="Disconnected" message="Lost the connection to the Mosaic Platform." />;
  if (!composed) return <Standby title="Connecting…" message="Opening a live session with the Mosaic Platform." />;

  return (
    <ShellProvider
      screen={screen}
      onNavigate={navigate}
      onBack={() => {}}
      onInvoke={onInvoke}
      onInput={onInput}
      render={({ overlays, dismissOverlay }) => (
        <>
          <OverlayHost overlays={overlays} onDismiss={dismissOverlay} />
          <ToastHost toasts={toasts} onDismiss={dismissToast} />
        </>
      )}
    >
      <RenderNode node={composed} />
    </ShellProvider>
  );
}

/** Standby — the Shell's only self-rendered UI (ADR 0031): shown when there is
 *  no live session to render from. Deliberately minimal — not a fake app. */
function Standby({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        height: "100vh",
        textAlign: "center",
        color: "var(--color-text, #e8e8ea)",
        background: "var(--color-bg, #0b0b0f)",
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}mosaic-icon-dark.png`}
        alt="Mosaic"
        width={44}
        height={44}
        style={{ opacity: 0.9 }}
      />
      <h1 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{title}</h1>
      <p style={{ opacity: 0.6, margin: 0, fontSize: "0.9rem" }}>{message}</p>
    </div>
  );
}
