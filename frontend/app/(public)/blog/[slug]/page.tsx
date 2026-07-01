import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Calendar, User, Tag, ArrowLeft, BookOpen } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopilotdrivingschool.co.uk";

interface Blog {
  id: string;
  title: string;
  slug: string;
  contentHtml: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  publishedAt: string | null;
  tags: string[];
  readTimeMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getBlog(slug: string): Promise<Blog | null> {
  try {
    const base =
      process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.replace(/\/$/, "") ??
      "http://localhost:8008/v1";
    const res = await fetch(`${base}/public/blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

async function getRecentBlogs(excludeSlug: string): Promise<Blog[]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.replace(/\/$/, "") ??
      "http://localhost:8008/v1";
    const res = await fetch(`${base}/public/blogs?page=1&limit=4`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.blogs ?? []).filter((b: Blog) => b.slug !== excludeSlug).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: "Post Not Found | Autopilot Blog" };

  const url = `${BASE_URL}/blog/${blog.slug}`;
  const title = blog.seoTitle || `${blog.title} | Autopilot Blog`;
  const description = blog.seoDescription || blog.excerpt || undefined;
  const publishedAt = blog.publishedAt ?? blog.createdAt;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Autopilot Driving School",
      publishedTime: publishedAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.authorName],
      tags: blog.tags,
      ...(blog.coverImage && {
        images: [{ url: blog.coverImage, width: 1200, height: 630, alt: blog.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(blog.coverImage && { images: [blog.coverImage] }),
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [blog, related] = await Promise.all([getBlog(slug), getRecentBlogs(slug)]);

  if (!blog) notFound();

  const date = blog.publishedAt ?? blog.createdAt;
  const canonicalUrl = `${BASE_URL}/blog/${blog.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt || undefined,
    url: canonicalUrl,
    datePublished: blog.publishedAt ?? blog.createdAt,
    dateModified: blog.updatedAt,
    author: {
      "@type": "Person",
      name: blog.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Autopilot Driving School",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/autopilot-logo-transparent.png`,
      },
    },
    ...(blog.coverImage && {
      image: {
        "@type": "ImageObject",
        url: blog.coverImage,
        width: 1200,
        height: 630,
      },
    }),
    ...(blog.tags.length > 0 && { keywords: blog.tags.join(", ") }),
    ...(blog.readTimeMinutes > 0 && {
      timeRequired: `PT${blog.readTimeMinutes}M`,
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero / Cover */}
      {blog.coverImage ? (
        <div className="relative w-full h-56 sm:h-72 md:h-96 bg-brand-black overflow-hidden">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5 sm:pb-8">
            <Link
              href="/blog"
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs font-semibold bg-brand-red text-white px-2.5 py-0.5 rounded-full"
                  >
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
            )}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif" }}
            >
              {blog.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-[#0D0D0D] pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs font-semibold bg-brand-red text-white px-2.5 py-0.5 rounded-full"
                  >
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
            )}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif" }}
            >
              {blog.title}
            </h1>
          </div>
        </div>
      )}

      {/* Meta bar */}
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" /> {blog.authorName}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {formatDate(date)}
          </span>
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
        {/* Article */}
        <article
          className="blog-content min-w-0"
          dangerouslySetInnerHTML={{ __html: blog.contentHtml ?? "" }}
        />

        {/* Sidebar */}
        <aside className="space-y-4 lg:space-y-6">
          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 sm:p-5">
              <h3 className="text-sm font-bold text-brand-black mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-red" /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-xs font-semibold bg-white text-brand-muted border border-brand-border px-3 py-1 rounded-full hover:border-brand-red hover:text-brand-red transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related posts */}
          {related.length > 0 && (
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 sm:p-5">
              <h3 className="text-sm font-bold text-brand-black mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-red" /> More Articles
              </h3>
              <div className="space-y-4">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="group flex gap-3">
                    {r.coverImage ? (
                      <img
                        src={r.coverImage}
                        alt={r.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white border border-brand-border flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-brand-border" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors line-clamp-2 leading-snug">
                        {r.title}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {formatDate(r.publishedAt ?? r.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-brand-red rounded-2xl p-5 text-white">
            <h3 className="font-bold text-lg mb-2">Ready to start driving?</h3>
            <p className="text-sm text-white/80 mb-4">
              Book your first lesson with one of our DVSA-approved instructors today.
            </p>
            <Link
              href="/booking"
              className="block text-center bg-white text-brand-red font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-brand-surface transition-colors"
            >
              Book a Lesson
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
