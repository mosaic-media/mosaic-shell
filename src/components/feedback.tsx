// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2026 the Mosaic authors

/*
 * Feedback & state — the native leaves.
 *
 * Skeleton stays native: its shimmer is a keyframe animation, outside the
 * static primitive vocabulary. ErrorState stays native: it maps a Platform
 * error CATEGORY to a tone + title, logic a template can't compute. The purely
 * presentational members (Badge, Banner, StatusIndicator, EmptyState) moved to
 * primitive definitions in components/definitions.ts.
 */

import type { Action, PlatformErrorCategory, Tone, UINode } from "@/sdui/types";
import { prop } from "@/sdui/registry";
import { useRuntime } from "@/sdui/context";
import { cx, Icon, type IconName } from "./shared";

const TONE_ICON: Record<Tone, IconName> = {
  neutral: "info",
  accent: "info",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
};

/** How each Platform error category presents. */
const CATEGORY: Record<PlatformErrorCategory, { tone: Tone; title: string }> = {
  InvalidArgument: { tone: "warning", title: "That didn't look right" },
  Unauthenticated: { tone: "info", title: "Please sign in" },
  PermissionDenied: { tone: "warning", title: "Not allowed" },
  NotFound: { tone: "neutral", title: "Nothing here" },
  Conflict: { tone: "warning", title: "Already exists" },
  Unavailable: { tone: "danger", title: "Platform unavailable" },
  Internal: { tone: "danger", title: "Something went wrong" },
};

/** Skeleton — shimmer placeholder. `shape` picks a preset silhouette. */
export function Skeleton({ node }: { node: UINode }) {
  const shape = prop<"poster" | "line" | "block" | "circle">(node, "shape", "block");
  const count = prop<number>(node, "count", 1);
  return (
    <div className={cx("msc-skeleton-group", shape === "poster" && "msc-skeleton-group--rail")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cx("msc-skeleton", `msc-skeleton--${shape}`)} />
      ))}
    </div>
  );
}

export function ErrorState({ node }: { node: UINode }) {
  const { emit } = useRuntime();
  const category = prop<PlatformErrorCategory>(node, "category", "Internal");
  const message = prop<string | undefined>(node, "message", undefined);
  const retry = prop<Action | undefined>(node, "retry", undefined);
  const preset = CATEGORY[category];
  return (
    <div className={cx("msc-errorstate", `msc-errorstate--${preset.tone}`)}>
      <Icon name={TONE_ICON[preset.tone]} className="msc-errorstate__icon" />
      <h3 className="msc-errorstate__title">{preset.title}</h3>
      {message && <p className="msc-errorstate__message">{message}</p>}
      <p className="msc-errorstate__category">{category}</p>
      {retry && (
        <button className="msc-btn msc-btn--secondary" onClick={() => emit(retry)}>
          <span>Try again</span>
        </button>
      )}
    </div>
  );
}
