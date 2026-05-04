import type { LessonType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addYears } from "date-fns";
import { prisma } from "../lib/prisma";

type PkgSeed = {
  slug: string;
  name: string;
  hours: number;
  lessons: number;
  price: number;
  pricePerHour: number | null;
  savings: number | null;
  footerNote: string | null;
  badge: string | null;
  isPopular: boolean;
  sortOrder: number;
};

async function seedLessonPricing() {
  const categories: {
    lessonType: LessonType;
    slug: string;
    displayName: string;
    description: string | null;
    sortOrder: number;
    packages: PkgSeed[];
  }[] = [
    {
      lessonType: "MANUAL",
      slug: "manual",
      displayName: "Manual Driving Lessons",
      description: null,
      sortOrder: 0,
      packages: [
        {
          slug: "single",
          name: "1 Hour",
          hours: 1,
          lessons: 1,
          price: 42,
          pricePerHour: 42,
          savings: null,
          footerNote: "Pay per lesson",
          badge: null,
          isPopular: false,
          sortOrder: 0,
        },
        {
          slug: "block5",
          name: "5 Hours",
          hours: 5,
          lessons: 5,
          price: 195,
          pricePerHour: 39,
          savings: 15,
          footerNote: "£195 block booked",
          badge: "Most Popular",
          isPopular: true,
          sortOrder: 1,
        },
        {
          slug: "block10",
          name: "10 Hours",
          hours: 10,
          lessons: 10,
          price: 380,
          pricePerHour: 38,
          savings: 40,
          footerNote: "£380 block booked",
          badge: null,
          isPopular: false,
          sortOrder: 2,
        },
        {
          slug: "block20",
          name: "20 Hours",
          hours: 20,
          lessons: 20,
          price: 720,
          pricePerHour: 36,
          savings: 120,
          footerNote: "£720 block booked",
          badge: null,
          isPopular: false,
          sortOrder: 3,
        },
      ],
    },
    {
      lessonType: "AUTOMATIC",
      slug: "automatic",
      displayName: "Automatic Driving Lessons",
      description: null,
      sortOrder: 1,
      packages: [
        {
          slug: "single",
          name: "1 Hour",
          hours: 1,
          lessons: 1,
          price: 44,
          pricePerHour: 44,
          savings: null,
          footerNote: "Pay per lesson",
          badge: null,
          isPopular: false,
          sortOrder: 0,
        },
        {
          slug: "block5",
          name: "5 Hours",
          hours: 5,
          lessons: 5,
          price: 205,
          pricePerHour: 41,
          savings: 15,
          footerNote: "£205 block booked",
          badge: null,
          isPopular: false,
          sortOrder: 1,
        },
        {
          slug: "block10",
          name: "10 Hours",
          hours: 10,
          lessons: 10,
          price: 400,
          pricePerHour: 40,
          savings: 40,
          footerNote: "£400 block booked",
          badge: "Most Popular",
          isPopular: true,
          sortOrder: 2,
        },
        {
          slug: "block20",
          name: "20 Hours",
          hours: 20,
          lessons: 20,
          price: 800,
          pricePerHour: 40,
          savings: 80,
          footerNote: "£800 block booked",
          badge: null,
          isPopular: false,
          sortOrder: 3,
        },
      ],
    },
    {
      lessonType: "INTENSIVE",
      slug: "intensive",
      displayName: "Intensive Lesson Packages",
      description: null,
      sortOrder: 2,
      packages: [
        {
          slug: "hours-10",
          name: "10 Hours",
          hours: 10,
          lessons: 10,
          price: 380,
          pricePerHour: 38,
          savings: null,
          footerNote: "Ideal for experienced drivers",
          badge: null,
          isPopular: false,
          sortOrder: 0,
        },
        {
          slug: "hours-20",
          name: "20 Hours",
          hours: 20,
          lessons: 20,
          price: 720,
          pricePerHour: 36,
          savings: null,
          footerNote: "Ideal for intermediate drivers",
          badge: "Best Value",
          isPopular: true,
          sortOrder: 1,
        },
        {
          slug: "hours-30",
          name: "30 Hours",
          hours: 30,
          lessons: 30,
          price: 1050,
          pricePerHour: 35,
          savings: null,
          footerNote: "Ideal for beginner drivers",
          badge: null,
          isPopular: false,
          sortOrder: 2,
        },
        {
          slug: "hours-40",
          name: "40 Hours",
          hours: 40,
          lessons: 40,
          price: 1380,
          pricePerHour: 34.5,
          savings: null,
          footerNote: "Ideal for beginner drivers",
          badge: null,
          isPopular: false,
          sortOrder: 3,
        },
        {
          slug: "hours-50",
          name: "50 Hours",
          hours: 50,
          lessons: 50,
          price: 1700,
          pricePerHour: 34,
          savings: null,
          footerNote: "Ideal for new drivers",
          badge: null,
          isPopular: false,
          sortOrder: 4,
        },
        {
          slug: "retest",
          name: "Retest Course",
          hours: 6,
          lessons: 6,
          price: 180,
          pricePerHour: 30,
          savings: null,
          footerNote: "For experienced drivers wanting to pass fast",
          badge: null,
          isPopular: false,
          sortOrder: 5,
        },
      ],
    },
    {
      lessonType: "REFRESHER",
      slug: "refresher",
      displayName: "Refresher Lessons",
      description: null,
      sortOrder: 3,
      packages: [
        {
          slug: "single",
          name: "1 Hour",
          hours: 1,
          lessons: 1,
          price: 42,
          pricePerHour: 42,
          savings: null,
          footerNote: "Pay per lesson",
          badge: null,
          isPopular: false,
          sortOrder: 0,
        },
        {
          slug: "block5",
          name: "5 Hours",
          hours: 5,
          lessons: 5,
          price: 195,
          pricePerHour: 39,
          savings: 15,
          footerNote: "£195 block booked",
          badge: null,
          isPopular: true,
          sortOrder: 1,
        },
        {
          slug: "block10",
          name: "10 Hours",
          hours: 10,
          lessons: 10,
          price: 380,
          pricePerHour: 38,
          savings: 40,
          footerNote: "£380 block booked",
          badge: null,
          isPopular: false,
          sortOrder: 2,
        },
      ],
    },
    {
      lessonType: "PASS_PLUS",
      slug: "pass-plus",
      displayName: "Pass Plus",
      description: null,
      sortOrder: 4,
      packages: [
        {
          slug: "full-course",
          name: "Pass Plus Course",
          hours: 6,
          lessons: 6,
          price: 260,
          pricePerHour: null,
          savings: null,
          footerNote: "6 modules — full programme",
          badge: null,
          isPopular: true,
          sortOrder: 0,
        },
      ],
    },
    {
      lessonType: "THEORY",
      slug: "theory",
      displayName: "Theory Training",
      description: null,
      sortOrder: 5,
      packages: [
        {
          slug: "portal-access",
          name: "Theory portal access",
          hours: 1,
          lessons: 1,
          price: 29,
          pricePerHour: null,
          savings: null,
          footerNote: "Full question bank and mock tests — adjust price in admin if included free",
          badge: null,
          isPopular: true,
          sortOrder: 0,
        },
      ],
    },
  ];

  for (const def of categories) {
    const cat = await prisma.lessonPricingCategory.upsert({
      where: { lessonType: def.lessonType },
      create: {
        lessonType: def.lessonType,
        slug: def.slug,
        displayName: def.displayName,
        description: def.description,
        sortOrder: def.sortOrder,
        isActive: true,
      },
      update: {
        slug: def.slug,
        displayName: def.displayName,
        description: def.description,
        sortOrder: def.sortOrder,
        isActive: true,
      },
    });

    for (const p of def.packages) {
      await prisma.lessonPricingPackage.upsert({
        where: { categoryId_slug: { categoryId: cat.id, slug: p.slug } },
        create: {
          categoryId: cat.id,
          slug: p.slug,
          name: p.name,
          hours: p.hours,
          lessons: p.lessons,
          price: p.price,
          pricePerHour: p.pricePerHour ?? undefined,
          savings: p.savings ?? undefined,
          footerNote: p.footerNote ?? undefined,
          badge: p.badge ?? undefined,
          isPopular: p.isPopular,
          sortOrder: p.sortOrder,
          isActive: true,
        },
        update: {
          name: p.name,
          hours: p.hours,
          lessons: p.lessons,
          price: p.price,
          pricePerHour: p.pricePerHour ?? null,
          savings: p.savings ?? null,
          footerNote: p.footerNote ?? null,
          badge: p.badge ?? null,
          isPopular: p.isPopular,
          sortOrder: p.sortOrder,
          isActive: true,
        },
      });
    }
  }
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const student = await prisma.user.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: { name: "Alice Student", email: "student@test.com", passwordHash, role: "STUDENT" },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@test.com" },
    update: {},
    create: { name: "James Williams", email: "instructor@test.com", passwordHash, role: "INSTRUCTOR" },
  });

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: { name: "Admin User", email: "admin@test.com", passwordHash, role: "ADMIN" },
  });

  const sarahUser = await prisma.user.upsert({
    where: { email: "sarah.ahmed@test.com" },
    update: {},
    create: { name: "Sarah Ahmed", email: "sarah.ahmed@test.com", passwordHash, role: "INSTRUCTOR" },
  });

  const davidUser = await prisma.user.upsert({
    where: { email: "david.patel@test.com" },
    update: {},
    create: { name: "David Patel", email: "david.patel@test.com", passwordHash, role: "INSTRUCTOR" },
  });

  const priyaUser = await prisma.user.upsert({
    where: { email: "priya.sharma@test.com" },
    update: {},
    create: { name: "Priya Sharma", email: "priya.sharma@test.com", passwordHash, role: "INSTRUCTOR" },
  });

  const michaelUser = await prisma.user.upsert({
    where: { email: "michael.obrien@test.com" },
    update: {},
    create: { name: "Michael O'Brien", email: "michael.obrien@test.com", passwordHash, role: "INSTRUCTOR" },
  });
  const areaData = [
    { name: "Slough",     postcodePrefix: "SL1",  description: "Slough town centre and surrounding areas (SL1, SL2, SL3)" },
    { name: "Windsor",    postcodePrefix: "SL4",  description: "Windsor, Eton, Old Windsor, Datchet" },
    { name: "Maidenhead", postcodePrefix: "SL6",  description: "Maidenhead, Bray, Cox Green, White Waltham" },
    { name: "Reading",    postcodePrefix: "RG1",  description: "Reading town centre, Caversham, Tilehurst, Earley (RG1-RG7)" },
    { name: "Wokingham",  postcodePrefix: "RG40", description: "Wokingham, Finchampstead, Arborfield, Barkham" },
    { name: "Bracknell",  postcodePrefix: "RG12", description: "Bracknell, Sandhurst, Crowthorne, College Town" },
    { name: "Staines",    postcodePrefix: "TW18", description: "Staines-upon-Thames, Stanwell, Ashford, Laleham" },
    { name: "Feltham",    postcodePrefix: "TW13", description: "Feltham, Hanworth, Bedfont, East Bedfont" },
    { name: "Hounslow",   postcodePrefix: "TW3",  description: "Hounslow, Isleworth, Heston, near Heathrow" },
  ];

  for (const area of areaData) {
    const existing = await prisma.area.findFirst({ where: { postcodePrefix: area.postcodePrefix } });
    if (!existing) await prisma.area.create({ data: { ...area, isActive: true } });
  }

  const james = await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      bio: "DVSA-approved instructor with 8 years of experience. Patient, friendly and great with nervous learners. Pass rate well above the national average.",
      rating: 4.9, reviewCount: 132, yearsExp: 8,
      transmission: ["manual", "automatic"], areas: ["SL1", "SL2", "SL3"],
      pricePerHour: 42, isFemale: false, isActive: true,
    },
  });

  const sarah = await prisma.instructor.upsert({
    where: { userId: sarahUser.id },
    update: {},
    create: {
      userId: sarahUser.id,
      bio: "Specialist in nervous learners and female students. Automatic expert covering Windsor and Maidenhead. Calm and encouraging approach.",
      rating: 4.8, reviewCount: 84, yearsExp: 5,
      transmission: ["automatic"], areas: ["SL4", "SL6", "RG1"],
      pricePerHour: 42, isFemale: true, isActive: true,
    },
  });

  const david = await prisma.instructor.upsert({
    where: { userId: davidUser.id },
    update: {},
    create: {
      userId: davidUser.id,
      bio: "Experienced manual instructor covering Reading and Bracknell. 12 years on the road. Clear communicator with a methodical teaching style.",
      rating: 4.7, reviewCount: 61, yearsExp: 12,
      transmission: ["manual"], areas: ["RG1", "RG7", "RG12"],
      pricePerHour: 40, isFemale: false, isActive: true,
    },
  });

  const priya = await prisma.instructor.upsert({
    where: { userId: priyaUser.id },
    update: {},
    create: {
      userId: priyaUser.id,
      bio: "Top-rated female instructor in Staines and Feltham. Both manual and automatic. Perfect 5-star rating with 3 years of dedicated teaching.",
      rating: 5.0, reviewCount: 52, yearsExp: 3,
      transmission: ["manual", "automatic"], areas: ["TW18", "TW19"],
      pricePerHour: 42, isFemale: true, isActive: true,
    },
  });

  const michael = await prisma.instructor.upsert({
    where: { userId: michaelUser.id },
    update: {},
    create: {
      userId: michaelUser.id,
      bio: "10 years experience, specialist in intensive courses and pass-plus. Covers Wokingham and Bracknell. Structured, efficient teaching for quick progress.",
      rating: 4.6, reviewCount: 203, yearsExp: 10,
      transmission: ["manual"], areas: ["RG40", "RG41", "RG12"],
      pricePerHour: 40, isFemale: false, isActive: true,
    },
  });

  const instructors = [james, sarah, david, priya, michael];
  const workDays = [1, 2, 3, 4, 5, 6];

  for (const inst of instructors) {
    for (const day of workDays) {
      const existing = await prisma.availability.findFirst({ where: { instructorId: inst.id, dayOfWeek: day } });
      if (!existing) {
        await prisma.availability.create({
          data: { instructorId: inst.id, dayOfWeek: day, startTime: "08:00", endTime: "18:00", isAvailable: true },
        });
      }
    }
  }

  const now = new Date();
  const twoDaysFromNow   = new Date(now.getTime() +  2 * 86400000);
  const sevenDaysFromNow = new Date(now.getTime() +  7 * 86400000);
  const fourteenDaysAgo  = new Date(now.getTime() - 14 * 86400000);

  for (const booking of [
    { reference: "APS-SEED01", scheduledAt: twoDaysFromNow,   status: "CONFIRMED" as const, paymentStatus: "PAID" as const },
    { reference: "APS-SEED02", scheduledAt: sevenDaysFromNow, status: "CONFIRMED" as const, paymentStatus: "PAID" as const },
    { reference: "APS-SEED03", scheduledAt: fourteenDaysAgo,  status: "COMPLETED" as const, paymentStatus: "PAID" as const },
  ]) {
    await prisma.booking.upsert({
      where: { reference: booking.reference },
      update: {},
      create: {
        reference: booking.reference, studentId: student.id, instructorId: james.id,
        lessonType: "MANUAL", transmission: "manual", scheduledAt: booking.scheduledAt,
        durationMins: 60, status: booking.status, paymentStatus: booking.paymentStatus, totalAmount: 42,
      },
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // Theory Questions — 60 questions across 5 categories (12 each)
  // Categories: road_signs | rules | safety | hazards | vehicle
  // ──────────────────────────────────────────────────────────────────
  await prisma.theoryQuestion.deleteMany({});

  const theoryQuestions = [
    // ── ROAD SIGNS (12) ──────────────────────────────────────────────
    { category: "road_signs", question: "What does a red circular sign indicate?", options: ["Warning of a hazard ahead", "A mandatory prohibition", "Advisory information only", "End of a restriction zone"], correctIndex: 1, explanation: "Red circular signs are mandatory prohibitions — they tell you what you must NOT do, such as no entry or speed limits." },
    { category: "road_signs", question: "What shape are warning signs on UK roads?", options: ["Circular with red border", "Rectangular with blue border", "Triangular with red border", "Octagonal with red border"], correctIndex: 2, explanation: "Warning signs in the UK are triangular with a red border. They alert drivers to hazards or changes in road conditions." },
    { category: "road_signs", question: "What does a blue circular sign mean?", options: ["A prohibition you must not do", "A warning of a hazard", "A mandatory positive instruction", "An advisory recommendation"], correctIndex: 2, explanation: "Blue circular signs give mandatory positive instructions — telling you what you MUST do, such as keep left or turn left ahead." },
    { category: "road_signs", question: "A sign shows a red circle with the number 40 inside. What does it mean?", options: ["Minimum speed of 40 mph", "Maximum speed of 40 mph", "Recommended speed of 40 mph", "Speed camera 40 metres ahead"], correctIndex: 1, explanation: "A red circle with a number is a speed limit sign — you must not exceed the number shown." },
    { category: "road_signs", question: "What does a red triangle with an exclamation mark mean?", options: ["Road closed ahead", "Level crossing without barrier", "Other danger ahead", "No vehicles allowed"], correctIndex: 2, explanation: "A triangular sign with an exclamation mark means other danger — a hazard not covered by a more specific sign." },
    { category: "road_signs", question: "What does a GIVE WAY sign require you to do?", options: ["Stop completely before proceeding", "Give priority to traffic on the major road", "Give way to pedestrians only", "Indicate and then proceed"], correctIndex: 1, explanation: "A Give Way sign means you must give priority to traffic on the road you are joining. You do not have to stop if it is clear." },
    { category: "road_signs", question: "When may you cross a double white centre line?", options: ["Any time if safe to do so", "Never under any circumstances", "Only if the line nearest to you is broken", "Only to turn into a side road on your right"], correctIndex: 2, explanation: "You may cross double white lines only when the line nearest to you is broken, and only if safe to overtake or access a side road." },
    { category: "road_signs", question: "What does a blue rectangular sign with a white P indicate?", options: ["Private road", "Parking permitted", "Police station ahead", "Petrol station ahead"], correctIndex: 1, explanation: "A blue rectangle with a white P indicates a parking place. It may also show restrictions such as maximum stay or charges." },
    { category: "road_signs", question: "A triangular sign shows a silhouette of a person digging. What does this mean?", options: ["Footpath closed ahead", "Roadworks ahead", "Archaeological site nearby", "No pedestrians beyond this point"], correctIndex: 1, explanation: "A person digging warns of roadworks ahead. Be prepared to slow down and follow any temporary signs or signals." },
    { category: "road_signs", question: "What colour are direction signs on a motorway?", options: ["White on blue", "White on green", "Black on yellow", "White on brown"], correctIndex: 1, explanation: "Motorway direction signs have white text and borders on a green background." },
    { category: "road_signs", question: "A red triangle shows two arrows forming a T shape. What does this mean?", options: ["Traffic lights ahead", "Two-way traffic ahead", "T-junction ahead", "Traffic merging from both sides"], correctIndex: 2, explanation: "A T-junction sign warns that the road ahead ends and you must turn either left or right." },
    { category: "road_signs", question: "What does a white circle with a black diagonal line through it mean?", options: ["No parking zone", "End of all local restrictions — national speed limit applies", "No entry", "End of motorway"], correctIndex: 1, explanation: "A white circle with a diagonal black bar means the national speed limit applies — 60 mph on single carriageway, 70 mph on dual carriageway or motorway." },

    // ── RULES OF THE ROAD (12) ────────────────────────────────────────
    { category: "rules", question: "What is the national speed limit on a single carriageway road for cars?", options: ["50 mph", "60 mph", "70 mph", "80 mph"], correctIndex: 1, explanation: "The national speed limit on a single carriageway for cars and motorcycles is 60 mph, unless signs indicate otherwise." },
    { category: "rules", question: "What is the maximum speed limit on a motorway for cars?", options: ["60 mph", "70 mph", "80 mph", "90 mph"], correctIndex: 1, explanation: "The maximum speed on a motorway for cars and motorcycles is 70 mph, unless variable speed limits are in force." },
    { category: "rules", question: "At a pelican crossing, what does a flashing amber light mean?", options: ["Stop and wait for the green signal", "Proceed — all pedestrians have crossed", "Give way to pedestrians still on the crossing", "Prepare to go"], correctIndex: 2, explanation: "Flashing amber at a pelican crossing means give way to pedestrians still on the crossing, but proceed if the crossing is clear." },
    { category: "rules", question: "When may you use the right-hand (outside) lane of a motorway?", options: ["Whenever you wish to drive faster", "Only when overtaking", "When travelling above 60 mph", "When towing a caravan"], correctIndex: 1, explanation: "The outside lane should only be used for overtaking. You must return to the left lane as soon as it is safe." },
    { category: "rules", question: "You are on a road with street lighting but no speed limit signs. What is the speed limit?", options: ["40 mph", "50 mph", "30 mph", "60 mph"], correctIndex: 2, explanation: "A road with street lighting but no speed limit signs has a default limit of 30 mph." },
    { category: "rules", question: "When must you stop your vehicle?", options: ["At a give way line if traffic is approaching", "At a pedestrian crossing when someone waits on the pavement", "When a police officer or traffic light signals you to stop", "When you see a speed camera ahead"], correctIndex: 2, explanation: "You must stop when directed by a police officer, a red traffic light, or a school crossing patrol with a raised Stop sign." },
    { category: "rules", question: "What does a continuous white line along the edge of the carriageway indicate?", options: ["No overtaking zone", "Edge of the carriageway — do not cross unless necessary", "Cycle lane boundary", "Bus stop area"], correctIndex: 1, explanation: "A continuous white edge line marks the boundary of the carriageway. Avoid crossing it except in an emergency or to turn." },
    { category: "rules", question: "On a motorway, which lane should you normally drive in?", options: ["Any lane based on your speed", "The left-hand lane", "The middle lane", "The right-hand lane"], correctIndex: 1, explanation: "Always drive in the left-hand lane unless overtaking. Staying in the middle or right lane when not overtaking is lane hogging and illegal." },
    { category: "rules", question: "At a crossroads both you and an oncoming vehicle want to turn right. What do you normally do?", options: ["Wait for the other vehicle to go first", "Pass offside to offside — keep the other vehicle to your right", "Pass nearside to nearside — keep the other vehicle to your left", "Sound your horn and proceed"], correctIndex: 1, explanation: "The normal rule is to pass offside to offside (right side to right side), keeping the other vehicle to your right. Follow road markings if present." },
    { category: "rules", question: "What is the minimum age to drive a car on public roads in the UK?", options: ["15", "16", "17", "18"], correctIndex: 2, explanation: "You can apply for a provisional licence at 16 but cannot drive on public roads until you are 17." },
    { category: "rules", question: "When is it legal to sound your horn?", options: ["To warn other road users of your presence when moving", "To greet a driver you recognise", "When stationary to get someone's attention", "To express frustration at other drivers"], correctIndex: 0, explanation: "You should only use your horn when moving to warn others of your presence. Never use it between 11:30pm and 7am in a built-up area." },
    { category: "rules", question: "Who has priority on a roundabout?", options: ["Vehicles already on the roundabout", "Vehicles approaching from the right", "Vehicles approaching from the left", "The largest vehicle"], correctIndex: 0, explanation: "Traffic already on a roundabout has priority. Give way to traffic coming from the right before entering." },

    // ── SAFETY (12) ──────────────────────────────────────────────────
    { category: "safety", question: "What is the total stopping distance at 70 mph in dry conditions?", options: ["53 metres (175 feet)", "75 metres (245 feet)", "96 metres (315 feet)", "120 metres (396 feet)"], correctIndex: 2, explanation: "At 70 mph the total stopping distance is around 96 metres — 21 m thinking distance plus 75 m braking distance." },
    { category: "safety", question: "What should you do before reversing?", options: ["Sound the horn to warn others", "Check all around for pedestrians, cyclists and other hazards", "Use hazard warning lights", "Switch on rear fog lights"], correctIndex: 1, explanation: "Before reversing, always check all around using mirrors and by looking over both shoulders. Never assume the area behind is clear." },
    { category: "safety", question: "When driving in fog, what should you do?", options: ["Use full beam headlights", "Use dipped headlights and rear fog lights when visibility is below 100 metres", "Switch on hazard warning lights", "Drive in the centre of the road to be seen"], correctIndex: 1, explanation: "Use dipped headlights and rear fog lights when visibility drops below 100 metres. Full beam reflects back and worsens visibility." },
    { category: "safety", question: "What is the two-second rule?", options: ["Wait two seconds at a junction before pulling out", "Keep at least a two-second gap from the vehicle in front", "Check your mirrors every two seconds", "Signal for at least two seconds before turning"], correctIndex: 1, explanation: "The two-second rule means keeping a minimum two-second gap from the vehicle in front. Double it to four seconds in wet conditions." },
    { category: "safety", question: "When must you wear a seatbelt?", options: ["Only on motorways and dual carriageways", "At all times unless a medical exemption applies", "Only when driving above 30 mph", "Only as the driver, not passengers"], correctIndex: 1, explanation: "All vehicle occupants must wear a seatbelt whenever one is fitted, unless they hold a valid medical exemption certificate." },
    { category: "safety", question: "A school crossing patrol raises a Stop sign. What must you do?", options: ["Slow down and prepare to stop", "Sound your horn to warn children", "Flash headlights and proceed carefully", "Stop immediately regardless of distance"], correctIndex: 0, explanation: "When you see a school crossing patrol with a raised Stop sign, you must stop. Slow down well before you reach the crossing." },
    { category: "safety", question: "When should you switch from full beam to dipped headlights at night?", options: ["When another vehicle is approaching", "Only in towns and cities", "When driving below 40 mph", "Only if the other driver flashes you first"], correctIndex: 0, explanation: "Switch to dipped headlights whenever you meet or follow another vehicle. Full beam dazzles other drivers and can cause accidents." },
    { category: "safety", question: "What is the effect of driving tired?", options: ["Only slightly increases reaction times", "Has no significant effect on short journeys", "Impairs reactions and judgement similarly to drink driving", "Only affects drivers over 60"], correctIndex: 2, explanation: "Driving tired seriously impairs reaction time, concentration and decision-making, and is a major cause of road deaths." },
    { category: "safety", question: "When should you use hazard warning lights?", options: ["When parking on double yellow lines briefly", "When your vehicle is stationary and causing an obstruction", "When driving in heavy rain", "To thank other drivers"], correctIndex: 1, explanation: "Use hazard lights when stationary and causing an obstruction, or on a motorway to warn traffic behind of a hazard ahead." },
    { category: "safety", question: "What should you do if you feel drowsy on a motorway?", options: ["Open the window and continue", "Turn up the radio to stay alert", "Leave at the next exit or services and take a proper break", "Drive faster to reach your destination sooner"], correctIndex: 2, explanation: "If drowsy, exit at the next services. Take a 15-minute break and a caffeinated drink. Never try to fight sleep by driving on." },
    { category: "safety", question: "What does defensive driving mean?", options: ["Driving slowly at all times", "Anticipating hazards and always having an escape route", "Never exceeding 50 mph", "Keeping close to the vehicle in front"], correctIndex: 1, explanation: "Defensive driving means anticipating other road users' mistakes, maintaining safety margins, and always having a plan to avoid accidents." },
    { category: "safety", question: "Your mobile phone rings while you are driving. What should you do?", options: ["Answer using your shoulder to hold the phone", "Let it go to voicemail and pull over safely to call back", "Answer if it is a short call", "Use it on loudspeaker on the passenger seat"], correctIndex: 1, explanation: "Using a handheld mobile phone while driving is illegal. Let it ring and call back only after you have pulled over safely." },

    // ── HAZARDS (12) ─────────────────────────────────────────────────
    { category: "hazards", question: "What is a developing hazard in the hazard perception test?", options: ["A fixed obstacle such as a parked car", "A situation that is changing and may require you to take action", "A warning sign on the road", "A pothole or road defect"], correctIndex: 1, explanation: "A developing hazard is a situation that is evolving and may require you to slow down, stop or change direction. Early detection earns more points." },
    { category: "hazards", question: "Why is it dangerous to follow a large lorry too closely?", options: ["The lorry driver cannot see you in their mirrors", "You cannot see the road ahead", "Both of the above", "Neither of the above"], correctIndex: 2, explanation: "Following a lorry closely is dangerous for two reasons: the driver cannot see you, and you cannot see hazards ahead of the lorry." },
    { category: "hazards", question: "When overtaking on a country road, when should you return to the left lane?", options: ["As soon as you are past the vehicle", "Well before any oncoming hazard or bend", "After signalling left for two seconds", "After the overtaken vehicle speeds up"], correctIndex: 1, explanation: "Return to the left lane as soon as it is safe, but well before any hazard such as an approaching vehicle, bend or junction." },
    { category: "hazards", question: "What should you do at a junction where your view is blocked?", options: ["Sound your horn and proceed", "Creep forward slowly until you can see clearly, then give way", "Flash your headlights", "Stop and wait for another driver to wave you forward"], correctIndex: 1, explanation: "At a junction with restricted visibility, edge forward slowly until you can see clearly. Give way to all traffic before pulling out." },
    { category: "hazards", question: "In wet conditions, stopping distances should be at least how much greater?", options: ["One and a half times greater", "Twice as great", "Three times as great", "The same — ABS prevents any increase"], correctIndex: 1, explanation: "Wet roads at least double stopping distances because water significantly reduces grip between tyres and the road." },
    { category: "hazards", question: "What is aquaplaning?", options: ["A tyre blowout caused by overinflation", "When tyres lose contact with the road due to a film of water", "Loss of power steering at high speed", "Brake fade on long descents"], correctIndex: 1, explanation: "Aquaplaning occurs when water builds under the tyre faster than it can be dispersed, causing loss of road contact and steering control." },
    { category: "hazards", question: "You see an unsteady cyclist ahead. What should you do?", options: ["Sound your horn to alert them", "Overtake quickly to get past", "Slow down and give them extra space when passing", "Flash your headlights"], correctIndex: 2, explanation: "Give unsteady or young cyclists plenty of room when overtaking. Pass slowly and leave as much space as you would for a car." },
    { category: "hazards", question: "Why should you increase your following distance in heavy rain?", options: ["Your headlights are less effective", "Spray reduces visibility and reduced grip increases braking distances", "Windscreen wipers reduce your forward view", "Other drivers may drive faster"], correctIndex: 1, explanation: "In heavy rain, spray from vehicles reduces visibility and reduced tyre grip increases braking distances — both require a greater following gap." },
    { category: "hazards", question: "What hazard might you encounter at a pedestrian crossing at night?", options: ["Pedestrians in dark clothing who are hard to see", "Traffic lights may not work at night", "Streetlights will dazzle you", "The crossing is inactive after 10pm"], correctIndex: 0, explanation: "Pedestrians in dark clothing are harder to see at night, even at lit crossings. Always be alert when approaching any crossing after dark." },
    { category: "hazards", question: "You are driving behind a school bus that has stopped. What should you do?", options: ["Overtake carefully at low speed", "Slow down and watch for children who may cross unpredictably", "Sound your horn to alert children", "Stop immediately right behind the bus"], correctIndex: 1, explanation: "Children may cross unpredictably in front of or behind a stopped school bus. Slow right down and be ready to stop until the road is clear." },
    { category: "hazards", question: "An emergency vehicle with blue lights and sirens approaches from behind on the motorway. What should you do?", options: ["Speed up to get out of the way quickly", "Safely move out of its path without breaking the speed limit or mounting the kerb", "Stop immediately on the hard shoulder", "Brake hard to let it pass"], correctIndex: 1, explanation: "Move out of the emergency vehicle path safely. Do not break the speed limit, run red lights, or drive onto the hard shoulder." },
    { category: "hazards", question: "What does commentary driving help you practise?", options: ["Talking to passengers while driving safely", "Identifying and verbalising hazards as you drive to improve awareness", "Giving directions to a passenger", "Communicating with other drivers"], correctIndex: 1, explanation: "Commentary driving involves verbalising what you see and plan to do. It develops systematic observation and hazard awareness skills." },

    // ── VEHICLE SAFETY (12) ───────────────────────────────────────────
    { category: "vehicle", question: "What is the minimum legal tyre tread depth for cars in the UK?", options: ["1.0 mm", "1.6 mm", "2.0 mm", "2.5 mm"], correctIndex: 1, explanation: "The legal minimum tread depth is 1.6 mm across the central three-quarters of the tyre around the entire circumference." },
    { category: "vehicle", question: "How often should you check your tyre pressures?", options: ["Once a year at the annual service", "Before every long journey and at least once a month", "Only when a TPMS warning light appears", "Every 6,000 miles"], correctIndex: 1, explanation: "Check tyre pressures at least monthly and before long journeys. Always check when tyres are cold for an accurate reading." },
    { category: "vehicle", question: "What does a red warning light shaped like an oil can mean?", options: ["Time for a routine oil change", "Engine oil level or pressure is critically low — stop safely immediately", "Engine oil is overheating", "Gearbox fluid is low"], correctIndex: 1, explanation: "A red oil warning light means dangerously low oil pressure or level. Stop as soon as safely possible and check the oil." },
    { category: "vehicle", question: "What does the engine management warning light (amber engine outline) indicate?", options: ["Time for a routine service", "A fault in the engine management or emissions system", "The engine is overheating", "Engine oil is low"], correctIndex: 1, explanation: "The engine management light indicates an electronic fault in the engine or emissions systems. Have the vehicle diagnosed by a mechanic promptly." },
    { category: "vehicle", question: "When should you check the engine oil level?", options: ["Only at the annual service", "At least once a month and before long journeys", "Only when the oil warning light comes on", "Exactly every 5,000 miles"], correctIndex: 1, explanation: "Check oil level at least monthly and before long journeys. Use the dipstick when the engine is cold on level ground." },
    { category: "vehicle", question: "What does a flashing amber dashboard light showing an exclamation mark in brackets indicate?", options: ["The handbrake is still on", "Tyre pressure is low in one or more tyres", "A seatbelt is not fastened", "A door is ajar"], correctIndex: 1, explanation: "The TPMS (tyre pressure monitoring system) warning light indicates one or more tyres has significantly low pressure." },
    { category: "vehicle", question: "Before a long motorway journey in winter, what should you check?", options: ["Fuel level only", "Fuel, tyre pressures, tread depth, oil, coolant and all lights", "Only that the lights are working", "Only the windscreen washer fluid"], correctIndex: 1, explanation: "Before a winter journey check fuel, tyre pressures and tread, engine oil, coolant, screenwash, and that all lights work correctly." },
    { category: "vehicle", question: "What should you do if your brakes feel spongy or unresponsive?", options: ["Continue driving carefully at reduced speed", "Have the braking system inspected by a mechanic immediately", "Top up the brake fluid reservoir yourself", "Pump the brake pedal repeatedly to restore pressure"], correctIndex: 1, explanation: "Spongy brakes usually indicate air in brake lines or a fluid leak. Stop driving and have the system inspected by a qualified mechanic immediately." },
    { category: "vehicle", question: "What tyre pressure should you use when a vehicle is fully laden?", options: ["The same as normal unloaded pressure", "The higher pressure specified in the vehicle handbook for laden conditions", "10 PSI more than the standard pressure", "Tyre pressure does not need adjusting for load"], correctIndex: 1, explanation: "Many vehicles need higher tyre pressure when fully laden. Check the handbook — the correct pressures are often on a sticker inside the driver door." },
    { category: "vehicle", question: "When is it safe to remove a radiator or coolant cap to check the level?", options: ["Any time as long as the car is parked", "Immediately after switching off the engine", "Only when the engine is fully cold", "While the engine is running with the heater on full"], correctIndex: 2, explanation: "Never remove a radiator or coolant cap when the engine is warm. The pressurised system can cause severe scalding. Always wait until cold." },
    { category: "vehicle", question: "What should you do if a rear tyre blows out while driving at speed?", options: ["Brake hard immediately", "Grip the wheel firmly, ease off the accelerator gradually, and slow down gently", "Apply the handbrake to stop quickly", "Swerve sharply to the left side of the road"], correctIndex: 1, explanation: "In a rear tyre blowout, grip the wheel firmly, ease off the accelerator, and slow down gently. Avoid sudden steering or braking." },
    { category: "vehicle", question: "What should you do if your windscreen wipers fail to clear the screen in heavy rain?", options: ["Continue driving at a reduced speed", "Pull over safely and stop driving until the problem is fixed", "Lean forward to see over the uncleared area", "Use the interior demister as an alternative"], correctIndex: 1, explanation: "Driving with impaired visibility is illegal and extremely dangerous. Pull over safely and do not continue until you can see clearly." },
  ];

  for (const q of theoryQuestions) {
    await prisma.theoryQuestion.create({ data: q });
  }

  const couponEnd = addYears(new Date(), 1);
  await seedLessonPricing();

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: { isActive: true },
    create: {
      code: "WELCOME10",
      name: "Welcome — 10% off (max £40)",
      type: "PERCENT",
      value: 10,
      maxDiscountAmount: 40,
      minOrderAmount: null,
      startsAt: null,
      endsAt: couponEnd,
      maxRedemptions: null,
      isActive: true,
    },
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE15" },
    update: { isActive: true },
    create: {
      code: "SAVE15",
      name: "£15 off (min order £35)",
      type: "FIXED",
      value: 15,
      maxDiscountAmount: null,
      minOrderAmount: 35,
      startsAt: null,
      endsAt: couponEnd,
      maxRedemptions: 200,
      isActive: true,
    },
  });

  console.log("\nSeed complete!");
  console.log(`  ${instructors.length} instructors created`);
  console.log(`  ${areaData.length} areas created`);
  console.log("  3 sample bookings created");
  console.log(`  ${theoryQuestions.length} theory questions created (60 across 5 categories)`);
  console.log("  sample coupons: WELCOME10 (10% off), SAVE15 (£15 off min £35)");
  console.log("  lesson pricing categories + packages (admin-managed)");
  console.log("\nTest accounts:");
  console.log("  student@test.com     / password123");
  console.log("  instructor@test.com  / password123");
  console.log("  admin@test.com       / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
