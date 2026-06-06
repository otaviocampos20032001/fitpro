import { type NextRequest, NextResponse } from "next/server";

// Auth is handled client-side via localStorage (avoids ISO-8859-1 cookie header bug)
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
