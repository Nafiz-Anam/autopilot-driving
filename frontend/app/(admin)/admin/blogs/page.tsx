"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Globe,
  Tag,
  Upload,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApiFetch } from "@/lib/admin-api";
import { getBackendApiBase } from "@/lib/backend-api";
import { BlogEditor } from "@/components/blog/BlogEditor";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  published: boolean;
  publishedAt: string | null;
  tags: string[];
  readTimeMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogFull extends Blog {
  contentHtml: string;
  contentJson: object | null;
}

interface BlogFormData {
  title: string;
  slug: string;
  contentJson: object | null;
  contentHtml: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  published: boolean;
  tags: string;
  seoTitle: string;
  seoDescription: string;
}

const emptyForm: BlogFormData = {
  title: "",
  slug: "",
  contentJson: null,
  contentHtml: "",
  excerpt: "",
  coverImage: "",
  authorName: "Autopilot Team",
  published: false,
  tags: "",
  seoTitle: "",
  seoDescription: "",
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CoverImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await adminApiFetch("/blogs/upload-cover", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        toast.error("Cover upload failed");
        return;
      }
      const data = await res.json();
      let url: string = data?.data?.url ?? "";
      if (url && !url.startsWith("http")) {
        const apiBase = getBackendApiBase().replace(/\/v1$/, "");
        url = `${apiBase}${url}`;
      }
      onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-brand-black mb-1.5">
        Cover Image
      </label>
      <div className="space-y-2">
        {value ? (
          <div className="relative rounded-xl overflow-hidden border border-brand-border aspect-[16/9] sm:aspect-[16/7]">
            <img src={value} alt="Cover" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-[16/9] sm:aspect-[16/7] rounded-xl border-2 border-dashed border-brand-border hover:border-brand-red/40 hover:bg-red-50/30 transition-all flex flex-col items-center justify-center gap-2 text-brand-muted disabled:opacity-50"
          >
            {uploading ? (
              <span className="animate-spin w-6 h-6 border-2 border-brand-muted/30 border-t-brand-red rounded-full" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Click to upload cover image</span>
                <span className="text-xs font-semibold text-brand-black/70">1200 × 630 px recommended (16:9)</span>
                <span className="text-xs text-brand-muted">PNG, JPG, WebP · max 8MB · min 800×450px</span>
              </>
            )}
          </button>
        )}
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL…"
            className="flex-1 px-3 py-2 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded-xl border border-brand-border text-sm font-medium text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function BlogFormModal({
  open,
  onClose,
  onSave,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: BlogFormData) => void;
  initial: BlogFormData | null;
  saving: boolean;
}) {
  const [form, setForm] = useState<BlogFormData>(initial ?? emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");

  useEffect(() => {
    setForm(initial ?? emptyForm);
    setSlugEdited(!!initial);
    setActiveTab("content");
  }, [initial, open]);

  function set<K extends keyof BlogFormData>(field: K, value: BlogFormData[K]) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      if (field === "title" && !slugEdited) {
        (updated as BlogFormData).slug = slugify(String(value));
      }
      if (field === "slug") setSlugEdited(true);
      return updated;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  const tabs = [
    { key: "content" as const, label: "Content" },
    { key: "seo" as const, label: "SEO" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
                <h2 className="text-lg font-bold text-brand-black">
                  {initial?.title ? "Edit Blog Post" : "New Blog Post"}
                </h2>
                <div className="flex items-center gap-3">
                  {/* Tabs */}
                  <div className="flex bg-brand-surface p-0.5 rounded-lg">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                          activeTab === tab.key
                            ? "bg-white text-brand-black shadow-sm"
                            : "text-brand-muted"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                {/* Content tab */}
                <div className={cn("px-6 py-5 space-y-5", activeTab !== "content" && "hidden")}>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                      Title <span className="text-brand-red">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                      placeholder="How to pass your driving test first time"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                      URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs text-brand-muted bg-brand-surface px-3 py-2.5 rounded-l-xl border border-r-0 border-brand-border shrink-0">
                        /blog/
                      </span>
                      <input
                        value={form.slug}
                        onChange={(e) => set("slug", slugify(e.target.value))}
                        className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                        placeholder="how-to-pass-driving-test"
                      />
                    </div>
                  </div>

                  {/* Cover image upload */}
                  <CoverImageUpload
                    value={form.coverImage}
                    onChange={(url) => set("coverImage", url)}
                  />

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                      Excerpt
                      <span className="text-brand-muted font-normal ml-1">(shown in blog list)</span>
                    </label>
                    <textarea
                      value={form.excerpt}
                      onChange={(e) => set("excerpt", e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors resize-none"
                      placeholder="A brief summary of what this post is about…"
                    />
                  </div>

                  {/* Rich text editor */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                      Content <span className="text-brand-red">*</span>
                    </label>
                    <BlogEditor
                      value={form.contentJson}
                      htmlFallback={form.contentHtml}
                      onChange={(json, html) => {
                        set("contentJson", json);
                        set("contentHtml", html);
                      }}
                      placeholder="Start writing your blog post…"
                    />
                  </div>

                  {/* Author + Tags row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-1.5">
                        Author Name
                      </label>
                      <input
                        value={form.authorName}
                        onChange={(e) => set("authorName", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                        placeholder="Autopilot Team"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-1.5">
                        Tags
                        <span className="text-brand-muted font-normal ml-1">(comma-separated)</span>
                      </label>
                      <input
                        value={form.tags}
                        onChange={(e) => set("tags", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                        placeholder="driving tips, theory test"
                      />
                    </div>
                  </div>

                  {/* Published toggle */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => set("published", !form.published)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                        form.published ? "bg-green-500" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                          form.published ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className="text-sm font-medium text-brand-black">
                      {form.published ? "Published — visible to readers" : "Draft — not public"}
                    </span>
                  </div>
                </div>

                {/* SEO tab */}
                <div className={cn("px-6 py-5 space-y-5", activeTab !== "seo" && "hidden")}>
                  <p className="text-sm text-brand-muted">
                    Optional SEO overrides. Leave blank to use the post title/excerpt.
                  </p>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                      SEO Title
                      <span className="text-brand-muted font-normal ml-1">(max ~60 chars)</span>
                    </label>
                    <input
                      value={form.seoTitle}
                      onChange={(e) => set("seoTitle", e.target.value)}
                      maxLength={80}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                      placeholder="Leave blank to use post title"
                    />
                    <p className="text-xs text-brand-muted mt-1">{form.seoTitle.length}/80</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1.5">
                      Meta Description
                      <span className="text-brand-muted font-normal ml-1">(max ~160 chars)</span>
                    </label>
                    <textarea
                      value={form.seoDescription}
                      onChange={(e) => set("seoDescription", e.target.value)}
                      rows={3}
                      maxLength={200}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors resize-none"
                      placeholder="Leave blank to use excerpt"
                    />
                    <p className="text-xs text-brand-muted mt-1">{form.seoDescription.length}/200</p>
                  </div>

                  {/* Google preview */}
                  <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
                    <p className="text-xs font-semibold text-brand-muted mb-3 uppercase tracking-wide">
                      Google Preview
                    </p>
                    <p className="text-[#1a0dab] text-base font-medium leading-snug truncate">
                      {form.seoTitle || form.title || "Post title"}
                    </p>
                    <p className="text-[#006621] text-xs mt-0.5">
                      autopilotdrivingschool.co.uk/blog/{form.slug || "slug"}
                    </p>
                    <p className="text-[#545454] text-sm mt-1 line-clamp-2">
                      {form.seoDescription || form.excerpt || "Meta description will appear here."}
                    </p>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-brand-border flex items-center justify-end shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const e = { preventDefault: () => {} } as React.FormEvent;
                      const form_el = document.querySelector("form") as HTMLFormElement | null;
                      if (form_el?.reportValidity?.() === false) return;
                      onSave(form);
                    }}
                    disabled={saving || !form.title || !form.contentHtml}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-brand-red text-white hover:bg-brand-orange transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {saving ? "Saving…" : "Save Post"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<BlogFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [editId, setEditId] = useState<string | null>(null);

  const fetchBlogs = useCallback(async (p: number, f: typeof filter) => {
    setLoading(true);
    try {
      const qs =
        f === "all" ? `?page=${p}` : f === "published" ? `?page=${p}&published=true` : `?page=${p}&published=false`;
      const res = await adminApiFetch(`/blogs${qs}`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(page, filter);
  }, [page, filter, fetchBlogs]);

  async function openCreate() {
    setEditId(null);
    setEditForm(null);
    setModalOpen(true);
  }

  async function openEdit(blog: Blog) {
    const res = await adminApiFetch(`/blogs/${blog.id}`);
    if (!res.ok) { toast.error("Failed to load blog"); return; }
    const data: { data: BlogFull } = await res.json();
    const full = data.data;
    setEditId(blog.id);
    setEditForm({
      title: full.title,
      slug: full.slug,
      contentJson: full.contentJson ?? null,
      contentHtml: full.contentHtml,
      excerpt: full.excerpt ?? "",
      coverImage: full.coverImage ?? "",
      authorName: full.authorName,
      published: full.published,
      tags: full.tags.join(", "),
      seoTitle: full.seoTitle ?? "",
      seoDescription: full.seoDescription ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave(data: BlogFormData) {
    setSaving(true);
    try {
      const body = {
        title: data.title,
        slug: data.slug || undefined,
        contentHtml: data.contentHtml,
        contentJson: data.contentJson ?? undefined,
        excerpt: data.excerpt || undefined,
        coverImage: data.coverImage || undefined,
        authorName: data.authorName || undefined,
        published: data.published,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        seoTitle: data.seoTitle || undefined,
        seoDescription: data.seoDescription || undefined,
      };

      const res = editId
        ? await adminApiFetch(`/blogs/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await adminApiFetch("/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        toast.success(editId ? "Blog updated" : "Blog created");
        setModalOpen(false);
        fetchBlogs(page, filter);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save blog post");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(blog: Blog) {
    const res = await adminApiFetch(`/blogs/${blog.id}/publish`, { method: "PATCH" });
    if (res.ok) {
      const d = await res.json();
      toast.success(d.data.published ? "Blog published" : "Blog unpublished");
      setBlogs((prev) => prev.map((b) => (b.id === blog.id ? { ...b, ...d.data } : b)));
    } else {
      toast.error("Failed to update publish status");
    }
  }

  async function handleDelete(id: string) {
    const res = await adminApiFetch(`/blogs/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Blog post deleted");
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
    } else {
      toast.error("Failed to delete blog post");
    }
    setDeleteId(null);
  }

  const filtered = search
    ? blogs.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()))
    : blogs;

  const filterBtns: { label: string; value: typeof filter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Drafts", value: "draft" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <ConfirmModal
        open={!!deleteId}
        title="Delete blog post?"
        message="This permanently deletes the blog post and cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <BlogFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editForm}
        saving={saving}
      />

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">Blog Posts</h2>
          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-brand-red rounded-xl px-3 py-1.5 text-sm font-bold">
            <Newspaper className="w-4 h-4" />
            {total} total
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-brand-orange transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </motion.div>

      {/* Filter + search */}
      <motion.div variants={itemVariants} className="flex flex-col xs:flex-row gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 bg-brand-surface p-1 rounded-xl w-fit">
          {filterBtns.map((btn) => (
            <button
              key={btn.value}
              onClick={() => { setFilter(btn.value); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                filter === btn.value ? "bg-white text-brand-black shadow-sm" : "text-brand-muted hover:text-brand-black"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors bg-white"
          />
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-100 rounded w-64" />
                <div className="h-3 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-brand-border shadow-sm p-16 text-center">
          <Newspaper className="w-10 h-10 text-brand-border mx-auto mb-3" />
          <p className="text-brand-muted text-sm">{search ? "No posts match your search" : "No blog posts yet"}</p>
          {!search && (
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-brand-orange transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Write your first post
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map((blog) => (
            <motion.div
              key={blog.id}
              variants={itemVariants}
              className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 flex gap-4"
            >
              {/* Cover thumb */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-brand-surface flex items-center justify-center">
                {blog.coverImage ? (
                  <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                ) : (
                  <Newspaper className="w-7 h-7 text-brand-border" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-bold text-brand-black text-sm line-clamp-2 sm:truncate">{blog.title}</h3>
                    <p className="text-xs text-brand-muted mt-0.5 hidden sm:block">
                      /blog/{blog.slug} · {blog.authorName} · {formatDate(blog.createdAt)}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5 sm:hidden">
                      {blog.authorName} · {formatDate(blog.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {blog.readTimeMinutes > 0 && (
                      <span className="flex items-center gap-1 text-xs text-brand-muted">
                        <Clock className="w-3 h-3" /> {blog.readTimeMinutes} min
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                        blog.published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}
                    >
                      {blog.published ? <><Globe className="w-3 h-3" /> Published</> : <><EyeOff className="w-3 h-3" /> Draft</>}
                    </span>
                  </div>
                </div>

                {blog.excerpt && (
                  <p className="text-xs text-brand-muted mt-1.5 line-clamp-1">{blog.excerpt}</p>
                )}

                {blog.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Tag className="w-3 h-3 text-brand-muted shrink-0" />
                    {blog.tags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-brand-surface text-brand-muted border border-brand-border px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => handleTogglePublish(blog)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                      blog.published
                        ? "border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100"
                        : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                    )}
                  >
                    {blog.published ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                  </button>
                  <button
                    onClick={() => openEdit(blog)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {blog.published && (
                    <a
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  )}
                  <button
                    onClick={() => setDeleteId(blog.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100 text-brand-red bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="mt-6 flex items-center justify-between">
          <p className="text-xs text-brand-muted">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
