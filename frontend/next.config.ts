import type { NextConfig } from "next";

function csv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function devOriginHost(value: string): string | null {
  try {
    const candidate = value.includes("://") ? value : `http://${value}`;
    return new URL(candidate).hostname || null;
  } catch {
    return value.replace(/:\d+$/, "") || null;
  }
}

function isString(value: string | null): value is string {
  return value !== null;
}

const allowedDevOrigins = Array.from(
  new Set(csv(process.env.NEXT_ALLOWED_DEV_ORIGINS).map(devOriginHost).filter(isString)),
);
const backendProxyTarget = (
  process.env.NEXT_BACKEND_PROXY_TARGET || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
