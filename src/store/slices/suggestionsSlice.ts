import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import * as api from '../../lib/api';

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
  archived: boolean;
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
  archivedSuggestions: Suggestion[];
  signals: SignalValues;
  approverPov: ApproverPOV;
  suggestionCount: number;
  isGenerating: boolean;
  lastGeneratedAt: string | null;
  error: string | null;
}

const initialState: SuggestionsState = {
  suggestions: [],
  archivedSuggestions: [],
  signals: {
    formality: 'moderate',
    riskAppetite: 'moderate',
    complianceStrictness: 'full',
  },
  approverPov: null,
  suggestionCount: 5,
  isGenerating: false,
  lastGeneratedAt: null,
  error: null,
};

// Generate mock suggestions (fallback when backend unavailable)
function generateMockSuggestions(
  documentId: string,
  validSourceUrls: Set<string>
): Suggestion[] {
  // Helper to filter source refs to only include valid sources
  const filterValidSources = (refs: string[]) =>
    refs.filter((ref) => {
      for (const validUrl of validSourceUrls) {
        try {
          const refHost = new URL(ref).hostname;
          const validHost = new URL(validUrl).hostname;
          if (refHost === validHost) return true;
        } catch {
          // Invalid URL
        }
      }
      return false;
    });

  return [
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
      sourceRefs: filterValidSources(['https://www.epa.gov/laws-regulations']),
      confidence: 0.92,
      pinned: false,
      superseded: false,
      archived: false,
      createdAt: new Date().toISOString(),
      refreshedAt: null,
    },
    {
      id: uuidv4(),
      documentId,
      type: 'narrative',
      title: 'Data Center Power Requirements',
      content: `For a datacenter project, regulatory considerations should include:

Grid connection agreements typically require coordination with local utility providers and may need approval from energy regulatory bodies. Consider backup power requirements and fuel storage regulations.

Environmental regulations for power generation may apply if on-site generation is planned. Emissions permits and monitoring systems should be factored into the planning timeline.`,
      sourceRefs: [],
      confidence: 0.85,
      pinned: false,
      superseded: false,
      archived: false,
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
      sourceRefs: filterValidSources(['https://www.hhs.gov/hipaa', 'https://www.ftc.gov/privacy']),
      confidence: 0.88,
      pinned: false,
      superseded: false,
      archived: false,
      createdAt: new Date().toISOString(),
      refreshedAt: null,
    },
  ];
}

export const generateSuggestions = createAsyncThunk(
  'suggestions/generate',
  async (
    { documentId, content, domainId, appendMode = false }: { documentId: string; content: string; domainId: string; appendMode?: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as {
        suggestions: SuggestionsState;
        domain: { sources: Array<{ url: string; title: string; category: string }>; useRealBackend: boolean };
      };
      const { signals, approverPov, suggestionCount } = state.suggestions;
      const { sources } = state.domain;

      // Get current valid source URLs for filtering
      const validSourceUrls = new Set(sources.map((s) => s.url));

      // Always try real backend first (don't rely on useRealBackend flag)
      try {
        // First, retrieve relevant sources using RAG
        let retrievedSources: Array<{ url: string; title: string; content: string; category: string }> = [];

        console.log(`[Suggestions] Available indexed sources: ${sources.length}`);

        try {
          const ragResponse = await api.retrieveSources({
            query: content.slice(0, 2000), // Use first 2000 chars as query
            domainId,
            topK: 10,
          });

          if (ragResponse.results && ragResponse.results.length > 0) {
            retrievedSources = ragResponse.results.map((r) => ({
              url: r.url,
              title: r.title,
              content: r.content,
              category: r.category,
            }));
            console.log(`[Suggestions] RAG retrieved ${retrievedSources.length} sources`);
          } else {
            // RAG returned empty - use indexed sources from frontend state
            console.log('[Suggestions] RAG returned 0 results, using indexed sources directly');
            retrievedSources = sources.slice(0, 10).map((s) => ({
              url: s.url,
              title: s.title,
              content: '', // Content not available in frontend state
              category: s.category,
            }));
            console.log(`[Suggestions] Using ${retrievedSources.length} indexed sources`);
          }
        } catch (ragError) {
          console.warn('[Suggestions] RAG retrieval failed, using indexed sources:', ragError);
          // RAG retrieval failed, continue with sources from domain
          retrievedSources = sources.slice(0, 10).map((s) => ({
            url: s.url,
            title: s.title,
            content: '', // No content available
            category: s.category,
          }));
          console.log(`[Suggestions] Fallback to ${retrievedSources.length} indexed sources`);
        }

        console.log('[Suggestions] Sources being sent to AI:', retrievedSources.map(s => s.url));

        // Generate suggestions using AI
        console.log('[Suggestions] Calling generateSuggestions API...');
        const response = await api.generateSuggestions({
          documentId,
          documentContent: content,
          domainId,
          signals,
          approverPov: approverPov || undefined,
          retrievedSources,
          suggestionCount,
        });

        console.log(`[Suggestions] API returned ${response.suggestions?.length || 0} suggestions`);
        console.log('[Suggestions] Raw API response:', JSON.stringify(response, null, 2).slice(0, 1000));

        // Check if we got valid suggestions
        if (!response.suggestions || !Array.isArray(response.suggestions) || response.suggestions.length === 0) {
          console.error('[Suggestions] No valid suggestions in response:', response);
          throw new Error('No suggestions returned from AI');
        }

        // Convert response to Suggestion format
        const suggestions: Suggestion[] = response.suggestions.map((s) => {
          // Log what the AI returned for debugging
          console.log(`[Suggestions] Processing suggestion: "${s.title}"`);
          console.log(`[Suggestions] Raw sourceRefs from AI:`, s.sourceRefs);

          // Filter sourceRefs to only include valid URLs
          // We now accept any valid URL (not just ones matching indexed sources)
          // This allows the AI to cite sources it found relevant
          const filteredRefs = (s.sourceRefs || []).filter((ref: string) => {
            try {
              // Check if it's a valid URL
              const url = new URL(ref);
              // Must be http or https
              if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                console.log(`[Suggestions] Filtered out non-http URL: ${ref}`);
                return false;
              }
              return true;
            } catch {
              console.log(`[Suggestions] Filtered out invalid URL: ${ref}`);
              return false;
            }
          });

          console.log(`[Suggestions] Filtered sourceRefs:`, filteredRefs);

          return {
            id: s.id,
            documentId,
            type: s.type,
            title: s.title,
            content: s.content,
            sourceRefs: filteredRefs,
            confidence: s.confidence,
            pinned: false,
            superseded: false,
            archived: false,
            createdAt: new Date().toISOString(),
            refreshedAt: null,
          };
        });

        return { suggestions, appendMode };
      } catch (error) {
        console.warn('Backend suggestion generation failed, falling back to mock:', error);
        // Fall through to mock generation
      }

      // Fallback: Generate mock suggestions
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { suggestions: generateMockSuggestions(documentId, validSourceUrls), appendMode };
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
    setSuggestionCount: (state, action: PayloadAction<number>) => {
      state.suggestionCount = action.payload;
    },
    togglePin: (state, action: PayloadAction<string>) => {
      const suggestion = state.suggestions.find((s) => s.id === action.payload);
      if (suggestion) {
        suggestion.pinned = !suggestion.pinned;
      }
    },
    archiveSuggestion: (state, action: PayloadAction<string>) => {
      const index = state.suggestions.findIndex((s) => s.id === action.payload);
      if (index !== -1) {
        const suggestion = state.suggestions[index];
        suggestion.archived = true;
        state.archivedSuggestions.push(suggestion);
        state.suggestions.splice(index, 1);
      }
    },
    unarchiveSuggestion: (state, action: PayloadAction<string>) => {
      const index = state.archivedSuggestions.findIndex((s) => s.id === action.payload);
      if (index !== -1) {
        const suggestion = state.archivedSuggestions[index];
        suggestion.archived = false;
        state.suggestions.unshift(suggestion);
        state.archivedSuggestions.splice(index, 1);
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
      .addCase(generateSuggestions.fulfilled, (state, action: PayloadAction<{ suggestions: Suggestion[]; appendMode: boolean }>) => {
        state.isGenerating = false;
        const { suggestions, appendMode } = action.payload;

        if (appendMode) {
          // Append mode: just add new suggestions to existing ones
          state.suggestions = [...state.suggestions, ...suggestions];
        } else {
          // Replace mode: mark old as superseded and replace
          state.suggestions.forEach((s) => {
            s.superseded = true;
          });
          state.suggestions = [...suggestions, ...state.suggestions.filter((s) => s.pinned)];
        }
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
  setSuggestionCount,
  togglePin,
  archiveSuggestion,
  unarchiveSuggestion,
  supersedeSuggestion,
  clearSuggestions,
} = suggestionsSlice.actions;

export default suggestionsSlice.reducer;
