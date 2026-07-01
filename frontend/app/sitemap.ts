import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopilotdrivingschool.co.uk";
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8008/v1";

const STATIC_ROUTES: Array<{
  url: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { url: "/",                                          priority: 1.0, changeFrequency: "weekly" },
  { url: "/prices",                                    priority: 0.9, changeFrequency: "weekly" },
  { url: "/booking",                                   priority: 0.9, changeFrequency: "weekly" },
  { url: "/areas",                                     priority: 0.8, changeFrequency: "weekly" },
  { url: "/blog",                                      priority: 0.8, changeFrequency: "daily" },
  { url: "/contact",                                   priority: 0.7, changeFrequency: "monthly" },
  { url: "/become-an-instructor",                      priority: 0.7, changeFrequency: "monthly" },
  { url: "/learn-to-drive",                            priority: 0.8, changeFrequency: "monthly" },
  { url: "/learn-to-drive/automatic-manual",           priority: 0.7, changeFrequency: "monthly" },
  { url: "/learn-to-drive/female-instructors",         priority: 0.7, changeFrequency: "monthly" },
  { url: "/learn-to-drive/intensive-courses",          priority: 0.7, changeFrequency: "monthly" },
  { url: "/learn-to-drive/mock-test",                  priority: 0.6, changeFrequency: "monthly" },
  { url: "/learn-to-drive/motorway",                   priority: 0.6, changeFrequency: "monthly" },
  { url: "/learn-to-drive/pass-plus",                  priority: 0.6, changeFrequency: "monthly" },
  { url: "/learn-to-drive/refresher-lessons",          priority: 0.6, changeFrequency: "monthly" },
  { url: "/learn-to-drive/theory-training",            priority: 0.6, changeFrequency: "monthly" },
  { url: "/booking/gift-voucher",                      priority: 0.6, changeFrequency: "monthly" },
  { url: "/privacy",                                   priority: 0.3, changeFrequency: "yearly" },
  { url: "/terms",                                     priority: 0.3, changeFrequency: "yearly" },
  { url: "/refund",                                    priority: 0.3, changeFrequency: "yearly" },
];

interface BlogEntry {
  slug: string;
  updatedAt: string;
  publishedAt: string | null;
}

async function getPublishedBlogSlugs(): Promise<BlogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/public/blogs?page=1&limit=1000`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.blogs ?? []) as BlogEntry[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const blogs = await getPublishedBlogSlugs();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ url, priority, changeFrequency }) => ({
      url: `${BASE_URL}${url}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt ?? blog.publishedAt ?? now),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
