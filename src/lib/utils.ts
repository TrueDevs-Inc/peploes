import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import {
  HTML_ENTITIES,
  HTML_TEXT_PATTERNS,
  UNICODE_MAX_CODE_POINT,
} from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isClientSide(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isServerSide(): boolean {
  return !isClientSide();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function decodeEntity(entity: string, name: string): string {
  if (!name.startsWith("#")) {
    return HTML_ENTITIES[name] ?? entity;
  }
  const hex = name[1] === "x" || name[1] === "X";
  const code = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
  return code > 0 && code <= UNICODE_MAX_CODE_POINT
    ? String.fromCodePoint(code)
    : entity;
}

export function htmlToParagraphs(html: string): string[] {
  return html
    .replace(HTML_TEXT_PATTERNS.hidden, "")
    .replace(HTML_TEXT_PATTERNS.space, " ")
    .replace(HTML_TEXT_PATTERNS.blockEnd, "\n")
    .replace(HTML_TEXT_PATTERNS.tag, "")
    .split("\n")
    .map((paragraph) =>
      paragraph
        .replace(HTML_TEXT_PATTERNS.entity, decodeEntity)
        .replace(HTML_TEXT_PATTERNS.space, " ")
        .trim(),
    )
    .filter(Boolean);
}
