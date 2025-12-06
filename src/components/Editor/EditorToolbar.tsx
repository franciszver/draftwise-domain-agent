import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useCallback } from 'react';

interface EditorToolbarProps {
  onSnapshot: () => void;
}

export function EditorToolbar({ onSnapshot }: EditorToolbarProps) {
  return (
    <div className="border-b border-slate-200 px-4 py-2 bg-slate-50 flex items-center gap-1 flex-wrap">
      {/* Text formatting */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<BoldIcon />}
          tooltip="Bold (Ctrl+B)"
          command="bold"
        />
        <ToolbarButton
          icon={<ItalicIcon />}
          tooltip="Italic (Ctrl+I)"
          command="italic"
        />
        <ToolbarButton
          icon={<UnderlineIcon />}
          tooltip="Underline (Ctrl+U)"
          command="underline"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<BulletListIcon />}
          tooltip="Bullet list"
          command="bullet-list"
        />
        <ToolbarButton
          icon={<NumberedListIcon />}
          tooltip="Numbered list"
          command="numbered-list"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<AlignLeftIcon />}
          tooltip="Align left"
          command="align-left"
        />
        <ToolbarButton
          icon={<AlignCenterIcon />}
          tooltip="Align center"
          command="align-center"
        />
        <ToolbarButton
          icon={<AlignRightIcon />}
          tooltip="Align right"
          command="align-right"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Special */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<RedactionIcon />}
          tooltip="Insert redaction marker"
          command="redaction"
        />
        <ToolbarButton
          icon={<CitationIcon />}
          tooltip="Insert citation"
          command="citation"
        />
      </ToolbarGroup>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Snapshot button */}
      <button
        onClick={onSnapshot}
        className="btn-ghost btn-sm text-slate-600"
        title="Create snapshot"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Snapshot
      </button>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-slate-300 mx-2" />;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  command: string;
  active?: boolean;
}

function ToolbarButton({ icon, tooltip, command, active }: ToolbarButtonProps) {
  // This is a simplified version - in production, we'd use proper Lexical commands
  const handleClick = useCallback(() => {
    // Command handling would be implemented here with Lexical
    console.log('Toolbar command:', command);
  }, [command]);

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded hover:bg-slate-200 transition-colors ${
        active ? 'bg-slate-200 text-primary-600' : 'text-slate-600'
      }`}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

// Icons
function BoldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0v16m-4 0h4" transform="rotate(10 12 12)" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a5 5 0 0010 0V4M5 20h14" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="2" cy="6" r="1" fill="currentColor" />
      <circle cx="2" cy="12" r="1" fill="currentColor" />
      <circle cx="2" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13" />
      <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
      <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
      <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
    </svg>
  );
}

function RedactionIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function CitationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}


