import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';

interface BrainDumpEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

export function BrainDumpEditor({ content, onUpdate }: BrainDumpEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'brain-dump-link' },
      }),
      Placeholder.configure({
        placeholder: "What's on your mind? Start typing...",
      }),
    ],
    content,
    editorProps: {
      attributes: { class: 'brain-dump-editor-content' },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  // Sync content prop changes back to editor
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <>
      <EditorToolbar editor={editor} />
      <div className="brain-dump-editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
