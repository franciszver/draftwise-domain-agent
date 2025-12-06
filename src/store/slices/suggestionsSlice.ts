import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Suggestion {
  id: string;
  documentId: string;
  type: 'structured' | 'narrative';
  title: string;
  content: string;
  sourceRefs: string[];
  confidence: number;
  pinned: boolean;
  superseded: boolean;
  createdAt: string;
  refreshedAt: string | null;
}

export interface SignalValues {
  formality: 'casual' | 'moderate' | 'formal';
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  complianceStrictness: 'lenient' | 'standard' | 'full';
}

export type ApproverPOV =
  | 'operational_risk'
  | 'regulatory_compliance'
  | 'financial_impact'
  | 'safety_workforce'
  | 'environmental_impact'
  | 'legal_contractual'
  | null;

interface SuggestionsState {
  suggestions: Suggestion[];
  signals: SignalValues;
  approverPov: ApproverPOV;
  isGenerating: boolean;
  lastGeneratedAt: string | null;
  error: string | null;
}

const initialState: SuggestionsState = {
  suggestions: [],
  signals: {
    formality: 'moderate',
    riskAppetite: 'moderate',
    complianceStrictness: 'full',
  },
  approverPov: null,
  isGenerating: false,
  lastGeneratedAt: null,
  error: null,
};

export const generateSuggestions = createAsyncThunk(
  'suggestions/generate',
  async (
    { documentId, content, domainId }: { documentId: string; content: string; domainId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { suggestions: SuggestionsState };
      const { signals, approverPov } = state.suggestions;

      // Simulate AI suggestion generation
      // In production, this would call the Lambda function
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockSuggestions: Suggestion[] = [
        {
          id: uuidv4(),
          documentId,
          type: 'structured',
          title: 'Environmental Compliance Checklist',
          content: `Based on your document content and selected regulatory domain:

- [ ] Conduct Environmental Impact Assessment (EIA)
- [ ] Obtain necessary environmental permits
- [ ] Establish emissions monitoring protocols
- [ ] Implement waste management procedures
- [ ] Document compliance with local environmental regulations`,
          sourceRefs: ['https://www.epa.gov/laws-regulations'],
          confidence: 0.92,
          pinned: false,
          superseded: false,
          createdAt: new Date().toISOString(),
          refreshedAt: null,
        },
        {
          id: uuidv4(),
          documentId,
          type: 'narrative',
          title: 'Data Center Power Requirements',
          content: `For a 5GW datacenter project, regulatory considerations should include:

Grid connection agreements typically require coordination with local utility providers and may need approval from energy regulatory bodies. Consider backup power requirements and fuel storage regulations.

Environmental regulations for power generation may apply if on-site generation is planned. Emissions permits and monitoring systems should be factored into the planning timeline.`,
          sourceRefs: [],
          confidence: 0.85,
          pinned: false,
          superseded: false,
          createdAt: new Date().toISOString(),
          refreshedAt: null,
        },
        {
          id: uuidv4(),
          documentId,
          type: 'structured',
          title: 'Data Privacy Requirements',
          content: `Key data privacy considerations for datacenter operations:

- [ ] Implement data classification system
- [ ] Establish data retention policies
- [ ] Configure access controls and audit logging
- [ ] Plan for data subject rights requests
- [ ] Document cross-border data transfer mechanisms`,
          sourceRefs: ['https://gdpr.eu/'],
          confidence: 0.88,
          pinned: false,
          superseded: false,
          createdAt: new Date().toISOString(),
          refreshedAt: null,
        },
      ];

      return mockSuggestions;
    } catch (error) {
      return rejectWithValue('Failed to generate suggestions');
    }
  }
);

export const refreshSuggestion = createAsyncThunk(
  'suggestions/refresh',
  async (suggestionId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { suggestions: SuggestionsState };
      const existing = state.suggestions.suggestions.find((s) => s.id === suggestionId);

      if (!existing) {
        return rejectWithValue('Suggestion not found');
      }

      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshed: Suggestion = {
        ...existing,
        refreshedAt: new Date().toISOString(),
        content: existing.content + '\n\n[Updated with latest regulatory information]',
      };

      return refreshed;
    } catch (error) {
      return rejectWithValue('Failed to refresh suggestion');
    }
  }
);

const suggestionsSlice = createSlice({
  name: 'suggestions',
  initialState,
  reducers: {
    setSignals: (state, action: PayloadAction<Partial<SignalValues>>) => {
      state.signals = { ...state.signals, ...action.payload };
    },
    setApproverPov: (state, action: PayloadAction<ApproverPOV>) => {
      state.approverPov = action.payload;
    },
    togglePin: (state, action: PayloadAction<string>) => {
      const suggestion = state.suggestions.find((s) => s.id === action.payload);
      if (suggestion) {
        suggestion.pinned = !suggestion.pinned;
      }
    },
    supersedeSuggestion: (state, action: PayloadAction<string>) => {
      const suggestion = state.suggestions.find((s) => s.id === action.payload);
      if (suggestion) {
        suggestion.superseded = true;
      }
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.lastGeneratedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate suggestions
      .addCase(generateSuggestions.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateSuggestions.fulfilled, (state, action: PayloadAction<Suggestion[]>) => {
        state.isGenerating = false;
        // Mark old suggestions as superseded
        state.suggestions.forEach((s) => {
          s.superseded = true;
        });
        // Add new suggestions
        state.suggestions = [...action.payload, ...state.suggestions.filter((s) => s.pinned)];
        state.lastGeneratedAt = new Date().toISOString();
      })
      .addCase(generateSuggestions.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })
      // Refresh suggestion
      .addCase(refreshSuggestion.fulfilled, (state, action: PayloadAction<Suggestion>) => {
        const index = state.suggestions.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.suggestions[index] = action.payload;
        }
      });
  },
});

export const {
  setSignals,
  setApproverPov,
  togglePin,
  supersedeSuggestion,
  clearSuggestions,
} = suggestionsSlice.actions;

export default suggestionsSlice.reducer;


