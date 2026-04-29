import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const isStudentRoute = nextUrl.pathname.startsWith("/student");
  const isInstructorRoute = nextUrl.pathname.startsWith("/instructor");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isProtected = isStudentRoute || isInstructorRoute || isAdminRoute;

  if (isProtected && !session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin users always go to admin dashboard
  if (session?.user?.role === "ADMIN" && (isStudentRoute || isInstructorRoute)) {
    return NextResponse.redirect(new URL("/admin/dashboard", nextUrl.origin));
  }

  // Non-admins cannot access admin routes
  if (isAdminRoute && session?.user?.role !== "ADMIN") {
    const fallback = session?.user?.role === "INSTRUCTOR" ? "/instructor/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(fallback, nextUrl.origin));
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
  matcher: ["/student/:path*", "/instructor/:path*", "/admin/:path*"],
};
