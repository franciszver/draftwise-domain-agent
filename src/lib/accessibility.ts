// Accessibility utilities

export type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZE_KEY = 'draftwise_font_size';
const HIGH_CONTRAST_KEY = 'draftwise_high_contrast';

export function getFontSizeClass(size: FontSize): string {
  switch (size) {
    case 'small':
      return 'text-sm';
    case 'large':
      return 'text-lg';
    default:
      return 'text-base';
  }
}

export function getFontSizeScale(size: FontSize): number {
  switch (size) {
    case 'small':
      return 0.875;
    case 'large':
      return 1.125;
    default:
      return 1;
  }
}

export function saveFontSize(size: FontSize): void {
  localStorage.setItem(FONT_SIZE_KEY, size);
}

export function loadFontSize(): FontSize {
  const stored = localStorage.getItem(FONT_SIZE_KEY);
  if (stored && ['small', 'medium', 'large'].includes(stored)) {
    return stored as FontSize;
  }
  return 'medium';
}

export function saveHighContrast(enabled: boolean): void {
  localStorage.setItem(HIGH_CONTRAST_KEY, enabled.toString());
}

export function loadHighContrast(): boolean {
  return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true';
}

export function applyHighContrast(enabled: boolean): void {
  if (enabled) {
    document.documentElement.classList.add('high-contrast');
  } else {
    document.documentElement.classList.remove('high-contrast');
  }
}

// Keyboard navigation helpers
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
): number {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      newIndex = Math.min(currentIndex + 1, items.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      onSelect(currentIndex);
      break;
  }

  if (newIndex !== currentIndex && items[newIndex]) {
    items[newIndex].focus();
  }

  return newIndex;
}

// Screen reader announcements
let announcer: HTMLElement | null = null;

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }

  // Clear and set new message to trigger announcement
  announcer.textContent = '';
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 100);
}

// Focus management
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}


