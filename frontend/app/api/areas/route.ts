import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostcodePrefix } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get("postcode");

    if (!postcode) {
      return NextResponse.json(
        { success: false, error: "postcode query param required" },
        { status: 400 }
      );
    }

    const prefix = getPostcodePrefix(postcode);

    const area = await prisma.area.findFirst({
      where: {
        postcodePrefix: { startsWith: prefix.slice(0, 3) },
        isActive: true,
      },
    });

    if (!area) {
      return NextResponse.json({
        success: true,
        data: { covered: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        covered: true,
        area: {
          id: area.id,
          name: area.name,
          postcodePrefix: area.postcodePrefix,
          description: area.description,
        },
      },
    });
  } catch (err) {
    console.error("[areas] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
