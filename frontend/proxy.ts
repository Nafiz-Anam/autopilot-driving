import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const isStudentRoute = nextUrl.pathname.startsWith("/student");
  const isInstructorRoute = nextUrl.pathname.startsWith("/instructor");
  const isProtected = isStudentRoute || isInstructorRoute;

  if (isProtected && !session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isStudentRoute && session?.user?.role === "INSTRUCTOR") {
    return NextResponse.redirect(new URL("/instructor/dashboard", nextUrl.origin));
  }

  if (isInstructorRoute && session?.user?.role === "STUDENT") {
    return NextResponse.redirect(new URL("/student/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/student/:path*", "/instructor/:path*"],
};
