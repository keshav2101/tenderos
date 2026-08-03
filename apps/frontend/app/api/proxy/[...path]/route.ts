import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel API Proxy — catches all /api/proxy/* requests and forwards them
 * to the backend. BACKEND_URL is a server-side env var (no NEXT_PUBLIC_ prefix),
 * so it's read at runtime — update it in Vercel dashboard any time the tunnel
 * URL changes, no rebuild required.
 */

// Runtime backend URL — set in Vercel env vars as BACKEND_URL
// Falls back to localhost for local dev
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tenderos-production.up.railway.app";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

async function proxy(
  req: NextRequest,
  params: { path: string[] }
) {
  const path = (params.path ?? []).join("/");
  const search = req.nextUrl.search || "";

  const targetUrl = `${BACKEND_URL.replace(/\/$/, "")}/api/v1/${path}${search}`;

  // Forward all headers except host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });
  headers.set("Bypass-Tunnel-Reminder", "true");

  let body: BodyInit | null = null;
  const method = req.method.toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      // @ts-expect-error — Node 18 fetch supports duplex
      duplex: "half",
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      // Skip hop-by-hop headers
      if (!["transfer-encoding", "connection", "keep-alive"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    // Allow cross-origin from Vercel frontend
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[proxy] upstream error:", err);
    return NextResponse.json(
      { detail: "Backend unreachable. Please try again shortly." },
      { status: 502 }
    );
  }
}
