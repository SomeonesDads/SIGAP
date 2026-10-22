import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";
  return raw.replace(/\/+$/, "");
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const joinedPath = (path || []).join("/");
  const search = req.nextUrl.search || "";
  const targetUrl = `${getBackendBaseUrl()}/api/${joinedPath}${search}`;

  try {
    const headers = new Headers();
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const accept = req.headers.get("accept");
    if (accept) headers.set("accept", accept);

    const init: RequestInit = {
      method: req.method,
      headers,
      cache: "no-store",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await req.arrayBuffer();
    }

    const upstream = await fetch(targetUrl, init);
    const resHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) resHeaders.set("content-type", upstreamType);
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) resHeaders.set("content-disposition", disposition);

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upstream backend unreachable", detail: String(err), targetUrl },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context);
}
