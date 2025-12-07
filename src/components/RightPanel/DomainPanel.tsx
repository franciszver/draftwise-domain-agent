import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createDomain, prepareDomain, abortPreparation, type Domain } from '../../store/slices/domainSlice';
import { setDomainId } from '../../store/slices/documentSlice';
import { setRightPanelTab } from '../../store/slices/uiSlice';
import { countries, getRegionsForCountry } from '../../data/countries';
import { SourcesModal } from '../Modals/SourcesModal';

type Step = 'country' | 'site' | 'asset' | 'categories' | 'preparing' | 'ready';

// Helper to determine step based on domain state
function getStepFromDomain(domain: Domain | null): Step {
  if (!domain) return 'country';
  if (domain.prepStatus === 'ready') return 'ready';
  if (domain.prepStatus === 'preparing') return 'preparing';
  return 'country';
}

export function DomainPanel() {
  const dispatch = useAppDispatch();
  const { currentDomain, categories, preparing, sources } = useAppSelector((state) => state.domain);
  const { currentDocument } = useAppSelector((state) => state.document);

  const [step, setStep] = useState<Step>(() => getStepFromDomain(currentDomain));

  // Sync step with domain prepStatus changes
  useEffect(() => {
    if (currentDomain) {
      if (currentDomain.prepStatus === 'ready' && step === 'preparing') {
        setStep('ready');
        dispatch(setRightPanelTab('suggestions'));
      } else if (currentDomain.prepStatus === 'preparing' && step !== 'preparing') {
        setStep('preparing');
      }
    }
  }, [currentDomain?.prepStatus, step, dispatch]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('Datacenter');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customJurisdiction, setCustomJurisdiction] = useState('');
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  const regions = selectedCountry ? getRegionsForCountry(selectedCountry) : [];

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setSelectedSite('');
    setStep('site');
  };

  const handleSiteSelect = (site: string) => {
    setSelectedSite(site);
    setStep('asset');
  };

  const handleAssetSelect = () => {
    setStep('categories');
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleStartPreparation = useCallback(async () => {
    if (selectedCategories.length < 2) return;

    const result = await dispatch(
      createDomain({
        country: selectedCountry,
        site: selectedSite || undefined,
        assetClass: selectedAsset,
        categories: selectedCategories,
      })
    );

    if (createDomain.fulfilled.match(result)) {
      if (currentDocument) {
        dispatch(setDomainId(result.payload.id));
      }
      setStep('preparing');
      await dispatch(prepareDomain(result.payload.id));
      setStep('ready');
      dispatch(setRightPanelTab('suggestions'));
    }
  }, [dispatch, selectedCountry, selectedSite, selectedAsset, selectedCategories, currentDocument]);

  const handleAbort = () => {
    dispatch(abortPreparation());
    setStep('categories');
  };

  const handleReset = () => {
    setStep('country');
    setSelectedCountry('');
    setSelectedSite('');
    setSelectedAsset('Datacenter');
    setSelectedCategories([]);
  };

  // Render current step
  if (step === 'ready' && currentDomain) {
    const sourceCount = sources.length || currentDomain.citationsIndexed;

    return (
      <div className="h-full overflow-auto p-4">
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-success-600 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Domain Ready</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {sourceCount} source{sourceCount !== 1 ? 's' : ''} indexed
              </p>
              <button
                onClick={() => setShowSourcesModal(true)}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                View Sources
              </button>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Jurisdiction</p>
              <p className="font-medium text-slate-900">
                {currentDomain.country}
                {currentDomain.site && ` - ${currentDomain.site}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Asset Class</p>
              <p className="font-medium text-slate-900">{currentDomain.assetClass}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Categories</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentDomain.selectedCategories.map((cat) => (
                  <span key={cat} className="badge-primary text-xs">
                    {categories.find((c) => c.id === cat)?.name || cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleReset} className="btn-secondary w-full">
            Change Domain
          </button>
        </div>

        {showSourcesModal && (
          <SourcesModal onClose={() => setShowSourcesModal(false)} />
        )}
      </div>
    );
  }

  if (step === 'preparing') {
    return (
      <div className="h-full overflow-auto p-4">
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="spinner w-8 h-8 text-primary-600 mx-auto mb-4" />
            <h3 className="font-medium text-slate-900 mb-2">Preparing Domain</h3>
            <p className="text-sm text-slate-500">
              Discovering and indexing regulatory sources...
            </p>
          </div>

          {currentDomain && (
            <>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Progress</span>
                  <span className="text-sm font-medium text-slate-900">
                    {currentDomain.prepProgress}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${currentDomain.prepProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 max-h-48 overflow-auto font-mono text-xs">
                {currentDomain.prepLog.map((log, i) => (
                  <div key={i} className="text-slate-300 mb-1">
                    <span className="text-slate-500">[{i + 1}]</span> {log}
                  </div>
                ))}
              </div>
            </>
          )}

          <button onClick={handleAbort} className="btn-secondary w-full">
            Abort
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <StepIndicator active={step === 'country'} complete={step !== 'country'} label="1" />
          <div className="flex-1 h-px bg-slate-200" />
          <StepIndicator active={step === 'site'} complete={['asset', 'categories'].includes(step)} label="2" />
          <div className="flex-1 h-px bg-slate-200" />
          <StepIndicator active={step === 'asset'} complete={step === 'categories'} label="3" />
          <div className="flex-1 h-px bg-slate-200" />
          <StepIndicator active={step === 'categories'} complete={false} label="4" />
        </div>

        {/* Step: Country */}
        {step === 'country' && (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900">Select Country</h3>
            <input
              type="text"
              placeholder="Search countries..."
              className="input"
              onChange={(e) => setCustomJurisdiction(e.target.value)}
            />
            <div className="max-h-64 overflow-auto space-y-1">
              {countries
                .filter((c) =>
                  c.name.toLowerCase().includes(customJurisdiction.toLowerCase())
                )
                .map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.name)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-sm"
                  >
                    {country.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Step: Site */}
        {step === 'site' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Select Site (Optional)</h3>
              <button onClick={() => setStep('country')} className="text-sm text-primary-600">
                Change country
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Selected: <strong>{selectedCountry}</strong>
            </p>
            <div className="max-h-48 overflow-auto space-y-1">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => handleSiteSelect(region)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-sm"
                >
                  {region}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('asset')} className="btn-secondary w-full">
              Skip - Use Country Level
            </button>
          </div>
        )}

        {/* Step: Asset Class */}
        {step === 'asset' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Asset Class</h3>
              <button onClick={() => setStep('site')} className="text-sm text-primary-600">
                Back
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {selectedCountry}
              {selectedSite && ` - ${selectedSite}`}
            </p>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="input"
            >
              <option value="Datacenter">Datacenter</option>
              <option value="Manufacturing">Manufacturing Facility</option>
              <option value="Warehouse">Warehouse / Logistics</option>
              <option value="Office">Office Building</option>
              <option value="Retail">Retail / Commercial</option>
              <option value="Energy">Energy / Power Plant</option>
              <option value="Other">Other</option>
            </select>
            <button onClick={handleAssetSelect} className="btn-primary w-full">
              Continue
            </button>
          </div>
        )}

        {/* Step: Categories */}
        {step === 'categories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Select Categories</h3>
              <button onClick={() => setStep('asset')} className="text-sm text-primary-600">
                Back
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Select at least 2 regulatory categories
            </p>
            <div className="space-y-2">
              {categories.map((category) => (
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
              <p className="text-xs text-warning-600">
                Please select at least 2 categories
              </p>
            )}
            <button
              onClick={handleStartPreparation}
              disabled={selectedCategories.length < 2 || preparing}
              className="btn-primary w-full"
            >
              {preparing ? (
                <>
                  <span className="spinner mr-2" />
                  Preparing...
                </>
              ) : (
                'Start Domain Preparation'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  active,
  complete,
  label,
}: {
  active: boolean;
  complete: boolean;
  label: string;
}) {
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${complete
        ? 'bg-primary-600 text-white'
        : active
          ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-600'
          : 'bg-slate-100 text-slate-400'
        }`}
    >
      {complete ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        label
      )}
    </div>
  );
}


