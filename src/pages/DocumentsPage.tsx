import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadAllDocuments, deleteDocument, duplicateDocument, Document } from '../store/slices/documentSlice';
import { logout } from '../store/slices/authSlice';
import { createShareLink, getShareLinkUrl } from '../lib/share';
import { format } from 'date-fns';

export function DocumentsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { allDocuments, loadingAll } = useAppSelector((state) => state.document);
  const { isAdmin } = useAppSelector((state) => state.auth);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ docId: string; link: string; passcode: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    dispatch(loadAllDocuments());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleOpenDocument = (docId: string) => {
    navigate(`/editor/${docId}`);
  };

  const handleDeleteDocument = async (docId: string) => {
    await dispatch(deleteDocument(docId));
    setDeleteConfirm(null);
  };

  const handleDuplicateDocument = async (docId: string) => {
    await dispatch(duplicateDocument(docId));
  };

  const handleCreateShareLink = async (docId: string) => {
    const link = await createShareLink(docId);
    if (link) {
      setShareModal({
        docId,
        link: getShareLinkUrl(link.token),
        passcode: link.passcode,
      });
    }
  };

  const handleCopyLink = async () => {
    if (shareModal) {
      const fullText = `Link: ${shareModal.link}\nPasscode: ${shareModal.passcode}`;
      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getDomainInfo = (doc: Document): string => {
    if (!doc.domainId) return 'No domain';
    // Try to get domain info from localStorage
    try {
      const stored = localStorage.getItem(`domain_${doc.domainId}`);
      if (stored) {
        const domain = JSON.parse(stored);
        return `${domain.country} - ${domain.assetClass}`;
      }
    } catch {
      // Ignore
    }
    return 'Domain configured';
  };

  const getStatusBadge = (status: Document['status']) => {
    const styles = {
      draft: 'bg-amber-100 text-amber-700',
      review: 'bg-blue-100 text-blue-700',
      final: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
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
            <h1 className="text-lg font-medium text-slate-700">Documents</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/editor')}
              className="btn-primary btn-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Document
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="btn-ghost btn-sm"
              >
                Admin
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
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {loadingAll ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner w-8 h-8" />
          </div>
        ) : allDocuments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h2>
            <p className="text-slate-500 mb-4">Create your first document to get started</p>
            <button
              onClick={() => navigate('/editor')}
              className="btn-primary"
            >
              Create Document
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenDocument(doc.id)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline text-left"
                      >
                        {doc.title || 'Untitled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getDomainInfo(doc)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(doc.updatedAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Open"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCreateShareLink(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Share"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDuplicateDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete Document?</h2>
            <p className="text-slate-600 text-sm mb-4">
              This action cannot be undone. The document and all its snapshots will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteConfirm)}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share link modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Share Link Created</h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Link</label>
                <input
                  type="text"
                  value={shareModal.link}
                  readOnly
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Passcode</label>
                <input
                  type="text"
                  value={shareModal.passcode}
                  readOnly
                  className="input font-mono"
                />
              </div>
              <p className="text-xs text-slate-500">
                This link expires in 72 hours. Share the passcode separately for security.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShareModal(null)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={handleCopyLink}
                className="btn-primary"
              >
                {copySuccess ? 'Copied!' : 'Copy Link & Passcode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
