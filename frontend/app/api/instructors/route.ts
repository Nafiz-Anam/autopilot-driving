import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostcodePrefix } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get("postcode");
    const transmission = searchParams.get("transmission"); // optional
    const female = searchParams.get("female"); // optional "true"/"false"

    let postcodeFilter: string[] | undefined;

    if (postcode) {
      const prefix = getPostcodePrefix(postcode);
      // Try prefix, then first 2 chars as fallback
      postcodeFilter = [prefix, prefix.slice(0, 2)];
    }

    const instructors = await prisma.instructor.findMany({
      where: {
        isActive: true,
        ...(female === "true" ? { isFemale: true } : {}),
        ...(postcodeFilter
          ? {
              areas: {
                hasSome: postcodeFilter,
              },
            }
          : {}),
        ...(transmission
          ? {
              transmission: {
                has: transmission.toLowerCase(),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: instructors.map((inst) => ({
        id: inst.id,
        userId: inst.userId,
        bio: inst.bio,
        photoUrl: inst.photoUrl,
        rating: inst.rating,
        reviewCount: inst.reviewCount,
        yearsExp: inst.yearsExp,
        transmission: inst.transmission,
        areas: inst.areas,
        pricePerHour: Number(inst.pricePerHour),
        isFemale: inst.isFemale,
        isActive: inst.isActive,
        user: inst.user,
      })),
    });
  } catch (err) {
    console.error("[instructors] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
