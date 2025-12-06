import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  generateSuggestions,
  refreshSuggestion,
  togglePin,
  setSignals,
  setApproverPov,
  type Suggestion,
  type ApproverPOV,
} from '../../store/slices/suggestionsSlice';
import { formatDistanceToNow } from 'date-fns';

const povOptions: { value: ApproverPOV; label: string }[] = [
  { value: null, label: 'All Perspectives' },
  { value: 'operational_risk', label: 'Operational Risk' },
  { value: 'regulatory_compliance', label: 'Regulatory Compliance' },
  { value: 'financial_impact', label: 'Financial Impact' },
  { value: 'safety_workforce', label: 'Safety & Workforce' },
  { value: 'environmental_impact', label: 'Environmental Impact' },
  { value: 'legal_contractual', label: 'Legal / Contractual' },
];

export function SuggestionFeed() {
  const dispatch = useAppDispatch();
  const { suggestions, signals, approverPov, isGenerating, lastGeneratedAt } = useAppSelector(
    (state) => state.suggestions
  );
  const { currentDocument } = useAppSelector((state) => state.document);
  const { currentDomain } = useAppSelector((state) => state.domain);

  const handleGenerate = useCallback(() => {
    if (currentDocument && currentDomain) {
      dispatch(
        generateSuggestions({
          documentId: currentDocument.id,
          content: currentDocument.content,
          domainId: currentDomain.id,
        })
      );
    }
  }, [dispatch, currentDocument, currentDomain]);

  const handleRefresh = useCallback(
    (suggestionId: string) => {
      dispatch(refreshSuggestion(suggestionId));
    },
    [dispatch]
  );

  const handleTogglePin = useCallback(
    (suggestionId: string) => {
      dispatch(togglePin(suggestionId));
    },
    [dispatch]
  );

  // Sort suggestions: pinned first, then by date
  const sortedSuggestions = useMemo(() => {
    return [...suggestions]
      .filter((s) => !s.superseded || s.pinned)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [suggestions]);

  // Check if suggestions are stale (older than 10 minutes)
  const isStale = useMemo(() => {
    if (!lastGeneratedAt) return false;
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return new Date(lastGeneratedAt).getTime() < tenMinutesAgo;
  }, [lastGeneratedAt]);

  if (!currentDomain || currentDomain.prepStatus !== 'ready') {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="text-slate-500 text-sm">
            Configure your domain first to get AI-powered suggestions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Signal controls */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <SignalControl
            label="Formality"
            value={signals.formality}
            options={['casual', 'moderate', 'formal']}
            onChange={(v) => dispatch(setSignals({ formality: v as typeof signals.formality }))}
          />
          <SignalControl
            label="Risk"
            value={signals.riskAppetite}
            options={['conservative', 'moderate', 'aggressive']}
            onChange={(v) => dispatch(setSignals({ riskAppetite: v as typeof signals.riskAppetite }))}
          />
          <SignalControl
            label="Strictness"
            value={signals.complianceStrictness}
            options={['lenient', 'standard', 'full']}
            onChange={(v) => dispatch(setSignals({ complianceStrictness: v as typeof signals.complianceStrictness }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={approverPov || ''}
            onChange={(e) => dispatch(setApproverPov((e.target.value || null) as ApproverPOV))}
            className="input text-sm flex-1"
          >
            {povOptions.map((opt) => (
              <option key={opt.value || 'null'} value={opt.value || ''}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary btn-sm"
          >
            {isGenerating ? (
              <span className="spinner w-4 h-4" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Generation status */}
      {isGenerating && (
        <div className="px-4 py-3 bg-primary-50 border-b border-primary-100 flex items-center gap-2">
          <span className="spinner w-4 h-4 text-primary-600" />
          <span className="text-sm text-primary-700">Generating suggestions...</span>
        </div>
      )}

      {isStale && !isGenerating && (
        <div className="px-4 py-2 bg-warning-50 border-b border-warning-100 flex items-center justify-between">
          <span className="text-xs text-warning-700">Suggestions may be stale</span>
          <button onClick={handleGenerate} className="text-xs text-warning-700 font-medium hover:underline">
            Refresh
          </button>
        </div>
      )}

      {/* Suggestions list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {sortedSuggestions.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-4">No suggestions yet</p>
            <button onClick={handleGenerate} className="btn-primary">
              Generate Suggestions
            </button>
          </div>
        )}

        {sortedSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onPin={() => handleTogglePin(suggestion.id)}
            onRefresh={() => handleRefresh(suggestion.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SignalControlProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function SignalControl({ label, value, options, onChange }: SignalControlProps) {
  return (
    <div>
      <label className="text-xs text-slate-500 block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onPin: () => void;
  onRefresh: () => void;
}

function SuggestionCard({ suggestion, onPin, onRefresh }: SuggestionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true });

  return (
    <div
      className={`card p-4 transition-all ${
        suggestion.pinned ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`badge ${
              suggestion.type === 'structured' ? 'badge-primary' : 'badge-slate'
            }`}
          >
            {suggestion.type}
          </span>
          <span className="text-xs text-slate-400">{timeAgo}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPin}
            className={`p-1 rounded hover:bg-slate-100 ${
              suggestion.pinned ? 'text-primary-600' : 'text-slate-400'
            }`}
            title={suggestion.pinned ? 'Unpin' : 'Pin'}
          >
            <svg className="w-4 h-4" fill={suggestion.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={onRefresh}
            className="p-1 rounded hover:bg-slate-100 text-slate-400"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-slate-900 mb-2">{suggestion.title}</h4>

      {/* Content */}
      <div className="text-sm text-slate-600 whitespace-pre-wrap">{suggestion.content}</div>

      {/* Sources */}
      {suggestion.sourceRefs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Sources:</p>
          <div className="flex flex-wrap gap-1">
            {suggestion.sourceRefs.map((ref, i) => (
              <a
                key={i}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline truncate max-w-[200px]"
              >
                {new URL(ref).hostname}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              suggestion.confidence > 0.8
                ? 'bg-success-500'
                : suggestion.confidence > 0.6
                ? 'bg-warning-500'
                : 'bg-slate-400'
            }`}
            style={{ width: `${suggestion.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">
          {Math.round(suggestion.confidence * 100)}% confidence
        </span>
      </div>
    </div>
  );
}


