import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Code from '@tiptap/extension-code'; // For inline code
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'; // For code blocks
import { createLowlight } from 'lowlight'; // Import createLowlight
// Import languages for syntax highlighting (optional, add as needed)
import html from 'highlight.js/lib/languages/xml'; 
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import Placeholder from '@tiptap/extension-placeholder';

// Instantiate lowlight with registered languages
const lowlight = createLowlight({
  html,
  css,
  javascript,
  typescript,
  json,
});

interface RichTextEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
}

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return; // Cancelled
    if (url === '') { // Unset link
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 rounded-t-md bg-gray-50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Bold</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Italic</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('underline') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Underline</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Bullet List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Numbered List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('code') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Inline Code</button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('codeBlock') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Code Block</button>
      <button type="button" onClick={addLink} className={`px-2 py-1 text-sm rounded ${editor.isActive('link') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>Link</button>
    </div>
  );
};


const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable StarterKit's default to use CodeBlockLowlight
        heading: { // Configure heading levels if needed
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false, 
        autolink: true,
        linkOnPaste: true,
      }),
      Code, 
      CodeBlockLowlight.configure({ 
        lowlight,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
      })
    ],
    content: content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-3 border border-gray-300 rounded-b-md min-h-[150px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Use `setContent` carefully. `false` for `emitUpdate` is correct here.
      editor.commands.setContent(content, false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]); // Only update if external content changes

  return (
    <div className="rounded-md shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;