import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );

    const [
      totalUsers,
      totalInstructors,
      totalBookings,
      revenueResult,
      pendingApplications,
      newContactsToday,
      bookingsThisMonth,
      activeAreas,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.instructor.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.instructorApplication.count({ where: { status: "pending" } }),
      prisma.contactSubmission.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.area.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalInstructors,
      totalBookings,
      totalRevenue: Number(revenueResult._sum.totalAmount ?? 0),
      pendingApplications,
      newContactsToday,
      bookingsThisMonth,
      activeAreas,
    });
  } catch (err) {
    console.error("[admin/stats GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
