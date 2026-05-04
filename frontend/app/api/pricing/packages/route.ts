import { NextResponse } from "next/server";
import type { LessonType } from "@prisma/client";
import { listPackagesForLessonType } from "@/lib/lesson-pricing";

const LESSON_TYPES: LessonType[] = [
  "MANUAL",
  "AUTOMATIC",
  "INTENSIVE",
  "REFRESHER",
  "PASS_PLUS",
  "THEORY",
];

/** Query: `lessonType` (preferred) — returns packages for one lesson category. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonType = searchParams.get("lessonType") as LessonType | null;
    if (!lessonType || !LESSON_TYPES.includes(lessonType)) {
      return NextResponse.json(
        { success: false, error: "lessonType query required (e.g. MANUAL)" },
        { status: 400 }
      );
    }

    const data = await listPackagesForLessonType(lessonType);
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("[pricing/packages GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
