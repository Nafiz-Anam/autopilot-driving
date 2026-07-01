"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api";
import { getBackendApiBase } from "@/lib/backend-api";
import toast from "react-hot-toast";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Pilcrow,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BlogEditorProps = {
  value: object | null;
  htmlFallback?: string;
  onChange: (json: object, html: string, plainText: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-black disabled:opacity-40",
        active && "bg-red-50 text-brand-red ring-1 ring-brand-red/20"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-brand-border" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8MB or smaller");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await adminApiFetch("/blogs/upload-image", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Image upload failed");
        return;
      }
      const data = await res.json();
      let url: string = data?.data?.url ?? data?.url ?? "";
      if (url && !url.startsWith("http")) {
        const apiBase = getBackendApiBase().replace(/\/v1$/, "");
        url = `${apiBase}${url}`;
      }
      if (url) {
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    } catch {
      toast.error("Image upload failed");
    }
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank", rel: "noreferrer noopener" })
      .run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-brand-border bg-brand-surface/50 px-2 py-1.5 rounded-t-xl overflow-x-auto">
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo size={13} />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo size={13} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
        <Pilcrow size={13} />
      </ToolbarButton>
      <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 size={13} />
      </ToolbarButton>
      <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={13} />
      </ToolbarButton>
      <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={13} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={13} />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={13} />
      </ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={13} />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={13} />
      </ToolbarButton>
      <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={13} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={13} />
      </ToolbarButton>
      <ToolbarButton title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={13} />
      </ToolbarButton>
      <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={13} />
      </ToolbarButton>
      <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 size={13} />
      </ToolbarButton>
      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={13} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft size={13} />
      </ToolbarButton>
      <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter size={13} />
      </ToolbarButton>
      <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight size={13} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Add link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon size={13} />
      </ToolbarButton>
      <ToolbarButton title="Upload image" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon size={13} />
      </ToolbarButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function BlogEditor({ value, htmlFallback, onChange, placeholder }: BlogEditorProps) {
  const [selectionCounter, setSelectionCounter] = useState(0);

  const initialContent = value ?? htmlFallback ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: "blog-code-block" } },
        blockquote: { HTMLAttributes: { class: "blog-blockquote" } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-brand-red underline underline-offset-2" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-xl border border-brand-border my-4 max-w-full" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing your blog post…",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-brand-muted before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[380px] focus:outline-none px-5 py-4 text-brand-black " +
          "prose-headings:font-bold prose-headings:text-brand-black " +
          "prose-p:text-brand-muted prose-p:leading-relaxed " +
          "prose-a:text-brand-red " +
          "prose-strong:text-brand-black " +
          "prose-ul:text-brand-muted prose-ol:text-brand-muted " +
          "prose-blockquote:border-l-brand-red prose-blockquote:text-brand-muted " +
          "prose-code:bg-brand-surface prose-code:text-brand-black prose-code:px-1 prose-code:rounded " +
          "prose-img:rounded-xl prose-img:border prose-img:border-brand-border",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML(), editor.getText());
    },
    onSelectionUpdate: () => {
      setSelectionCounter((c) => c + 1);
    },
    immediatelyRender: false,
  });

  const lastValue = useRef<object | string | null>(null);
  useEffect(() => {
    if (!editor) return;
    const incoming = value ?? htmlFallback ?? null;
    if (incoming && incoming !== lastValue.current) {
      lastValue.current = incoming;
      const currentJson = editor.getJSON();
      if (
        typeof incoming === "string"
          ? editor.getHTML() !== incoming
          : JSON.stringify(currentJson) !== JSON.stringify(incoming)
      ) {
        editor.commands.setContent(incoming as string | object, { emitUpdate: false });
      }
    }
  }, [editor, value, htmlFallback]);

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-xl border border-brand-border bg-white overflow-hidden">
      <Toolbar editor={editor} key={selectionCounter} />
      <div className="overflow-y-auto" style={{ maxHeight: "min(60vh, 500px)" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
