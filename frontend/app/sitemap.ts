import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopilotdrivingschool.co.uk";

const STATIC_ROUTES: Array<{ url: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { url: "/",                                          priority: 1.0,  changeFrequency: "weekly" },
  { url: "/prices",                                    priority: 0.9,  changeFrequency: "weekly" },
  { url: "/booking",                                   priority: 0.9,  changeFrequency: "weekly" },
  { url: "/areas",                                     priority: 0.8,  changeFrequency: "weekly" },
  { url: "/contact",                                   priority: 0.7,  changeFrequency: "monthly" },
  { url: "/become-an-instructor",                      priority: 0.7,  changeFrequency: "monthly" },
  { url: "/learn-to-drive",                            priority: 0.8,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/automatic-manual",           priority: 0.7,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/female-instructors",         priority: 0.7,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/intensive-courses",          priority: 0.7,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/mock-test",                  priority: 0.6,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/motorway",                   priority: 0.6,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/pass-plus",                  priority: 0.6,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/refresher-lessons",          priority: 0.6,  changeFrequency: "monthly" },
  { url: "/learn-to-drive/theory-training",            priority: 0.6,  changeFrequency: "monthly" },
  { url: "/booking/gift-voucher",                      priority: 0.6,  changeFrequency: "monthly" },
  { url: "/privacy",                                   priority: 0.3,  changeFrequency: "yearly" },
  { url: "/terms",                                     priority: 0.3,  changeFrequency: "yearly" },
  { url: "/refund",                                    priority: 0.3,  changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  return STATIC_ROUTES.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
