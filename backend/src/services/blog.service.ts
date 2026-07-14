import { randomUUID } from 'crypto';
import prisma from '../client';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let count = 0;
  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    count++;
    candidate = `${slug}-${count}`;
  }
}

function estimateReadTime(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export interface BlogCreateInput {
  title: string;
  slug?: string;
  contentHtml: string;
  contentJson?: object;
  excerpt?: string;
  coverImage?: string;
  authorName?: string;
  published?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface BlogUpdateInput {
  title?: string;
  slug?: string;
  contentHtml?: string;
  contentJson?: object;
  excerpt?: string;
  coverImage?: string;
  authorName?: string;
  published?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

const listPublished = async (page = 1, limit = 10, tag?: string) => {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { published: true };
  if (tag) where.tags = { has: tag };

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        authorName: true,
        publishedAt: true,
        tags: true,
        readTimeMinutes: true,
        createdAt: true,
      },
    }),
    prisma.blog.count({ where }),
  ]);

  return { blogs, total, page, totalPages: Math.ceil(total / limit) };
};

const getPublishedBySlug = async (slug: string) => {
  return prisma.blog.findFirst({ where: { slug, published: true } });
};

const adminListAll = async (page = 1, limit = 20, published?: boolean) => {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (published !== undefined) where.published = published;

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        authorName: true,
        published: true,
        publishedAt: true,
        tags: true,
        readTimeMinutes: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.blog.count({ where }),
  ]);

  return { blogs, total, page, totalPages: Math.ceil(total / limit) };
};

const adminGetById = async (id: string) => {
  return prisma.blog.findUnique({ where: { id } });
};

const adminCreate = async (data: BlogCreateInput) => {
  const baseSlug = data.slug ? data.slug : generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  return prisma.blog.create({
    data: {
      id: randomUUID(),
      title: data.title,
      slug,
      contentHtml: data.contentHtml,
      contentJson: data.contentJson ?? undefined,
      excerpt: data.excerpt ?? null,
      coverImage: data.coverImage ?? null,
      authorName: data.authorName ?? 'Autopilot Team',
      published: data.published ?? false,
      publishedAt: data.published ? new Date() : null,
      tags: data.tags ?? [],
      readTimeMinutes: estimateReadTime(data.contentHtml),
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
    },
  });
};

const adminUpdate = async (id: string, data: BlogUpdateInput) => {
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) return null;

  let slug = existing.slug;
  if (data.slug && data.slug !== existing.slug) {
    slug = await ensureUniqueSlug(data.slug, id);
  } else if (data.title && data.title !== existing.title && !data.slug) {
    slug = await ensureUniqueSlug(generateSlug(data.title), id);
  }

  const wasPublished = existing.published;
  const nowPublished = data.published ?? existing.published;
  const publishedAt = !wasPublished && nowPublished ? new Date() : existing.publishedAt;

  const contentHtml = data.contentHtml ?? existing.contentHtml;

  return prisma.blog.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      slug,
      contentHtml,
      ...(data.contentJson !== undefined && { contentJson: data.contentJson }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
      ...(data.authorName !== undefined && { authorName: data.authorName }),
      ...(data.published !== undefined && { published: data.published }),
      publishedAt,
      ...(data.tags !== undefined && { tags: data.tags }),
      readTimeMinutes: estimateReadTime(contentHtml),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
    },
  });
};

const adminDelete = async (id: string) => {
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.blog.delete({ where: { id } });
};

const adminTogglePublish = async (id: string) => {
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) return null;
  const nowPublished = !existing.published;
  return prisma.blog.update({
    where: { id },
    data: {
      published: nowPublished,
      publishedAt: nowPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });
};

export default {
  listPublished,
  getPublishedBySlug,
  adminListAll,
  adminGetById,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminTogglePublish,
};
