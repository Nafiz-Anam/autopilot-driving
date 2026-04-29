"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TheoryQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuestionFormData {
  category: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

const CATEGORIES = [
  "Road Signs",
  "Rules of Road",
  "Vehicle Safety",
  "Hazard Perception",
  "Vehicle Handling",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Road Signs": "bg-blue-100 text-blue-700 border border-blue-200",
  "Rules of Road": "bg-green-100 text-green-700 border border-green-200",
  "Vehicle Safety": "bg-orange-100 text-orange-700 border border-orange-200",
  "Hazard Perception": "bg-red-50 text-brand-red border border-red-100",
  "Vehicle Handling": "bg-purple-100 text-purple-700 border border-purple-200",
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const emptyForm = (): QuestionFormData => ({
  category: CATEGORIES[0],
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

function QuestionModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  initial?: TheoryQuestion;
}) {
  const [form, setForm] = useState<QuestionFormData>(
    initial
      ? {
          category: initial.category,
          question: initial.question,
          options: (initial.options.slice(0, 4).concat(["", "", "", ""]).slice(0, 4)) as [
            string,
            string,
            string,
            string,
          ],
          correctIndex: initial.correctIndex,
          explanation: initial.explanation ?? "",
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        category: initial.category,
        question: initial.question,
        options: (initial.options.slice(0, 4).concat(["", "", "", ""]).slice(0, 4)) as [
          string,
          string,
          string,
          string,
        ],
        correctIndex: initial.correctIndex,
        explanation: initial.explanation ?? "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const OPTION_LABELS = ["A", "B", "C", "D"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-brand-black">
              {initial ? "Edit Question" : "Add Question"}
            </h3>
            <button
              onClick={onClose}
              className="text-brand-muted hover:text-brand-black transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1.5">
                Question
              </label>
              <textarea
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                rows={3}
                required
                placeholder="Enter the theory question..."
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">
                Options
              </label>
              <div className="space-y-2.5">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand-muted w-5 shrink-0 text-center">
                      {OPTION_LABELS[idx]}
                    </span>
                    <input
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...form.options] as [string, string, string, string];
                        newOptions[idx] = e.target.value;
                        setForm((f) => ({ ...f, options: newOptions }));
                      }}
                      required
                      placeholder={`Option ${OPTION_LABELS[idx]}`}
                      className={cn(
                        "flex-1 px-4 py-2.5 border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red",
                        form.correctIndex === idx
                          ? "border-green-400 bg-green-50"
                          : "border-brand-border"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct answer */}
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">
                Correct Answer
              </label>
              <div className="flex gap-4">
                {OPTION_LABELS.map((label, idx) => (
                  <label
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                      form.correctIndex === idx
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-brand-border text-brand-muted hover:border-brand-black"
                    )}
                  >
                    <input
                      type="radio"
                      name="correctIndex"
                      value={idx}
                      checked={form.correctIndex === idx}
                      onChange={() => setForm((f) => ({ ...f, correctIndex: idx }))}
                      className="accent-green-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1.5">
                Explanation{" "}
                <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={form.explanation}
                onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                rows={2}
                placeholder="Why is the correct answer right?"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save Question
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-brand-border rounded-xl font-semibold text-sm text-brand-black hover:bg-brand-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminTheoryPage() {
  const [questions, setQuestions] = useState<TheoryQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TheoryQuestion | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/admin/theory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch theory questions", err);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function handleSubmitQuestion(data: QuestionFormData) {
    if (editingQuestion) {
      const res = await fetch(`/api/admin/theory/${editingQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingQuestion(null);
        fetchQuestions();
      }
    } else {
      const res = await fetch("/api/admin/theory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowModal(false);
        fetchQuestions();
      }
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/theory/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotal((t) => t - 1);
      setDeleteConfirmId(null);
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">Theory Bank</h2>
          <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-3 py-1.5 text-sm font-bold">
            <BookOpen className="w-4 h-4" />
            {total} Questions
          </span>
        </div>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-brand-red text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </motion.div>

      {/* Category filter tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 flex-wrap mb-6">
        <button
          onClick={() => {
            setCategoryFilter("");
            setPage(1);
          }}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-all duration-200",
            categoryFilter === ""
              ? "bg-brand-black text-white font-semibold"
              : "text-brand-muted hover:text-brand-black"
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategoryFilter(cat);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-all duration-200",
              categoryFilter === cat
                ? "bg-brand-black text-white font-semibold"
                : "text-brand-muted hover:text-brand-black"
            )}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-border">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Question
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">
                  Category
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Options
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-3 bg-gray-100 rounded w-full max-w-xs" />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="h-5 bg-gray-100 rounded w-28" />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="h-3 bg-gray-100 rounded w-8" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-7 bg-gray-100 rounded w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <BookOpen className="w-10 h-10 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">
                      {categoryFilter
                        ? `No questions in "${categoryFilter}"`
                        : "No questions yet"}
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 text-sm text-brand-red font-semibold hover:text-brand-orange transition-colors"
                    >
                      Add the first question
                    </button>
                  </td>
                </tr>
              ) : (
                questions.map((q) => {
                  const catColor =
                    CATEGORY_COLORS[q.category] ??
                    "bg-gray-100 text-brand-muted border border-gray-200";
                  return (
                    <tr key={q.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-brand-black max-w-xs">
                          {q.question.length > 80
                            ? q.question.slice(0, 80) + "…"
                            : q.question}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full",
                            catColor
                          )}
                        >
                          {q.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-muted hidden lg:table-cell">
                        {q.options.length}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {deleteConfirmId === q.id ? (
                            <>
                              <span className="text-xs text-brand-muted mr-1">
                                Delete this question?
                              </span>
                              <button
                                onClick={() => handleDelete(q.id)}
                                className="text-xs px-2.5 py-1 bg-brand-red text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs px-2.5 py-1 text-brand-muted hover:text-brand-black border border-brand-border rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setShowModal(true);
                                }}
                                className="p-1.5 rounded-lg text-brand-red hover:bg-red-50 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(q.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between">
            <p className="text-xs text-brand-muted">
              Page {page} of {totalPages}
            </p>
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
          </div>
        )}
      </motion.div>

      <QuestionModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSubmitQuestion}
        initial={editingQuestion ?? undefined}
      />
    </motion.div>
  );
}
