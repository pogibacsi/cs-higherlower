import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function hashUserAgent(userAgent: string | null) {
  if (!userAgent) return null;
  return createHash("sha256").update(userAgent).digest("hex");
}

export function sanitizeNickname(nickname: string) {
  return nickname
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function requestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function isSafeHttpUrl(url: string | null | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getRequestHostSource(request: NextRequest) {
  return getHostFromOriginOrReferer(
    request.headers.get("origin"),
    request.headers.get("referer")
  );
}

export function getHostFromOriginOrReferer(
  origin: string | null,
  referer: string | null
) {
  const source = origin || referer;
  if (!source) return null;

  try {
    return new URL(source).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedEmbedDomain(
  host: string | null,
  allowedDomains: string[]
) {
  if (allowedDomains.length === 0 || !host) return true;
  return allowedDomains.some((domain) => {
    const normalized = domain.toLowerCase().replace(/^\*\./, "");
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}
