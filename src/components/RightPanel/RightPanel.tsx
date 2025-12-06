import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setRightPanelTab } from '../../store/slices/uiSlice';
import { DomainPanel } from './DomainPanel';
import { SuggestionFeed } from './SuggestionFeed';
import { HistoryPanel } from './HistoryPanel';

const tabs = [
  { id: 'domain' as const, label: 'Domain', icon: GlobeIcon },
  { id: 'suggestions' as const, label: 'Suggestions', icon: LightbulbIcon },
  { id: 'history' as const, label: 'History', icon: ClockIcon },
];

export function RightPanel() {
  const dispatch = useAppDispatch();
  const { rightPanelTab } = useAppSelector((state) => state.ui);

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch(setRightPanelTab(tab.id))}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              rightPanelTab === tab.id
                ? 'text-primary-600 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <tab.icon />
              {tab.label}
            </div>
            {rightPanelTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {rightPanelTab === 'domain' && <DomainPanel />}
        {rightPanelTab === 'suggestions' && <SuggestionFeed />}
        {rightPanelTab === 'history' && <HistoryPanel />}
      </div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}


