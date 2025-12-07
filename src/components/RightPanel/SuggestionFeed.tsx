import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  generateSuggestions,
  refreshSuggestion,
  togglePin,
  archiveSuggestion,
  unarchiveSuggestion,
  setSignals,
  setApproverPov,
  setSuggestionCount,
  type Suggestion,
  type ApproverPOV,
} from '../../store/slices/suggestionsSlice';
import {
  toggleSuggestionCollapse,
  collapseAllSuggestions,
  expandAllSuggestions,
} from '../../store/slices/uiSlice';
import { formatDistanceToNow } from 'date-fns';

const suggestionCountOptions = [3, 5, 8, 10, 15];

const povOptions: { value: ApproverPOV; label: string }[] = [
  { value: null, label: 'All Perspectives' },
  { value: 'operational_risk', label: 'Operational Risk' },
  { value: 'regulatory_compliance', label: 'Regulatory Compliance' },
  { value: 'financial_impact', label: 'Financial Impact' },
  { value: 'safety_workforce', label: 'Safety & Workforce' },
  { value: 'environmental_impact', label: 'Environmental Impact' },
  { value: 'legal_contractual', label: 'Legal / Contractual' },
];

// Tooltip content for signal controls
const signalTooltips = {
  formality: {
    title: 'Formality',
    description: 'Controls the language style and precision of suggestions',
    options: {
      casual: 'Conversational language for internal memos and team communications',
      moderate: 'Standard business language for policies and general documents',
      formal: 'Precise, structured language for official reports and regulatory filings',
    },
  },
  risk: {
    title: 'Risk Tolerance',
    description: 'Controls how conservative or aggressive suggestions are',
    options: {
      conservative: 'Stricter interpretations, more safeguards, higher compliance margins',
      moderate: 'Balanced approach between strict compliance and operational flexibility',
      aggressive: 'Minimum compliance thresholds, optimized for efficiency',
    },
  },
  stickiness: {
    title: 'Stickiness',
    description: 'Controls suggestion persistence for critical compliance issues',
    options: {
      low: 'Gentle reminders, easily dismissed, will not resurface',
      medium: 'Important suggestions may reappear if issues remain unaddressed',
      high: 'Critical gaps are persistent, resurface until properly addressed',
    },
  },
};

export function SuggestionFeed() {
  const dispatch = useAppDispatch();
  const { suggestions, archivedSuggestions, signals, approverPov, suggestionCount, isGenerating, lastGeneratedAt } = useAppSelector(
    (state) => state.suggestions
  );
  const { currentDocument } = useAppSelector((state) => state.document);
  const { currentDomain, sourcesVersion } = useAppSelector((state) => state.domain);
  const { collapsedSuggestions } = useAppSelector((state) => state.ui);

  const [showArchived, setShowArchived] = useState(false);

  // Track sources version for auto-refresh
  const prevSourcesVersion = useRef(sourcesVersion);

  // Auto-refresh suggestions when sources change
  useEffect(() => {
    if (
      prevSourcesVersion.current !== sourcesVersion &&
      sourcesVersion > 0 &&
      currentDocument &&
      currentDomain?.prepStatus === 'ready' &&
      !isGenerating
    ) {
      // Sources have changed, trigger refresh
      dispatch(
        generateSuggestions({
          documentId: currentDocument.id,
          content: currentDocument.content,
          domainId: currentDomain.id,
        })
      );
    }
    prevSourcesVersion.current = sourcesVersion;
  }, [sourcesVersion, currentDocument, currentDomain, isGenerating, dispatch]);

  const handleGenerate = useCallback(() => {
    if (currentDocument && currentDomain) {
      dispatch(
        generateSuggestions({
          documentId: currentDocument.id,
          content: currentDocument.content,
          domainId: currentDomain.id,
          appendMode: false,
        })
      );
    }
  }, [dispatch, currentDocument, currentDomain]);

  const handleGenerateMore = useCallback(() => {
    if (currentDocument && currentDomain) {
      dispatch(
        generateSuggestions({
          documentId: currentDocument.id,
          content: currentDocument.content,
          domainId: currentDomain.id,
          appendMode: true,
        })
      );
    }
  }, [dispatch, currentDocument, currentDomain]);

  const handleArchive = useCallback(
    (suggestionId: string) => {
      dispatch(archiveSuggestion(suggestionId));
    },
    [dispatch]
  );

  const handleUnarchive = useCallback(
    (suggestionId: string) => {
      dispatch(unarchiveSuggestion(suggestionId));
    },
    [dispatch]
  );

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

  const handleToggleCollapse = useCallback(
    (suggestionId: string) => {
      dispatch(toggleSuggestionCollapse(suggestionId));
    },
    [dispatch]
  );

  const handleCollapseAll = useCallback(() => {
    const allIds = suggestions.filter((s) => !s.superseded || s.pinned).map((s) => s.id);
    dispatch(collapseAllSuggestions(allIds));
  }, [dispatch, suggestions]);

  const handleExpandAll = useCallback(() => {
    dispatch(expandAllSuggestions());
  }, [dispatch]);

  // Sort suggestions: pinned first, then by date (exclude archived)
  const sortedSuggestions = useMemo(() => {
    return [...suggestions]
      .filter((s) => (!s.superseded || s.pinned) && !s.archived)
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
            tooltip={signalTooltips.formality}
            value={signals.formality}
            options={['casual', 'moderate', 'formal']}
            onChange={(v) => dispatch(setSignals({ formality: v as typeof signals.formality }))}
          />
          <SignalControl
            label="Risk"
            tooltip={signalTooltips.risk}
            value={signals.riskAppetite}
            options={['conservative', 'moderate', 'aggressive']}
            onChange={(v) => dispatch(setSignals({ riskAppetite: v as typeof signals.riskAppetite }))}
          />
          <SignalControl
            label="Stickiness"
            tooltip={signalTooltips.stickiness}
            value={signals.complianceStrictness}
            options={['low', 'medium', 'high']}
            optionLabels={{ lenient: 'low', standard: 'medium', full: 'high' }}
            tooltipAlign="right"
            onChange={(v) => {
              // Map the new labels back to the store values
              const valueMap: Record<string, 'lenient' | 'standard' | 'full'> = {
                low: 'lenient',
                medium: 'standard',
                high: 'full',
              };
              dispatch(setSignals({ complianceStrictness: valueMap[v] || 'standard' }));
            }}
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
          <select
            value={suggestionCount}
            onChange={(e) => dispatch(setSuggestionCount(parseInt(e.target.value)))}
            className="input text-sm w-16"
            title="Number of suggestions"
          >
            {suggestionCountOptions.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary btn-sm"
            title="Generate Suggestions"
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

      {/* Controls bar */}
      {(sortedSuggestions.length > 0 || archivedSuggestions.length > 0) && (
        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {showArchived
                ? `${archivedSuggestions.length} archived`
                : `${sortedSuggestions.length} suggestion${sortedSuggestions.length !== 1 ? 's' : ''}`}
            </span>
            {archivedSuggestions.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`text-xs ${showArchived ? 'text-primary-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {showArchived ? 'Show Active' : `View Archived (${archivedSuggestions.length})`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!showArchived && sortedSuggestions.length > 0 && (
              <>
                <button
                  onClick={handleGenerateMore}
                  disabled={isGenerating}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  title="Generate More"
                >
                  + More
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                  onClick={handleCollapseAll}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  title="Collapse All"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </button>
                <button
                  onClick={handleExpandAll}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  title="Expand All"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Suggestions list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {!showArchived && sortedSuggestions.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-4">No suggestions yet</p>
            <button onClick={handleGenerate} className="btn-primary">
              Generate Suggestions
            </button>
          </div>
        )}

        {showArchived && archivedSuggestions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No archived suggestions</p>
          </div>
        )}

        {showArchived
          ? archivedSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isCollapsed={false}
              isArchived={true}
              onPin={() => { }}
              onRefresh={() => { }}
              onToggleCollapse={() => { }}
              onArchive={() => handleUnarchive(suggestion.id)}
            />
          ))
          : sortedSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isCollapsed={collapsedSuggestions.includes(suggestion.id)}
              isArchived={false}
              onPin={() => handleTogglePin(suggestion.id)}
              onRefresh={() => handleRefresh(suggestion.id)}
              onToggleCollapse={() => handleToggleCollapse(suggestion.id)}
              onArchive={() => handleArchive(suggestion.id)}
            />
          ))}
      </div>
    </div>
  );
}

interface SignalControlProps {
  label: string;
  tooltip: {
    title: string;
    description: string;
    options: Record<string, string>;
  };
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
  tooltipAlign?: 'left' | 'right';
}

function SignalControl({ label, tooltip, value, options, optionLabels, onChange, tooltipAlign = 'left' }: SignalControlProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Map the current store value to display value if optionLabels provided
  // optionLabels maps store values (lenient/standard/full) to display values (low/medium/high)
  const displayValue = optionLabels ? optionLabels[value] || value : value;

  return (
    <div className="relative">
      <div className="flex items-center gap-1 mb-1">
        <label className="text-xs text-slate-500">{label}</label>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`absolute z-50 top-full mt-1 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg ${tooltipAlign === 'right' ? 'right-0' : 'left-0'}`}>
          <p className="font-medium mb-1">{tooltip.title}</p>
          <p className="text-slate-300 mb-2">{tooltip.description}</p>
          <div className="space-y-1">
            {Object.entries(tooltip.options).map(([key, desc]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium capitalize text-primary-300">{key}:</span>
                <span className="text-slate-300">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <select
        value={displayValue}
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
  isCollapsed: boolean;
  isArchived: boolean;
  onPin: () => void;
  onRefresh: () => void;
  onToggleCollapse: () => void;
  onArchive: () => void;
}

function SuggestionCard({ suggestion, isCollapsed, isArchived, onPin, onRefresh, onToggleCollapse, onArchive }: SuggestionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true });

  // Severity badge based on confidence (inverse - lower confidence = higher severity)
  const getSeverityBadge = () => {
    if (suggestion.confidence < 0.6) return { label: 'High', class: 'bg-danger-100 text-danger-700' };
    if (suggestion.confidence < 0.8) return { label: 'Medium', class: 'bg-warning-100 text-warning-700' };
    return { label: 'Low', class: 'bg-success-100 text-success-700' };
  };

  const severity = getSeverityBadge();

  if (isCollapsed) {
    return (
      <div
        className={`card p-3 transition-all cursor-pointer hover:bg-slate-50 ${suggestion.pinned ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''
          }`}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h4 className="font-medium text-slate-900 truncate">{suggestion.title}</h4>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full ${severity.class}`}>
              {severity.label}
            </span>
            {suggestion.pinned && (
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card p-4 transition-all ${suggestion.pinned ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span
            className={`badge ${suggestion.type === 'structured' ? 'badge-primary' : 'badge-slate'
              }`}
          >
            {suggestion.type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${severity.class}`}>
            {severity.label}
          </span>
          <span className="text-xs text-slate-400">{timeAgo}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isArchived && (
            <>
              <button
                onClick={onPin}
                className={`p-1 rounded hover:bg-slate-100 ${suggestion.pinned ? 'text-primary-600' : 'text-slate-400'
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
            </>
          )}
          <button
            onClick={onArchive}
            className="p-1 rounded hover:bg-slate-100 text-slate-400"
            title={isArchived ? 'Restore' : 'Archive'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isArchived ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              )}
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
          <div className="flex items-center gap-1 mb-2">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-xs font-medium text-slate-600">Reference Sources ({suggestion.sourceRefs.length})</p>
          </div>
          <div className="space-y-1.5">
            {suggestion.sourceRefs.map((ref, i) => {
              let hostname = ref;
              let pathname = '';
              try {
                const url = new URL(ref);
                hostname = url.hostname.replace('www.', '');
                pathname = url.pathname.length > 1 ? url.pathname.slice(0, 30) + (url.pathname.length > 30 ? '...' : '') : '';
              } catch {
                // Invalid URL, use the ref as-is
              }
              return (
                <a
                  key={i}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-md bg-slate-50 hover:bg-primary-50 border border-slate-100 hover:border-primary-200 transition-colors group"
                >
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 group-hover:text-primary-700 truncate">
                      {hostname}
                    </p>
                    {pathname && (
                      <p className="text-xs text-slate-400 group-hover:text-primary-400 truncate">
                        {pathname}
                      </p>
                    )}
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${suggestion.confidence > 0.8
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
