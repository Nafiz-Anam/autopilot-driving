import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Calendar, User, Tag, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopilotdrivingschool.co.uk";

export const metadata: Metadata = {
  title: "Driving Tips & Advice | Autopilot Blog",
  description:
    "Expert driving tips, theory test advice, and road safety guides from the Autopilot Driving School team.",
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/blog`,
    title: "Driving Tips & Advice | Autopilot Blog",
    description:
      "Expert driving tips, theory test advice, and road safety guides from the Autopilot Driving School team.",
    siteName: "Autopilot Driving School",
  },
  twitter: {
    card: "summary_large_image",
    title: "Driving Tips & Advice | Autopilot Blog",
    description:
      "Expert driving tips, theory test advice, and road safety guides from the Autopilot Driving School team.",
  },
};

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  publishedAt: string | null;
  tags: string[];
  createdAt: string;
}

async function getBlogs(page = 1): Promise<{ blogs: Blog[]; total: number; totalPages: number }> {
  try {
    const base =
      process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.replace(/\/$/, "") ??
      "http://localhost:8008/v1";
    const res = await fetch(`${base}/public/blogs?page=${page}&limit=9`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { blogs: [], total: 0, totalPages: 1 };
    const data = await res.json();
    return {
      blogs: data.blogs ?? [],
      total: data.total ?? 0,
      totalPages: data.totalPages ?? 1,
    };
  } catch {
    return { blogs: [], total: 0, totalPages: 1 };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogCard({ blog }: { blog: Blog }) {
  const date = blog.publishedAt ?? blog.createdAt;
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden hover:shadow-md hover:border-brand-red/30 transition-all duration-300"
    >
      {/* Cover */}
      <div className="aspect-[16/9] bg-brand-surface overflow-hidden">
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-12 h-12 text-brand-border" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-6">
        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-brand-red border border-red-100 px-2 py-0.5 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="font-bold text-brand-black text-base sm:text-lg leading-snug mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
          {blog.title}
        </h2>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm text-brand-muted leading-relaxed line-clamp-3 flex-1">
            {blog.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
          <div className="flex items-center flex-wrap gap-2 text-xs text-brand-muted">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {blog.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(date)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-red group-hover:gap-2 transition-all">
            Read <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const { blogs, total } = await getBlogs();

  return (
    <>
      <PageHero
        eyebrow="Autopilot Blog"
        title="Driving Tips &"
        titleHighlight="Advice"
        subtitle="Expert guides, theory test help, and road safety tips from our team of DVSA-approved instructors."
      />

      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {blogs.length === 0 ? (
            <div className="text-center py-24">
              <Newspaper className="w-12 h-12 text-brand-border mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-black mb-2">No posts yet</h3>
              <p className="text-brand-muted">Check back soon for driving tips and advice.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-brand-muted mb-8">
                {total} article{total !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
