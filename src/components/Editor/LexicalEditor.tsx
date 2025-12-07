import { useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getRoot, $createParagraphNode, $createTextNode, EditorState, LexicalEditor as LexicalEditorType } from 'lexical';

interface LexicalEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const theme = {
  paragraph: 'mb-3',
  heading: {
    h1: 'text-3xl font-bold text-slate-900 mb-4 mt-6',
    h2: 'text-2xl font-semibold text-slate-800 mb-3 mt-5',
    h3: 'text-xl font-semibold text-slate-800 mb-2 mt-4',
    h4: 'text-lg font-medium text-slate-700 mb-2 mt-3',
    h5: 'text-base font-medium text-slate-700 mb-1 mt-2',
  },
  list: {
    ul: 'list-disc ml-6 mb-4',
    ol: 'list-decimal ml-6 mb-4',
    listitem: 'mb-1',
    nested: {
      listitem: 'ml-4',
    },
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono bg-slate-100 px-1 py-0.5 rounded text-sm',
  },
  quote: 'border-l-4 border-primary-500 pl-4 italic text-slate-600 my-4',
  link: 'text-primary-600 hover:text-primary-700 underline cursor-pointer',
  table: 'w-full border-collapse mb-4',
  tableCell: 'border border-slate-300 px-3 py-2',
  tableCellHeader: 'bg-slate-100 font-semibold',
};

function onError(error: Error): void {
  console.error('Lexical error:', error);
}

// Plugin to initialize editor with content
function InitialContentPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content) {
      editor.update(() => {
        const root = $getRoot();
        // Only set content if root is empty
        if (root.getTextContent().trim() === '') {
          root.clear();
          // Split content by newlines and create paragraphs
          const lines = content.split('\n');
          lines.forEach((line) => {
            const paragraph = $createParagraphNode();
            if (line.trim()) {
              paragraph.append($createTextNode(line));
            }
            root.append(paragraph);
          });
        }
      });
    }
  }, [editor, content]);

  return null;
}

export function LexicalEditor({ initialContent, onChange, readOnly = false }: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'DraftWiseEditor',
    theme,
    onError,
    editable: !readOnly,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  };

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditorType) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        onChange(textContent);
      });
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="lexical-editor relative min-h-[400px]">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none min-h-[400px] prose prose-slate max-w-none"
              aria-placeholder="Start typing your planning document..."
              placeholder={
                <div className="absolute top-0 left-0 text-slate-400 pointer-events-none">
                  Start typing your planning document...
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <InitialContentPlugin content={initialContent} />
      </div>
    </LexicalComposer>
  );
}


