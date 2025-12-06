import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow some shortcuts even in inputs
        const isGlobalShortcut = event.ctrlKey && ['s', 'S'].includes(event.key);
        if (!isGlobalShortcut) return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common shortcuts for the editor
export function useEditorShortcuts(handlers: {
  onSave?: () => void;
  onSnapshot?: () => void;
  onTogglePanel?: () => void;
  onNewDocument?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (handlers.onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      handler: handlers.onSave,
      description: 'Save document',
    });
  }

  if (handlers.onSnapshot) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      shift: true,
      handler: handlers.onSnapshot,
      description: 'Create snapshot',
    });
  }

  if (handlers.onTogglePanel) {
    shortcuts.push({
      key: '\\',
      ctrl: true,
      handler: handlers.onTogglePanel,
      description: 'Toggle side panel',
    });
  }

  if (handlers.onNewDocument) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      handler: handlers.onNewDocument,
      description: 'New document',
    });
  }

  useKeyboardShortcuts(shortcuts);
}


