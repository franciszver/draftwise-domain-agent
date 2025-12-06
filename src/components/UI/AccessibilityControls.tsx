import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFontSize, toggleHighContrast } from '../../store/slices/uiSlice';

export function AccessibilityControls() {
  const dispatch = useAppDispatch();
  const { fontSize, highContrast } = useAppSelector((state) => state.ui);

  return (
    <div className="flex items-center gap-2">
      {/* Font Size Controls */}
      <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => dispatch(setFontSize('small'))}
          className={`px-2 py-1 text-xs ${
            fontSize === 'small'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          title="Small text"
          aria-label="Small text size"
        >
          A-
        </button>
        <button
          onClick={() => dispatch(setFontSize('medium'))}
          className={`px-2 py-1 text-sm ${
            fontSize === 'medium'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          title="Medium text"
          aria-label="Medium text size"
        >
          A
        </button>
        <button
          onClick={() => dispatch(setFontSize('large'))}
          className={`px-2 py-1 text-base ${
            fontSize === 'large'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          title="Large text"
          aria-label="Large text size"
        >
          A+
        </button>
      </div>

      {/* High Contrast Toggle */}
      <button
        onClick={() => dispatch(toggleHighContrast())}
        className={`p-2 rounded-lg border ${
          highContrast
            ? 'bg-slate-900 text-white border-white'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        }`}
        title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
        aria-pressed={highContrast}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>
    </div>
  );
}


