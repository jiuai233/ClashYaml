import { randomBytes } from "crypto";
import type { RuleOptions } from "./clash";

export type StoredLink = {
  slug: string;
  config: string;
  options: RuleOptions;
  createdAt: number;
  expiresAt: number;
};

type StoreGlobal = typeof globalThis & {
  __vlessClashLinks?: Map<string, StoredLink>;
};

const globalStore = globalThis as StoreGlobal;
const links = globalStore.__vlessClashLinks ?? new Map<string, StoredLink>();
globalStore.__vlessClashLinks = links;

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;
const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,48}$/;

export function createLink(input: {
  slug?: string;
  config: string;
  options: RuleOptions;
  ttlSeconds?: number;
}): StoredLink {
  cleanupExpired();

  const slug = input.slug?.trim() || createSlug();
  if (!SLUG_PATTERN.test(slug)) {
    throw new LinkStoreError("短链只能包含字母、数字、下划线、短横线，长度 3-49。", 400);
  }

  if (links.has(slug)) {
    throw new LinkStoreError("这个短链名称已经被占用。", 409);
  }

  const now = Date.now();
  const ttlSeconds = normalizeTtl(input.ttlSeconds);
  const link: StoredLink = {
    slug,
    config: input.config,
    options: input.options,
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
  };

  links.set(slug, link);
  return link;
}

export function getLink(slug: string): StoredLink | null {
  cleanupExpired();

  const link = links.get(slug);
  if (!link) return null;

  if (link.expiresAt <= Date.now()) {
    links.delete(slug);
    return null;
  }

  return link;
}

export class LinkStoreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function createSlug(): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomBytes(6).toString("base64url");
    if (!links.has(slug)) return slug;
  }

  return `${Date.now().toString(36)}${randomBytes(3).toString("base64url")}`;
}

function normalizeTtl(value?: number): number {
  if (!Number.isFinite(value) || !value) return DEFAULT_TTL_SECONDS;
  return Math.min(Math.max(Math.floor(value), 60), 7 * 24 * 60 * 60);
}

function cleanupExpired(): void {
  const now = Date.now();

  for (const [slug, link] of links) {
    if (link.expiresAt <= now) links.delete(slug);
  }
}
