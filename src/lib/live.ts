// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2026 the Mosaic authors

/*
 * The live session client (ADR 0032): one WebSocket to the Platform. It sends
 * intents (navigate / input / invoke) and receives UI updates (shell / render a
 * region / toast). The Shell owns the socket; the SDUI runtime dispatches
 * through it. Reconnection beyond a single attempt is a later concern.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastItem, Tone, UINode } from "@mosaic-media/sdui-react";

export type LiveStatus = "connecting" | "open" | "closed";

interface Live {
  status: LiveStatus;
  shell: UINode | null;
  content: UINode | null;
  toasts: ToastItem[];
  send: (intent: Record<string, unknown>) => void;
  dismissToast: (id: string) => void;
}

let seq = 0;

/** Opens the live session once the session id is known, exposing the pushed
 *  shell/content and a way to stream intents up. */
export function useLive(session: string | null): Live {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [shell, setShell] = useState<UINode | null>(null);
  const [content, setContent] = useState<UINode | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const pushToast = useCallback((message: string, tone: Tone) => {
    const id = `toast-${++seq}`;
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    if (!session) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      ws.send(JSON.stringify({ kind: "hello", session }));
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as { t: string; region?: string; node?: UINode; message?: string; tone?: Tone };
      if (msg.t === "shell") setShell(msg.node ?? null);
      else if (msg.t === "render" && msg.region === "content") setContent(msg.node ?? null);
      else if (msg.t === "toast") pushToast(msg.message ?? "", msg.tone ?? "neutral");
    };
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("closed");

    return () => ws.close();
  }, [session, pushToast]);

  const send = useCallback((intent: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(intent));
  }, []);

  return { status, shell, content, toasts, send, dismissToast };
}
