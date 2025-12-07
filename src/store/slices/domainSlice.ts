import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import * as api from '../../lib/api';

export interface RegulatorySource {
  id: string;
  url: string;
  title: string;
  category: string;
  status: 'pending' | 'fetching' | 'indexed' | 'error';
  jurisdictionLevel?: 'federal' | 'state' | 'local'; // Tag for source level
}

export interface Domain {
  id: string;
  country: string;
  site: string | null;
  assetClass: string;
  selectedCategories: string[];
  prepStatus: 'pending' | 'preparing' | 'ready' | 'error';
  prepProgress: number;
  prepLog: string[];
  citationsIndexed: number;
  lastPreparedAt: string | null;
  createdAt: string;
}

export interface SourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface DomainState {
  currentDomain: Domain | null;
  sources: RegulatorySource[];
  categories: SourceCategory[];
  loading: boolean;
  preparing: boolean;
  error: string | null;
  sourcesVersion: number; // Increments when sources change, triggers suggestion refresh
  useRealBackend: boolean; // Whether to use real Lambda functions
}

const initialCategories: SourceCategory[] = [
  {
    id: 'environmental',
    name: 'Environmental Regulations',
    description: 'EPA, emissions, waste management, environmental impact',
    icon: 'leaf',
  },
  {
    id: 'data_privacy',
    name: 'Data Privacy',
    description: 'GDPR, HIPAA, data protection, privacy laws',
    icon: 'shield',
  },
  {
    id: 'financial',
    name: 'Financial Compliance',
    description: 'SOX, PCI-DSS, financial reporting, audit',
    icon: 'dollar',
  },
  {
    id: 'safety_workforce',
    name: 'Safety & Workforce',
    description: 'OSHA, workplace safety, labor laws',
    icon: 'hard-hat',
  },
  {
    id: 'legal_contractual',
    name: 'Legal / Contractual',
    description: 'Contract law, licensing, permits, liability',
    icon: 'scale',
  },
];

const initialState: DomainState = {
  currentDomain: null,
  sources: [],
  categories: initialCategories,
  loading: false,
  preparing: false,
  error: null,
  sourcesVersion: 0,
  useRealBackend: false,
};

export const createDomain = createAsyncThunk(
  'domain/create',
  async (
    { country, site, assetClass, categories }: { country: string; site?: string; assetClass: string; categories: string[] },
    { rejectWithValue }
  ) => {
    try {
      const domain: Domain = {
        id: uuidv4(),
        country,
        site: site || null,
        assetClass,
        selectedCategories: categories,
        prepStatus: 'pending',
        prepProgress: 0,
        prepLog: [],
        citationsIndexed: 0,
        lastPreparedAt: null,
        createdAt: new Date().toISOString(),
      };

      // Try to save to backend, fall back to localStorage
      try {
        await api.saveDomain({
          id: domain.id,
          country: domain.country,
          site: domain.site || undefined,
          assetClass: domain.assetClass,
          selectedCategories: domain.selectedCategories,
          prepStatus: domain.prepStatus,
          prepProgress: domain.prepProgress,
          citationsIndexed: domain.citationsIndexed,
        });
      } catch {
        // Fall back to localStorage
        localStorage.setItem(`domain_${domain.id}`, JSON.stringify(domain));
      }

      return domain;
    } catch (error) {
      return rejectWithValue('Failed to create domain');
    }
  }
);

// Generate mock sources based on domain configuration (fallback when backend unavailable)
function generateMockSources(domain: Domain): RegulatorySource[] {
  const categorySourceMap: Record<string, { urls: string[]; titles: string[] }> = {
    environmental: {
      urls: [
        'https://www.epa.gov/regulatory-information',
        'https://www.epa.gov/air-emissions',
        'https://www.epa.gov/water-regulations',
      ],
      titles: [
        'EPA Regulatory Information',
        'Air Emissions Standards',
        'Water Quality Regulations',
      ],
    },
    data_privacy: {
      urls: [
        'https://www.hhs.gov/hipaa',
        'https://www.ftc.gov/privacy',
      ],
      titles: [
        'HIPAA Privacy Rules',
        'FTC Privacy Framework',
      ],
    },
    financial: {
      urls: [
        'https://www.sec.gov/sox-compliance',
        'https://www.pcisecuritystandards.org',
        'https://www.finra.org/rules-guidance',
      ],
      titles: [
        'SOX Compliance Requirements',
        'PCI-DSS Standards',
        'FINRA Regulatory Guidance',
      ],
    },
    safety_workforce: {
      urls: [
        'https://www.osha.gov/laws-regs',
        'https://www.dol.gov/agencies/whd',
        'https://www.osha.gov/workplace-safety',
      ],
      titles: [
        'OSHA Laws and Regulations',
        'Wage and Hour Division',
        'Workplace Safety Standards',
      ],
    },
    legal_contractual: {
      urls: [
        'https://www.law.cornell.edu/ucc',
        'https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant',
        'https://www.usa.gov/business-licenses-permits',
      ],
      titles: [
        'Uniform Commercial Code',
        'Business Legal Compliance',
        'Licenses and Permits',
      ],
    },
  };

  const sources: RegulatorySource[] = [];
  let id = 1;

  domain.selectedCategories.forEach((category) => {
    const sourceData = categorySourceMap[category];
    if (sourceData) {
      sourceData.urls.forEach((url, index) => {
        sources.push({
          id: `source-${id++}`,
          url,
          title: sourceData.titles[index],
          category,
          status: 'indexed',
        });
      });
    }
  });

  // Add jurisdiction-specific sources
  sources.push({
    id: `source-${id++}`,
    url: `https://www.${domain.country.toLowerCase().replace(/\s/g, '')}.gov/regulations`,
    title: `${domain.country} Government Regulations`,
    category: 'general',
    status: 'indexed',
  });

  if (domain.site) {
    sources.push({
      id: `source-${id++}`,
      url: `https://www.${domain.site.toLowerCase().replace(/\s/g, '')}.gov/local-codes`,
      title: `${domain.site} Local Building Codes`,
      category: 'general',
      status: 'indexed',
    });
  }

  return sources;
}

export const prepareDomain = createAsyncThunk(
  'domain/prepare',
  async (_domainId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { domain: DomainState };
      const domain = state.domain.currentDomain;

      if (!domain) {
        return rejectWithValue('No domain selected');
      }

      const logMessages: string[] = [];
      const addLog = (msg: string) => {
        logMessages.push(msg);
        dispatch(updatePrepProgress({ progress: Math.min(logMessages.length * 10, 90), log: [...logMessages] }));
      };

      addLog(`Starting domain preparation for ${domain.country}...`);
      addLog(`Asset class: ${domain.assetClass}`);
      addLog(`Categories: ${domain.selectedCategories.join(', ')}`);

      let allSources: RegulatorySource[] = [];
      const seenUrls = new Set<string>(); // Track URLs to remove duplicates
      let useBackend = false;

      // Build jurisdiction string including site/state if available
      const jurisdictionStr = domain.site
        ? `${domain.country} ${domain.site}`
        : domain.country;

      // Try to use real backend
      try {
        addLog('Connecting to source discovery service...');

        // Get maxSources from admin config (localStorage) or default to 20
        let maxSourcesPerCategory = 20;
        try {
          const adminConfig = localStorage.getItem('adminConfig');
          if (adminConfig) {
            const parsed = JSON.parse(adminConfig);
            maxSourcesPerCategory = parsed.maxSourcesPerCategory || 20;
          }
        } catch {
          // Use default
        }

        // Discover sources for each category with retry logic
        for (const category of domain.selectedCategories) {
          addLog(`Searching for ${category} sources...`);

          // Include site/state in the search query for more specific results
          const searchQuery = domain.site
            ? `${domain.assetClass} ${category} regulations ${domain.site} ${domain.country}`
            : `${domain.assetClass} ${category} regulations ${domain.country}`;

          console.log(`[Discovery] Query: ${searchQuery}`);

          // Try discovery with one retry on failure
          let response = null;
          let retryCount = 0;
          const maxRetries = 1;

          while (response === null && retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                addLog(`Retrying ${category} search (attempt ${retryCount + 1})...`);
                console.log(`[Discovery] Retry ${retryCount} for ${category}`);
                // Brief delay before retry
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }

              response = await api.discoverSources({
                domainId: domain.id,
                query: searchQuery,
                jurisdiction: jurisdictionStr,
                category,
                maxSources: maxSourcesPerCategory,
              });
            } catch (categoryError) {
              console.error(`[Discovery] Error for ${category} (attempt ${retryCount + 1}):`, categoryError);
              retryCount++;
              if (retryCount > maxRetries) {
                addLog(`Failed to discover ${category} sources after ${maxRetries + 1} attempts`);
              }
            }
          }

          // Skip this category if discovery failed after retries
          if (!response) {
            console.log(`[Discovery] Skipping ${category} - all attempts failed`);
            continue;
          }

          addLog(`Found ${response.indexed} sources for ${category}`);

          // Convert to RegulatorySource format, filtering duplicates
          let newCount = 0;
          const categorySources: RegulatorySource[] = [];

          for (const s of response.sources) {
            // Normalize URL for deduplication (remove trailing slashes, fragments)
            const normalizedUrl = s.url.replace(/\/$/, '').split('#')[0];

            if (!seenUrls.has(normalizedUrl)) {
              seenUrls.add(normalizedUrl);
              const source: RegulatorySource = {
                id: `${category}-${categorySources.length}`,
                url: s.url,
                title: s.title,
                category,
                status: 'indexed' as const,
                jurisdictionLevel: s.jurisdictionLevel || 'federal', // Preserve jurisdiction level
              };
              categorySources.push(source);
              newCount++;

              // Log each source as it's found with jurisdiction level
              const levelTag = s.jurisdictionLevel === 'state' ? '[State]' : '[Federal]';
              console.log(`[Discovery] ${levelTag} Source found: "${s.title}" - ${s.url}`);
            } else {
              console.log(`[Discovery] Duplicate skipped: ${s.url}`);
            }
          }

          allSources = [...allSources, ...categorySources];
          console.log(`[Discovery] Added ${newCount} unique sources for ${category} (${response.indexed - newCount} duplicates removed)`);

          // Save unique sources to backend (categorySources already filtered)
          for (const source of categorySources) {
            const originalSource = response.sources.find(s => s.url === source.url);
            if (originalSource) {
              try {
                await api.createRegulatorySource({
                  domainId: domain.id,
                  url: originalSource.url,
                  title: originalSource.title,
                  content: originalSource.content,
                  category,
                  jurisdiction: jurisdictionStr,
                  status: 'indexed',
                });
              } catch {
                // Continue on individual source save failure
              }
            }
          }
        }

        // Check if we got any sources from the backend
        if (allSources.length > 0) {
          useBackend = true;
          addLog(`Total unique sources indexed: ${allSources.length}`);
        } else {
          // No sources found from backend, fall back to mock
          throw new Error('No sources discovered from backend');
        }
      } catch (error) {
        // Fall back to mock sources if backend failed or returned no sources
        console.log('[Discovery] Falling back to mock sources:', error);
        addLog('Backend unavailable or returned no sources, using curated sources...');
        await new Promise((resolve) => setTimeout(resolve, 500));

        addLog('Loading curated regulatory sources...');
        await new Promise((resolve) => setTimeout(resolve, 500));

        allSources = generateMockSources(domain);
        addLog(`Loaded ${allSources.length} curated sources`);
      }

      addLog('Building citations index...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      addLog('Domain preparation complete!');
      dispatch(setSources(allSources));

      const updatedDomain: Domain = {
        ...domain,
        prepStatus: 'ready',
        prepProgress: 100,
        prepLog: logMessages,
        citationsIndexed: allSources.length,
        lastPreparedAt: new Date().toISOString(),
      };

      // Save to backend or localStorage
      try {
        await api.saveDomain({
          id: updatedDomain.id,
          country: updatedDomain.country,
          site: updatedDomain.site || undefined,
          assetClass: updatedDomain.assetClass,
          selectedCategories: updatedDomain.selectedCategories,
          prepStatus: updatedDomain.prepStatus,
          prepProgress: updatedDomain.prepProgress,
          citationsIndexed: updatedDomain.citationsIndexed,
        });
      } catch {
        localStorage.setItem(`domain_${domain.id}`, JSON.stringify(updatedDomain));
        localStorage.setItem(`sources_${domain.id}`, JSON.stringify(allSources));
      }

      // Update useRealBackend flag
      dispatch(setUseRealBackend(useBackend));

      return updatedDomain;
    } catch (error) {
      return rejectWithValue('Domain preparation failed');
    }
  }
);

export const loadDomain = createAsyncThunk(
  'domain/load',
  async (domainId: string, { rejectWithValue }) => {
    try {
      // In production, this would load from DynamoDB via API
      const stored = localStorage.getItem(`domain_${domainId}`);
      if (stored) {
        return JSON.parse(stored) as Domain;
      }
      return rejectWithValue('Domain not found');
    } catch (error) {
      return rejectWithValue('Failed to load domain');
    }
  }
);

const domainSlice = createSlice({
  name: 'domain',
  initialState,
  reducers: {
    updatePrepProgress: (
      state,
      action: PayloadAction<{ progress: number; log: string[] }>
    ) => {
      if (state.currentDomain) {
        state.currentDomain.prepProgress = action.payload.progress;
        state.currentDomain.prepLog = action.payload.log;
        state.currentDomain.prepStatus = action.payload.progress < 100 ? 'preparing' : 'ready';
      }
    },
    setSources: (state, action: PayloadAction<RegulatorySource[]>) => {
      state.sources = action.payload;
    },
    removeSource: (state, action: PayloadAction<string>) => {
      state.sources = state.sources.filter((s) => s.id !== action.payload);
      state.sourcesVersion += 1; // Trigger suggestion refresh
      if (state.currentDomain) {
        state.currentDomain.citationsIndexed = state.sources.length;
        // Update localStorage
        localStorage.setItem(`sources_${state.currentDomain.id}`, JSON.stringify(state.sources));
        localStorage.setItem(`domain_${state.currentDomain.id}`, JSON.stringify(state.currentDomain));
      }
    },
    addSource: (state, action: PayloadAction<RegulatorySource>) => {
      state.sources.push(action.payload);
      state.sourcesVersion += 1; // Trigger suggestion refresh
      if (state.currentDomain) {
        state.currentDomain.citationsIndexed = state.sources.length;
        // Update localStorage
        localStorage.setItem(`sources_${state.currentDomain.id}`, JSON.stringify(state.sources));
        localStorage.setItem(`domain_${state.currentDomain.id}`, JSON.stringify(state.currentDomain));
      }
    },
    clearDomain: (state) => {
      state.currentDomain = null;
      state.sources = [];
    },
    abortPreparation: (state) => {
      if (state.currentDomain) {
        state.currentDomain.prepStatus = 'pending';
        state.currentDomain.prepProgress = 0;
        state.currentDomain.prepLog = [];
      }
      state.preparing = false;
    },
    setUseRealBackend: (state, action: PayloadAction<boolean>) => {
      state.useRealBackend = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create domain
      .addCase(createDomain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDomain.fulfilled, (state, action: PayloadAction<Domain>) => {
        state.loading = false;
        state.currentDomain = action.payload;
      })
      .addCase(createDomain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Prepare domain
      .addCase(prepareDomain.pending, (state) => {
        state.preparing = true;
        state.error = null;
        if (state.currentDomain) {
          state.currentDomain.prepStatus = 'preparing';
        }
      })
      .addCase(prepareDomain.fulfilled, (state, action: PayloadAction<Domain>) => {
        state.preparing = false;
        state.currentDomain = action.payload;
      })
      .addCase(prepareDomain.rejected, (state, action) => {
        state.preparing = false;
        state.error = action.payload as string;
        if (state.currentDomain) {
          state.currentDomain.prepStatus = 'error';
        }
      })
      // Load domain
      .addCase(loadDomain.fulfilled, (state, action: PayloadAction<Domain>) => {
        state.currentDomain = action.payload;
      });
  },
});

export const { updatePrepProgress, setSources, removeSource, addSource, clearDomain, abortPreparation, setUseRealBackend } = domainSlice.actions;
export default domainSlice.reducer;
