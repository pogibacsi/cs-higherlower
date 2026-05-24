import { NextResponse, type NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CS2 Higher/Lower Admin"'
    }
  });
}

function isAdminRequest(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const directPassword = request.headers.get("x-admin-password");
  if (directPassword === password) return true;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;

  try {
    const decoded = atob(auth.slice("Basic ".length));
    const [, suppliedPassword] = decoded.split(":");
    return suppliedPassword === password;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
