import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, signInPath } from "@/lib/auth";

// 1. Forwards /api/* to the Go API, so the browser only ever talks to this origin (D4).
//    API_URL is read at run time: the same build runs on any machine (D3).
// 2. Sends signed-out visitors to the sign-in page (story 6). This checks only that a
//    session cookie exists; the API validates it on every call, and an invalid cookie
//    is cleared by the API's 401 response.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: { code: "internal", message: "API_URL is not set" } },
        { status: 500 },
      );
    }
    return NextResponse.rewrite(new URL(pathname + search, apiUrl));
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (pathname === "/sign-in") {
    return hasSession ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!hasSession) {
    return NextResponse.redirect(new URL(signInPath(pathname + search), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
