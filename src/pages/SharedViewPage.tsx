import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface SharedDocument {
  id: string;
  title: string;
  content: string;
  suggestions: Array<{
    id: string;
    type: 'structured' | 'narrative';
    title: string;
    content: string;
  }>;
}

export function SharedViewPage() {
  const { token } = useParams<{ token: string }>();
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Check if token exists and is valid
    if (!token) {
      setError('Invalid share link');
    }
  }, [token]);

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    // Simulate API verification
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, this would verify against the ReadOnlyToken in DynamoDB
    if (passcode === 'share123') {
      setIsAuthenticated(true);
      // Mock document data
      setDocument({
        id: token || '',
        title: 'Pacifico Datacenter Compliance Plan',
        content: `# Project Overview

This document outlines the compliance planning for the Pacifico off-grid 5GW datacenter project.

## Regulatory Framework

The project must comply with federal and state environmental regulations, including:
- EPA air quality standards
- Water usage permits
- Waste management requirements

## Timeline

Phase 1: Environmental Impact Assessment (Q1 2025)
Phase 2: Permit Applications (Q2 2025)
Phase 3: Construction Compliance (Q3-Q4 2025)`,
        suggestions: [
          {
            id: '1',
            type: 'structured',
            title: 'Environmental Compliance Checklist',
            content: '- [ ] Conduct EIA\n- [ ] Obtain permits\n- [ ] Establish monitoring',
          },
          {
            id: '2',
            type: 'narrative',
            title: 'Power Requirements Advisory',
            content: 'For a 5GW datacenter, grid connection agreements require coordination with local utilities.',
          },
        ],
      });
    } else {
      setError('Invalid passcode');
    }

    setLoading(false);
  };

  if (expired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-warning-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-slate-600">
            This shared link has expired. Please request a new link from the document owner.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Shared Document</h1>
            <p className="text-primary-200">Enter the passcode to view this document</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div>
                <label htmlFor="passcode" className="label">Passcode</label>
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(null);
                  }}
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="Enter share passcode"
                  autoFocus
                  disabled={loading}
                />
                {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || !passcode.trim()}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <span className="spinner mr-2" />
                    Verifying...
                  </>
                ) : (
                  'View Document'
                )}
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-6">
              This is a read-only view. You cannot edit this document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="spinner w-8 h-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Shared Document (Read Only)</p>
            <h1 className="text-xl font-semibold text-slate-900">{document.title}</h1>
          </div>
          <div className="badge-warning">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Read Only
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document content */}
          <div className="lg:col-span-2 card p-6">
            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-700">
                {document.content}
              </pre>
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Suggestions</h2>
            {document.suggestions.map((suggestion) => (
              <div key={suggestion.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${suggestion.type === 'structured' ? 'badge-primary' : 'badge-slate'}`}>
                    {suggestion.type}
                  </span>
                </div>
                <h3 className="font-medium text-slate-900 mb-2">{suggestion.title}</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{suggestion.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


