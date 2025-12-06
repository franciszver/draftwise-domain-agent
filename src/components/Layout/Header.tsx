import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, validateAdminCode } from '../../store/slices/authSlice';
import { toggleRightPanel } from '../../store/slices/uiSlice';
import { useState } from 'react';

interface HeaderProps {
  onNewDocument: () => void;
}

export function Header({ onNewDocument }: HeaderProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentDocument, isAutosaving } = useAppSelector((state) => state.document);
  const { isAdmin } = useAppSelector((state) => state.auth);
  const { rightPanelOpen } = useAppSelector((state) => state.ui);
  
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleAdminAccess = async () => {
    if (!adminCode.trim()) return;
    const result = await dispatch(validateAdminCode(adminCode));
    if (validateAdminCode.fulfilled.match(result)) {
      setShowAdminPrompt(false);
      setAdminCode('');
      navigate('/admin');
    } else {
      setAdminError('Invalid admin code');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900">DraftWise</span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Document title */}
          {currentDocument && (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium text-slate-700 max-w-xs truncate">
                {currentDocument.title}
              </h1>
              {isAutosaving && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="spinner w-3 h-3" />
                  Saving...
                </span>
              )}
              {!isAutosaving && currentDocument.lastAutosaveAt && (
                <span className="text-xs text-slate-400">Saved</span>
              )}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewDocument}
            className="btn-ghost btn-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>

          <button
            onClick={() => dispatch(toggleRightPanel())}
            className={`btn-ghost btn-sm ${rightPanelOpen ? 'bg-slate-100' : ''}`}
            title={rightPanelOpen ? 'Hide panel' : 'Show panel'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-2" />

          {/* Admin/Settings */}
          {isAdmin ? (
            <button
              onClick={() => navigate('/admin')}
              className="btn-ghost btn-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </button>
          ) : (
            <button
              onClick={() => setShowAdminPrompt(true)}
              className="btn-ghost btn-sm"
              title="Admin access"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="btn-ghost btn-sm text-slate-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Admin code prompt modal */}
      {showAdminPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Access</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Admin Code</label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setAdminError(null);
                  }}
                  className={`input ${adminError ? 'input-error' : ''}`}
                  placeholder="Enter admin code"
                  autoFocus
                />
                {adminError && <p className="mt-2 text-sm text-danger-600">{adminError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAdminPrompt(false);
                    setAdminCode('');
                    setAdminError(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminAccess}
                  disabled={!adminCode.trim()}
                  className="btn-primary"
                >
                  Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


