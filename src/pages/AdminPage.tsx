import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

interface AdminConfig {
  passcode: string;
  maxActiveSessions: number;
  maxReadOnlyLinks: number;
  preferredAiProvider: 'openai' | 'openrouter';
  preferredModel: string;
  retentionDays: number;
}

export function AdminPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAdmin } = useAppSelector((state) => state.auth);

  const [config, setConfig] = useState<AdminConfig>({
    passcode: '********',
    maxActiveSessions: 10,
    maxReadOnlyLinks: 50,
    preferredAiProvider: 'openai',
    preferredModel: 'gpt-4o',
    retentionDays: 3,
  });

  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Access denied. Admin privileges required.</p>
          <button onClick={() => navigate('/editor')} className="btn-primary mt-4">
            Return to Editor
          </button>
        </div>
      </div>
    );
  }

  const handleRotatePasscode = async () => {
    if (!newPasscode.trim()) return;
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setConfig((prev) => ({ ...prev, passcode: '********' }));
    setNewPasscode('');
    setShowPasscodeInput(false);
    setSaving(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/editor')}
              className="btn-ghost"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Editor
            </button>
            <h1 className="text-xl font-semibold text-slate-900">Admin Console</h1>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Access Control */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Access Control</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Current Passcode</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={config.passcode}
                    readOnly
                    className="input flex-1"
                  />
                  <button
                    onClick={() => setShowPasscodeInput(!showPasscodeInput)}
                    className="btn-secondary"
                  >
                    Rotate
                  </button>
                </div>
              </div>

              {showPasscodeInput && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <label className="label">New Passcode</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      className="input flex-1"
                      placeholder="Enter new passcode"
                    />
                    <button
                      onClick={handleRotatePasscode}
                      disabled={saving || !newPasscode.trim()}
                      className="btn-primary"
                    >
                      {saving ? 'Saving...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Active Sessions</label>
                  <input
                    type="number"
                    value={config.maxActiveSessions}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maxActiveSessions: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="input"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="label">Max Read-Only Links</label>
                  <input
                    type="number"
                    value={config.maxReadOnlyLinks}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maxReadOnlyLinks: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="input"
                    min="1"
                    max="500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Preferred Provider</label>
                <select
                  value={config.preferredAiProvider}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      preferredAiProvider: e.target.value as 'openai' | 'openrouter',
                    }))
                  }
                  className="input"
                >
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div>
                <label className="label">Preferred Model</label>
                <select
                  value={config.preferredModel}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      preferredModel: e.target.value,
                    }))
                  }
                  className="input"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus (via OpenRouter)</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet (via OpenRouter)</option>
                </select>
              </div>

              <div>
                <label className="label">Data Retention (Days)</label>
                <input
                  type="number"
                  value={config.retentionDays}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      retentionDays: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="input"
                  min="1"
                  max="30"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Documents will be automatically purged after this period
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Usage Statistics</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">Active Sessions</p>
                <p className="text-2xl font-bold text-slate-900">3</p>
                <p className="text-xs text-slate-400">of {config.maxActiveSessions} max</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">Active Links</p>
                <p className="text-2xl font-bold text-slate-900">7</p>
                <p className="text-xs text-slate-400">of {config.maxReadOnlyLinks} max</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">Documents</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
                <p className="text-xs text-slate-400">total created</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">AI Requests</p>
                <p className="text-2xl font-bold text-slate-900">156</p>
                <p className="text-xs text-slate-400">this month</p>
              </div>
            </div>
          </div>

          {/* Active Links */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Read-Only Links</h2>

            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Document {i} - Planning Doc
                    </p>
                    <p className="text-xs text-slate-500">
                      Expires in {24 + i * 12}h
                    </p>
                  </div>
                  <button className="text-danger-600 hover:text-danger-700 text-sm">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <span className="spinner mr-2" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}


