'use client';

/**
 * RichContentEditor
 *
 * Tiptap block editor for curriculum_lessons.content (JSONB).
 * Accepts and emits ProseMirror JSON so the value can be stored directly
 * in the content column without serialisation round-trips.
 *
 * Usage:
 *   <RichContentEditor value={lesson.content} onChange={json => setField(id, 'content', json)} />
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Undo,
  Redo,
} from 'lucide-react';

interface Props {
  value: object | null;
  onChange: (json: object) => void;
  placeholder?: string;
  /** Max characters — shown in footer, not enforced as a hard limit */
  maxChars?: number;
}

const TOOLBAR_BUTTON =
  'p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

export default function RichContentEditor({
  value,
  onChange,
  placeholder = 'Write lesson content…',
  maxChars = 50_000,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Disable history — we manage undo via toolbar buttons only
        history: {},
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxChars }),
    ],
    content: value ?? undefined,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none ' +
          'prose-headings:font-semibold prose-headings:text-slate-900 ' +
          'prose-p:text-slate-700 prose-li:text-slate-700 ' +
          'prose-blockquote:border-l-4 prose-blockquote:border-brand-blue-300 prose-blockquote:pl-4 prose-blockquote:text-slate-600',
      },
    },
  });

  // Sync external value changes (e.g. switching between lessons)
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value ?? null);
    if (current !== incoming) {
      editor.commands.setContent(value ?? null, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const chars = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <button
          type="button"
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().toggleBold()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().toggleItalic()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          type="button"
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          type="button"
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : ''}`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={TOOLBAR_BUTTON}
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          type="button"
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={TOOLBAR_BUTTON}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={TOOLBAR_BUTTON}
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor canvas */}
      <EditorContent editor={editor} />

      {/* Footer — character count */}
      <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-3 py-1">
        <span className={`text-xs ${chars > maxChars * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
          {chars.toLocaleString()} / {maxChars.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
}
