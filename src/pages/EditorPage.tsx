import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createDocument, loadDocument, loadSnapshots, updateContent, setDomainId } from '../store/slices/documentSlice';
import { createDomain, prepareDomain } from '../store/slices/domainSlice';
import { setRightPanelTab } from '../store/slices/uiSlice';
import { Header } from '../components/Layout/Header';
import { EditorPanel } from '../components/Editor/EditorPanel';
import { RightPanel } from '../components/RightPanel/RightPanel';
import { NewDocumentModal } from '../components/Modals/NewDocumentModal';

export function EditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  const { currentDocument, loading } = useAppSelector((state) => state.document);
  const { rightPanelOpen } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (documentId) {
      // Only load if it's a different document than what's currently loaded
      // This prevents reloading when we just created the document
      if (!currentDocument || currentDocument.id !== documentId) {
        dispatch(loadDocument(documentId));
      }
      // Always load snapshots for the current document
      dispatch(loadSnapshots(documentId));
    } else if (!currentDocument && !loading) {
      // No document ID and no current document - show new document modal
      // Only show if not loading to prevent flashing
      setShowNewDocModal(true);
    }
  }, [documentId, dispatch, currentDocument, loading]);

  const handleCreateDocument = useCallback(
    async (
      title: string,
      domain: { country: string; site: string; assetClass: string; categories: string[] },
      templateContent: string | null
    ) => {
      // Create the document
      const docResult = await dispatch(createDocument(title));
      if (!createDocument.fulfilled.match(docResult)) {
        setShowNewDocModal(false);
        return;
      }

      const documentId = docResult.payload.id;

      // If template content is provided, set it
      if (templateContent) {
        dispatch(updateContent(templateContent));
      }

      // Create and prepare the domain
      const domainResult = await dispatch(
        createDomain({
          country: domain.country,
          site: domain.site || undefined,
          assetClass: domain.assetClass,
          categories: domain.categories,
        })
      );

      if (createDomain.fulfilled.match(domainResult)) {
        dispatch(setDomainId(domainResult.payload.id));
        // Start domain preparation in background
        dispatch(prepareDomain(domainResult.payload.id));
      }

      navigate(`/editor/${documentId}`);
      // Show domain tab first so user can see preparation progress
      dispatch(setRightPanelTab('domain'));
      setShowNewDocModal(false);
    },
    [dispatch, navigate]
  );

  // Only show loading screen if we're loading AND don't have a current document
  // This prevents freezing when we already have the document loaded
  if (loading && !currentDocument) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 text-primary-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onNewDocument={() => setShowNewDocModal(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Main editor area */}
        <div
          className={`flex-1 transition-all duration-300 ${rightPanelOpen ? 'mr-0' : ''
            }`}
        >
          <EditorPanel />
        </div>

        {/* Right panel */}
        {rightPanelOpen && (
          <div className="w-96 border-l border-slate-200 bg-white flex-shrink-0">
            <RightPanel />
          </div>
        )}
      </div>

      {/* New document modal */}
      {showNewDocModal && (
        <NewDocumentModal
          onClose={() => {
            setShowNewDocModal(false);
            if (!currentDocument) {
              navigate('/');
            }
          }}
          onCreate={handleCreateDocument}
        />
      )}
    </div>
  );
}


