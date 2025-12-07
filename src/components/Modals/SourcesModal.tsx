import { useState, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeSource, addSource, type RegulatorySource } from '../../store/slices/domainSlice';
import * as api from '../../lib/api';

interface SourcesModalProps {
  onClose: () => void;
}

const ACCEPTED_FILE_TYPES = ['.pdf', '.txt', '.docx', '.doc'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function SourcesModal({ onClose }: SourcesModalProps) {
  const dispatch = useAppDispatch();
  const { sources, categories, currentDomain } = useAppSelector((state) => state.domain);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleRemoveSource = (sourceId: string) => {
    dispatch(removeSource(sourceId));
  };

  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'user_uploaded') return 'User Uploaded';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = useCallback(async (file: File) => {
    if (!currentDomain) {
      setUploadError('No domain selected');
      return;
    }

    // Validate file type
    const fileType = getFileType(file.name);
    if (!ACCEPTED_FILE_TYPES.some(type => file.name.toLowerCase().endsWith(type))) {
      setUploadError(`Unsupported file type. Accepted: ${ACCEPTED_FILE_TYPES.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const base64Content = await fileToBase64(file);

      const response = await api.uploadDocument({
        domainId: currentDomain.id,
        fileName: file.name,
        fileType,
        fileContent: base64Content,
      });

      if (response.success && response.source) {
        // Add the source to the domain
        dispatch(addSource({
          id: response.source.id,
          url: response.source.url,
          title: response.source.title,
          category: response.source.category,
          status: 'indexed',
        }));
        setUploadSuccess(`"${response.source.title}" added successfully`);
        setTimeout(() => setUploadSuccess(null), 3000);
      } else {
        setUploadError(response.error || 'Failed to process document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  }, [currentDomain, dispatch]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  // Group sources by category
  const groupedSources = sources.reduce<Record<string, RegulatorySource[]>>((acc, source) => {
    const category = source.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(source);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Indexed Sources</h2>
              <p className="text-sm text-slate-500 mt-1">
                {sources.length} source{sources.length !== 1 ? 's' : ''} indexed for suggestions
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Upload section */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="spinner w-5 h-5" />
                  <span className="text-slate-600">Processing document...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-slate-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-slate-600 mb-1">
                    Drop a file here or click to upload
                  </p>
                  <p className="text-xs text-slate-400">
                    PDF, TXT, DOC, DOCX (max 10MB)
                  </p>
                </>
              )}
            </div>

            {uploadError && (
              <div className="mt-2 p-2 bg-danger-50 text-danger-700 text-sm rounded">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-2 p-2 bg-success-50 text-success-700 text-sm rounded">
                {uploadSuccess}
              </div>
            )}
          </div>

          {sources.length === 0 ? (
            <div className="text-center py-8">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-slate-500">No sources indexed yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSources).map(([category, categorySources]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    {getCategoryName(category)}
                  </h3>
                  <div className="space-y-2">
                    {categorySources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 text-sm truncate">
                              {source.title}
                            </p>
                            {source.jurisdictionLevel && (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${source.jurisdictionLevel === 'federal'
                                  ? 'bg-blue-100 text-blue-700'
                                  : source.jurisdictionLevel === 'state'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                  }`}
                              >
                                {source.jurisdictionLevel === 'federal' ? 'Federal' :
                                  source.jurisdictionLevel === 'state' ? 'State' : 'Local'}
                              </span>
                            )}
                          </div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline truncate block"
                          >
                            {source.url}
                          </a>
                        </div>
                        <button
                          onClick={() => handleRemoveSource(source.id)}
                          className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove source"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Removing a source will exclude it from future suggestions
            </p>
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
