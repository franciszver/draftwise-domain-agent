import { useState, useCallback } from 'react';
import { countries, getRegionsForCountry } from '../../data/countries';
import { getTemplateForAsset } from '../../data/templates';

type Step = 'title' | 'country' | 'site' | 'asset' | 'categories';

interface DomainConfig {
  country: string;
  site: string;
  assetClass: string;
  categories: string[];
}

interface NewDocumentModalProps {
  onClose: () => void;
  onCreate: (title: string, domain: DomainConfig, templateContent: string | null) => void;
}

const categoryOptions = [
  {
    id: 'environmental',
    name: 'Environmental Regulations',
    description: 'EPA, emissions, waste management, environmental impact',
  },
  {
    id: 'data_privacy',
    name: 'Data Privacy',
    description: 'GDPR, HIPAA, data protection, privacy laws',
  },
  {
    id: 'financial',
    name: 'Financial Compliance',
    description: 'SOX, PCI-DSS, financial reporting, audit',
  },
  {
    id: 'safety_workforce',
    name: 'Safety & Workforce',
    description: 'OSHA, workplace safety, labor laws',
  },
  {
    id: 'legal_contractual',
    name: 'Legal / Contractual',
    description: 'Contract law, licensing, permits, liability',
  },
];

export function NewDocumentModal({ onClose, onCreate }: NewDocumentModalProps) {
  const [step, setStep] = useState<Step>('title');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Domain configuration
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('Datacenter');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [useTemplate, setUseTemplate] = useState(true);
  const [countrySearch, setCountrySearch] = useState('');

  const regions = selectedCountry ? getRegionsForCountry(selectedCountry) : [];
  const template = getTemplateForAsset(selectedAsset);

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setSelectedSite('');
    setStep('site');
  };

  const handleSiteSelect = (site: string) => {
    setSelectedSite(site);
    setStep('asset');
  };

  const handleSkipSite = () => {
    setStep('asset');
  };

  const handleAssetContinue = () => {
    setStep('categories');
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBack = () => {
    switch (step) {
      case 'country':
        setStep('title');
        break;
      case 'site':
        setStep('country');
        break;
      case 'asset':
        setStep('site');
        break;
      case 'categories':
        setStep('asset');
        break;
    }
  };

  const handleSubmit = useCallback(async () => {
    if (selectedCategories.length < 2) return;

    setLoading(true);
    const domainConfig: DomainConfig = {
      country: selectedCountry,
      site: selectedSite,
      assetClass: selectedAsset,
      categories: selectedCategories,
    };

    const templateContent = useTemplate && template ? template.content : null;
    onCreate(title.trim(), domainConfig, templateContent);
  }, [title, selectedCountry, selectedSite, selectedAsset, selectedCategories, useTemplate, template, onCreate]);

  const getStepNumber = () => {
    switch (step) {
      case 'title': return 1;
      case 'country': return 2;
      case 'site': return 3;
      case 'asset': return 4;
      case 'categories': return 5;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">New Document</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${num < getStepNumber()
                      ? 'bg-primary-600 text-white'
                      : num === getStepNumber()
                        ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {num < getStepNumber() ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    num
                  )}
                </div>
                {num < 5 && <div className={`w-8 h-0.5 ${num < getStepNumber() ? 'bg-primary-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Title */}
          {step === 'title' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="docTitle" className="label">Document Title</label>
                <input
                  id="docTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., Pacifico Datacenter Compliance Plan"
                  autoFocus
                />
                <p className="mt-1 text-xs text-slate-500">
                  Give your planning document a descriptive name
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep('country')}
                  disabled={!title.trim()}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Country */}
          {step === 'country' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Select Country</label>
                  <button onClick={handleBack} className="text-sm text-primary-600 hover:underline">
                    Back
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search countries..."
                  className="input mb-3"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  autoFocus
                />
                <div className="max-h-64 overflow-auto space-y-1 border border-slate-200 rounded-lg">
                  {countries
                    .filter((c) =>
                      c.name.toLowerCase().includes(countrySearch.toLowerCase())
                    )
                    .map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleCountrySelect(country.name)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                      >
                        {country.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Site */}
          {step === 'site' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Select Site (Optional)</label>
                  <button onClick={handleBack} className="text-sm text-primary-600 hover:underline">
                    Back
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  Selected: <strong>{selectedCountry}</strong>
                </p>
                {regions.length > 0 ? (
                  <div className="max-h-48 overflow-auto space-y-1 border border-slate-200 rounded-lg mb-3">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => handleSiteSelect(region)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mb-3">No specific regions available</p>
                )}
                <button onClick={handleSkipSite} className="btn-secondary w-full">
                  Skip - Use Country Level
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Asset Class */}
          {step === 'asset' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Asset Class</label>
                  <button onClick={handleBack} className="text-sm text-primary-600 hover:underline">
                    Back
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {selectedCountry}{selectedSite && ` - ${selectedSite}`}
                </p>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="input mb-4"
                >
                  <option value="Datacenter">Datacenter</option>
                  <option value="Manufacturing">Manufacturing Facility</option>
                  <option value="Warehouse">Warehouse / Logistics</option>
                  <option value="Office">Office Building</option>
                  <option value="Retail">Retail / Commercial</option>
                  <option value="Energy">Energy / Power Plant</option>
                  <option value="Other">Other</option>
                </select>

                {/* Template option */}
                {template && (
                  <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:border-primary-300">
                    <input
                      type="checkbox"
                      checked={useTemplate}
                      onChange={(e) => setUseTemplate(e.target.checked)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        Pre-populate with template
                      </p>
                      <p className="text-xs text-slate-500">
                        Start with a {template.name.toLowerCase()} including all recommended sections
                      </p>
                    </div>
                  </label>
                )}

                {selectedAsset === 'Other' && (
                  <p className="text-xs text-slate-500 mt-2">
                    No template available for custom asset types
                  </p>
                )}

                <button onClick={handleAssetContinue} className="btn-primary w-full mt-4">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Categories */}
          {step === 'categories' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Select Categories</label>
                  <button onClick={handleBack} className="text-sm text-primary-600 hover:underline">
                    Back
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  Select at least 2 regulatory categories to focus on
                </p>
                <div className="space-y-2 mb-4">
                  {categoryOptions.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCategories.includes(category.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{category.name}</p>
                        <p className="text-xs text-slate-500">{category.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedCategories.length < 2 && (
                  <p className="text-xs text-warning-600 mb-4">
                    Please select at least 2 categories
                  </p>
                )}

                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Summary</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li><strong>Title:</strong> {title}</li>
                    <li><strong>Jurisdiction:</strong> {selectedCountry}{selectedSite && ` - ${selectedSite}`}</li>
                    <li><strong>Asset Class:</strong> {selectedAsset}</li>
                    <li><strong>Template:</strong> {useTemplate && template ? 'Yes' : 'No'}</li>
                  </ul>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || selectedCategories.length < 2}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <span className="spinner mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Document'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
