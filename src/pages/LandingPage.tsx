import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { validatePasscode, checkSession, clearError } from '../store/slices/authSlice';

export function LandingPage() {
  const [passcode, setPasscode] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for existing session on mount
    dispatch(checkSession());
  }, [dispatch]);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/editor');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim()) {
      dispatch(validatePasscode(passcode));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasscode(e.target.value);
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">DraftWise</h1>
          <p className="text-primary-200">
            Regulatory & Compliance Deep Agent
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Welcome</h2>
            <p className="text-slate-500 text-sm mt-1">
              Enter your access code to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="label">
                Access Code
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={handleInputChange}
                className={`input ${error ? 'input-error' : ''}`}
                placeholder="Enter passcode"
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="mt-2 text-sm text-danger-600">{error}</p>
              )}
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
                'Access Application'
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              This is a secure application for authorized users only.
              <br />
              Contact your administrator if you need access.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-primary-200 text-sm">
          <p>AI-powered compliance planning assistant</p>
        </div>
      </div>
    </div>
  );
}


