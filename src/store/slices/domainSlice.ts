import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface RegulatorySource {
  id: string;
  url: string;
  title: string;
  category: string;
  status: 'pending' | 'fetching' | 'indexed' | 'error';
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

      // In production, this would save to DynamoDB via API
      localStorage.setItem(`domain_${domain.id}`, JSON.stringify(domain));
      return domain;
    } catch (error) {
      return rejectWithValue('Failed to create domain');
    }
  }
);

export const prepareDomain = createAsyncThunk(
  'domain/prepare',
  async (domainId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { domain: DomainState };
      const domain = state.domain.currentDomain;

      if (!domain) {
        return rejectWithValue('No domain selected');
      }

      // Simulate preparation workflow with progress updates
      const logMessages = [
        `Starting domain preparation for ${domain.country}...`,
        `Validating selected categories: ${domain.selectedCategories.join(', ')}`,
        'Initializing source discovery agent...',
        'Searching Bing for regulatory sources...',
        'Extracting content from discovered URLs...',
        'Generating embeddings for source content...',
        'Building citations index...',
        'Domain preparation complete!',
      ];

      for (let i = 0; i < logMessages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate work
        const progress = Math.round(((i + 1) / logMessages.length) * 100);
        dispatch(updatePrepProgress({ progress, log: logMessages.slice(0, i + 1) }));
      }

      const updatedDomain: Domain = {
        ...domain,
        prepStatus: 'ready',
        prepProgress: 100,
        prepLog: logMessages,
        citationsIndexed: Math.floor(Math.random() * 15) + 10, // Simulated count
        lastPreparedAt: new Date().toISOString(),
      };

      // In production, this would update DynamoDB via API
      localStorage.setItem(`domain_${domain.id}`, JSON.stringify(updatedDomain));
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

export const { updatePrepProgress, clearDomain, abortPreparation } = domainSlice.actions;
export default domainSlice.reducer;


