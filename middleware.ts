import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};

function isLocalRequest(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function unauthorized(message = "Authentication required.") {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="CS2 Higher Lower Admin"'
    }
  });
}

function decodeBase64(value: string) {
  if (typeof atob === "function") return atob(value);
  return Buffer.from(value, "base64").toString("utf8");
}

function validBasicAuth(header: string | null, password: string) {
  if (!header?.startsWith("Basic ")) return false;

  try {
    const decoded = decodeBase64(header.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return false;

    return decoded.slice(separatorIndex + 1) === password;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return isLocalRequest(request)
      ? NextResponse.next()
      : new NextResponse("Admin password is not configured.", { status: 503 });
  }

  if (!validBasicAuth(request.headers.get("authorization"), password)) {
    return unauthorized();
  }

  return NextResponse.next();
}
