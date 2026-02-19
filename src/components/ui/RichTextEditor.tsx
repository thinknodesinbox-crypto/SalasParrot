import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useCallback } from 'react';

/** Convert plain text (with \n) to HTML paragraphs for backward compatibility */
function ensureHtml(content: string): string {
  if (!content) return '';
  // Already HTML — return as-is
  if (/<[a-z][\s\S]*>/i.test(content)) return content;
  // Plain text — convert newlines to paragraphs
  return content
    .split('\n')
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('');
}

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  variables?: string[];
  disabled?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '150px',
  variables,
  disabled = false,
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Underline,
    ],
    content: ensureHtml(content),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none text-sm text-[#1E293B] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync content from parent when it changes externally (e.g. loading saved data)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const incomingHtml = ensureHtml(content);
    // Only update if content is meaningfully different (avoid cursor jumps)
    if (incomingHtml !== currentHtml && content !== currentHtml) {
      editor.commands.setContent(incomingHtml, { emitUpdate: false });
    }
  }, [content, editor]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }
    setShowLinkInput(true);
    const existingHref = editor.getAttributes('link').href;
    setLinkUrl(existingHref || '');
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertVariable = useCallback(
    (variable: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(variable).run();
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[#E2E8F0] px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-[#E2E8F0]" />

        <ToolbarButton active={editor.isActive('link')} onClick={toggleLink} title="Link">
          <LinkIcon />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-[#E2E8F0]" />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <BulletListIcon />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <OrderedListIcon />
        </ToolbarButton>
      </div>

      {/* Link URL Input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') {
                setShowLinkInput(false);
                setLinkUrl('');
              }
            }}
            placeholder="https://example.com"
            className="flex-1 rounded border border-[#E2E8F0] px-2 py-1 text-xs focus:border-[#FF6B35] focus:outline-none"
            autoFocus
          />
          <button
            onClick={applyLink}
            className="rounded bg-[#FF6B35] px-2 py-1 text-xs font-medium text-white hover:bg-[#E85A2A]"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="rounded px-2 py-1 text-xs text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="px-3 py-2">
        {!content && !editor.isFocused && editor.isEmpty && (
          <div className="pointer-events-none absolute text-sm text-[#94A3B8]">{placeholder}</div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Variable Buttons */}
      {variables && variables.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#E2E8F0] px-3 py-2">
          {variables.map((variable) => (
            <button
              key={variable}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertVariable(variable)}
              className="rounded bg-[#FFF7ED] px-2 py-1 text-[10px] font-medium text-[#FF6B35] transition-colors hover:bg-[#FFEDD5]"
            >
              {variable}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Toolbar Button
function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
      }`}
    >
      {children}
    </button>
  );
}

// Icons (inline SVGs matching project convention)
function BoldIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0l-4 16m-2 0h4" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v7a6 6 0 0012 0V3M4 21h16" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <text x="1" y="8" fontSize="7" fontFamily="sans-serif">
        1.
      </text>
      <text x="1" y="14.5" fontSize="7" fontFamily="sans-serif">
        2.
      </text>
      <text x="1" y="21" fontSize="7" fontFamily="sans-serif">
        3.
      </text>
      <line
        x1="10"
        y1="6"
        x2="21"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="12.5"
        x2="21"
        y2="12.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="19"
        x2="21"
        y2="19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
