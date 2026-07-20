// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2026 the Mosaic authors

/*
 * Platform component definitions — components expressed purely as primitive
 * trees rather than bespoke React. This is the target model (step B): a
 * presentational component is data, not code, so any client renders it and a
 * module can define its own the same way.
 *
 * PosterCard is the first proof: if the primitive vocabulary can rebuild one of
 * the Shell's own components, it can build a module's. Interaction flourish that
 * needs real hover/animation (the play-overlay reveal) is intentionally dropped
 * here — that belongs to interactive primitives, not to static composition.
 */

import type { ComponentDefinition } from "@/sdui/template";

const posterCard: ComponentDefinition = {
  name: "PosterCard",
  params: { title: "Untitled" },
  template: {
    type: "Pressable",
    props: { action: { $bind: "action" }, lift: true, style: { gap: 2 } },
    children: [
      {
        // art
        type: "Box",
        props: {
          style: {
            position: "relative",
            radius: "md",
            overflow: "hidden",
            aspectRatio: "2 / 3",
            bg: "surface-raised",
            shadow: "1",
          },
        },
        children: [
          {
            type: "Image",
            props: {
              src: { $bind: "poster" },
              alt: { $bind: "title" },
              placeholder: { $bind: "mediaType" },
              style: { width: "full", height: "full" },
            },
          },
          {
            type: "Box",
            props: {
              $if: { $bind: "badge" },
              style: { position: "absolute", top: 2, left: 2, bg: "surface-overlay", radius: "sm", px: 2, py: 1 },
            },
            children: [{ type: "Text", props: { text: { $bind: "badge" }, style: { variant: "xs", weight: "medium" } } }],
          },
          {
            type: "Box",
            props: { $if: { $bind: "progress" }, style: { position: "absolute", left: 2, right: 2, bottom: 2 } },
            children: [{ type: "ProgressBar", props: { value: { $bind: "progress" } } }],
          },
        ],
      },
      {
        // meta
        type: "Box",
        children: [
          { type: "Text", props: { text: { $bind: "title" }, style: { variant: "sm", weight: "medium", lineClamp: 1 } } },
          {
            type: "Text",
            props: { $if: { $bind: "subtitle" }, text: { $bind: "subtitle" }, style: { variant: "xs", color: "text-muted" } },
          },
        ],
      },
    ],
  },
};

// tone → colour-token maps, shared by the feedback definitions.
const toneBg = {
  $match: {
    on: { $bind: "tone" },
    cases: { accent: "accent-quiet", success: "success-quiet", warning: "warning-quiet", danger: "danger-quiet", info: "info-quiet" },
    default: "surface-overlay",
  },
};
const toneFg = {
  $match: {
    on: { $bind: "tone" },
    cases: { accent: "accent", success: "success", warning: "warning", danger: "danger", info: "info" },
    default: "text-muted",
  },
};
const toneSolid = {
  $match: {
    on: { $bind: "tone" },
    cases: { accent: "accent", success: "success", warning: "warning", danger: "danger", info: "info" },
    default: "text-faint",
  },
};

/** Badge — tone drives a quiet tint background + solid text via $match. */
const badge: ComponentDefinition = {
  name: "Badge",
  params: { tone: "neutral" },
  template: {
    type: "Box",
    props: { style: { direction: "row", align: "center", bg: toneBg, color: toneFg, radius: "sm", px: 2 } },
    children: [{ type: "Text", props: { text: { $bind: "label" }, style: { variant: "xs", weight: "medium" } } }],
  },
};

/** StatusIndicator — a coloured dot + optional label. */
const statusIndicator: ComponentDefinition = {
  name: "StatusIndicator",
  params: { tone: "neutral" },
  template: {
    type: "Box",
    props: { style: { direction: "row", align: "center", gap: 2 } },
    children: [
      { type: "Box", props: { style: { width: 9, height: 9, radius: "pill", bg: toneSolid } } },
      { type: "Text", props: { $if: { $bind: "label" }, text: { $bind: "label" }, style: { variant: "sm", color: "text-muted" } } },
    ],
  },
};

/** Banner — tone drives the border colour + icon; title is optional. */
const banner: ComponentDefinition = {
  name: "Banner",
  params: { tone: "info" },
  template: {
    type: "Box",
    props: {
      style: {
        direction: "row",
        gap: 3,
        align: "start",
        px: 4,
        py: 3,
        radius: "md",
        bg: "surface-raised",
        border: true,
        borderColor: { $match: { on: { $bind: "tone" }, cases: { success: "success", warning: "warning", danger: "danger", info: "info" }, default: "border" } },
      },
    },
    children: [
      {
        type: "Icon",
        props: {
          name: { $match: { on: { $bind: "tone" }, cases: { success: "success", warning: "warning", danger: "error", info: "info" }, default: "info" } },
          color: toneSolid,
        },
      },
      {
        type: "Box",
        props: { style: { gap: 0 } },
        children: [
          { type: "Text", props: { $if: { $bind: "title" }, text: { $bind: "title" }, style: { variant: "sm", weight: "bold" } } },
          { type: "Text", props: { text: { $bind: "message" }, style: { variant: "sm" } } },
        ],
      },
    ],
  },
};

/** PersonChip — avatar (with letter fallback) + name/role. */
const personChip: ComponentDefinition = {
  name: "PersonChip",
  template: {
    type: "Pressable",
    props: { action: { $bind: "action" }, style: { direction: "row", align: "center", gap: 3, p: 1, radius: "md" } },
    children: [
      {
        type: "Box",
        props: { style: { width: 42, height: 42, radius: "pill", overflow: "hidden", bg: "surface-overlay", align: "center", justify: "center" } },
        children: [{ type: "Image", props: { src: { $bind: "avatar" }, placeholder: { $bind: "name" }, style: { width: "full", height: "full" } } }],
      },
      {
        type: "Box",
        children: [
          { type: "Text", props: { text: { $bind: "name" }, style: { variant: "sm", weight: "medium" } } },
          { type: "Text", props: { $if: { $bind: "role" }, text: { $bind: "role" }, style: { variant: "xs", color: "text-muted" } } },
        ],
      },
    ],
  },
};

/** SourcePicker — one Pressable per source via $each + dot-path bindings. */
const sourcePicker: ComponentDefinition = {
  name: "SourcePicker",
  template: {
    type: "Box",
    props: { style: { gap: 2 } },
    children: [
      {
        type: "Pressable",
        props: {
          $each: { $bind: "sources" },
          $as: "s",
          action: { $bind: "s.action" },
          style: { direction: "row", align: "center", gap: 3, px: 4, py: 3, radius: "md", border: true, bg: "surface-raised" },
        },
        children: [
          { type: "Icon", props: { name: "play", color: "accent" } },
          { type: "Text", props: { text: { $bind: "s.label" }, style: { variant: "md", weight: "medium" } } },
          { type: "Spacer", props: { grow: true } },
          { type: "Text", props: { $if: { $bind: "s.quality" }, text: { $bind: "s.quality" }, style: { variant: "xs", color: "accent" } } },
          { type: "Text", props: { $if: { $bind: "s.provider" }, text: { $bind: "s.provider" }, style: { variant: "xs", color: "text-faint" } } },
        ],
      },
    ],
  },
};

/** EmptyState — icon medallion + copy + an optional action (Outlet). */
const emptyState: ComponentDefinition = {
  name: "EmptyState",
  params: { icon: "grid", title: "Nothing here yet" },
  template: {
    type: "Box",
    props: { style: { align: "center", gap: 3, py: 7, px: 4 } },
    children: [
      {
        type: "Box",
        props: { style: { width: 64, height: 64, radius: "pill", bg: "surface-raised", align: "center", justify: "center", color: "text-faint" } },
        children: [{ type: "Icon", props: { name: { $bind: "icon" }, size: 26 } }],
      },
      { type: "Text", props: { text: { $bind: "title" }, style: { variant: "lg", weight: "bold" } } },
      { type: "Text", props: { $if: { $bind: "message" }, text: { $bind: "message" }, style: { color: "text-muted", align: "center" } } },
      { type: "Outlet", props: { name: "action" } },
    ],
  },
};

export const PLATFORM_DEFINITIONS: ComponentDefinition[] = [
  posterCard,
  badge,
  statusIndicator,
  banner,
  personChip,
  sourcePicker,
  emptyState,
];
