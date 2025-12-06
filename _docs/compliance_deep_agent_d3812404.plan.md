---
name: Compliance Deep Agent
overview: Build a single-tenant AWS Amplify Gen 2 web application with a Lexical-based document editor, AI-powered compliance suggestions (OpenAI/OpenRouter), and full RAG integration for regulatory guidance.
todos:
  - id: phase-1-foundations
    content: Set up Amplify Gen 2 project, auth, DynamoDB tables, S3, Secrets Manager
    status: pending
  - id: phase-2-editor
    content: Build Lexical editor with autosave, snapshots, and revision history
    status: pending
  - id: phase-3-domain
    content: Implement domain chooser, source selection, and Step Functions workflow
    status: pending
  - id: phase-4-suggestions
    content: Create suggestion feed, signal controls, and approver POV presets
    status: pending
  - id: phase-5-ai
    content: Build AI provider abstraction, RAG pipeline, and inline redaction
    status: pending
  - id: phase-6-sharing
    content: Implement read-only links with passcode and retention policies
    status: pending
  - id: phase-7-admin
    content: Build admin console with caps and model override
    status: pending
  - id: phase-8-observability
    content: Configure CloudWatch dashboards and CloudTrail logging
    status: pending
  - id: phase-9-ux
    content: Add performance optimizations and accessibility features
    status: pending
---

# Regulatory & Compliance Deep Agent - Execution Plan

## Technology Choices

- **Infrastructure**: AWS Amplify Gen 2 (TypeScript)
- **AWS Region**: us-west-2 (Oregon)
- **Rich Text Editor**: Lexical (Meta's editor)
- **AI Provider**: Abstracted service supporting OpenAI + OpenRouter
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with corporate blue/gray palette
- **Package Manager**: npm
- **State Management**: Redux Toolkit
- **Testing**: Unit tests for critical functions (Vitest)
- **Country Data**: Comprehensive dataset from public source (countries-list or similar)
- **Agentic Framework**: LangChain (Python) for subagent orchestration
- **Web Search**: Bing Search API for source discovery
- **Content Extraction**: Jina Reader API (URL to clean markdown)
- **Embedding Storage**: DynamoDB with vector embeddings
- **Priority Jurisdictions**: USA + EU (EPA, SEC, GDPR portals, EU Commission)

---

## Phase 1: Foundations

### 1.1 Project Scaffolding

- Initialize Amplify Gen 2 project with React + TypeScript + Vite
- Configure `amplify/` folder structure for backend resources
- Set up Tailwind CSS with custom design tokens
- Create base layout with left editor panel + right domain panel

### 1.2 Authentication & Access Control

- Implement passcode-gated landing page (no Cognito user pools - single shared passcode)
- Create secondary admin code validation for admin console
- Store passcode/admin code in Secrets Manager via Amplify backend

### 1.3 Data Layer Setup

- Define DynamoDB tables in `amplify/data/resource.ts`:
- `Document` (content, status, timestamps, snapshotIds)
- `Snapshot` (documentId, content, createdAt)
- `Domain` (country, site, assetClass, sources, prepStatus)
- `Suggestion` (documentId, type, content, confidence, pinned, superseded)
- `ReadOnlyToken` (documentId, passcode, expiresAt)
- `AdminConfig` (passcode, adminCode, modelPrefs, caps)
- Configure S3 bucket for evidence attachments in `amplify/storage/resource.ts`
- Set up Secrets Manager for AI API keys

### 1.4 AppSync GraphQL API

- Define GraphQL schema in `amplify/data/resource.ts` using Amplify Data
- Implement resolvers for CRUD operations
- Add custom queries/mutations for suggestion generation and domain prep

---

## Phase 2: Document Editing Core

### 2.1 Lexical Editor Integration

- Install `@lexical/react` and dependencies
- Create `LexicalEditor` component with:
- Headings (H1-H6)
- Rich text (bold, italic, underline)
- Lists (ordered, unordered)
- Tables
- Inline citations with tooltip
- Page breaks
- Implement custom nodes for redaction markers

### 2.2 Autosave & Snapshots

- Debounced autosave (2-second delay after typing stops)
- Manual snapshot button with timestamp
- Rolling cap of 20 snapshots per document (auto-delete oldest)
- Snapshot restore functionality with confirmation modal

### 2.3 Revision History Panel

- Collapsible sidebar showing snapshot timeline
- Preview diff between snapshots
- One-click restore with undo option

---

## Phase 3: Domain Preparation Workflow

### 3.1 Domain Chooser Panel

- Multi-step wizard: Country -> Site -> Asset Class (optional)
- Country/site data from static JSON (expandable)
- Asset class dropdown with "Datacenter" as default
- Custom jurisdiction input field for unlisted locations

### 3.2 Source Selection

- Category checkboxes with minimum 2 required:
- Environmental regulations
- Data privacy (GDPR, HIPAA)
- Financial compliance (SOX, PCI-DSS)
- Safety & workforce
- Legal/contractual
- Visual nudges for recommended category pairs
- Exclusion of blogs/paywalled sources (enforced in backend)

### 3.3 Step Functions Workflow

- Define workflow in `amplify/functions/` for domain prep:

1. Validate domain selection
2. Fetch regulatory sources for jurisdiction
3. Build citations index
4. Update domain prep status

- Visible progress UI with abort/retry buttons
- EventBridge trigger for subagent refresh on domain change

---

## Phase 4: Suggestion Engine

### 4.1 Suggestion Feed Component

- Scrollable card feed on right panel
- Card types: Structured (checklist) + Narrative (prose)
- Visual indicators: confidence level, source badge
- Pin/unpin functionality with pinned cards at top
- Stale badge (yellow) after 10+ minutes without refresh
- Per-card refresh button

### 4.2 Signal Controls

- Horizontal control bar above feed:
- Formality slider (Casual - Formal)
- Risk appetite toggle (Conservative - Moderate - Aggressive)
- Compliance strictness (Lenient - Standard - Full, default: Full)
- Debounced re-generation on signal change

### 4.3 Approver POV Presets

- Dropdown to select perspective:
- Operational risk
- Regulatory compliance
- Financial impact
- Safety & workforce
- Environmental impact
- Legal/contractual
- Re-ranks suggestion feed based on POV relevance

---

## Phase 5: AI Integration

### 5.1 AI Provider Abstraction

- Create `amplify/functions/ai-service/` Lambda:
- `AIProvider` interface with `generateCompletion()` and `generateEmbedding()`
- `OpenAIProvider` implementation
- `OpenRouterProvider` implementation
- Config-driven provider selection from Secrets Manager

### 5.2 RAG Pipeline

- Create `amplify/functions/rag-retrieval/` Lambda:
- Embed document content using AI provider
- Query regulatory source embeddings (stored in DynamoDB/S3)
- Return top-k relevant citations with summaries
- Pre-seed regulatory sources for common jurisdictions

### 5.3 Suggestion Generation Lambda

- Create `amplify/functions/suggestion-generator/`:
- Accept document content + domain + signals
- Apply inline redaction (strip `[[REDACTED:...]]` markers)
- Call RAG retrieval for context
- Generate structured + narrative suggestions
- Store in DynamoDB with confidence scores

### 5.4 Inline Redaction

- Custom Lexical node for redaction markers
- Visual styling: gray background with lock icon
- Tooltip: "This content will not be sent to AI"
- Backend strips redacted content before AI calls

---

## Phase 6: Sharing & Retention

### 6.1 Read-Only Links

- Generate unique token with 72-hour TTL
- Passcode protection (separate from main passcode)
- Read-only view: editor disabled, suggestions visible
- Auto-expiry with CloudWatch scheduled rule

### 6.2 Retention Policies

- DynamoDB TTL on documents (3 days from last update)
- S3 lifecycle rule for attachments (3-day expiry)
- Immediate purge on explicit delete action
- Cascade delete for snapshots and suggestions

---

## Phase 7: Admin Console

### 7.1 Admin Panel UI

- Protected by secondary admin code
- Dashboard with active session count
- Passcode rotation with confirmation
- Active read-only links management

### 7.2 Caps & Model Override

- Configure max active sessions
- Configure max read-only links
- AI model selection dropdown (GPT-4o, GPT-4-turbo, Claude via OpenRouter)
- Save to AdminConfig in DynamoDB

---

## Phase 8: Observability & Governance

### 8.1 CloudWatch Integration

- Custom metrics: suggestion latency, API errors, active users
- Dashboard for operational monitoring
- Alarms for error rate spikes

### 8.2 CloudTrail Logging

- Enable for all API operations
- Log admin actions (passcode rotation, model changes)
- Retention aligned with compliance requirements

---

## Phase 9: Performance & UX

### 9.1 Performance Optimizations

- Lazy load suggestion feed
- Debounce editor changes (300ms)
- Optimistic UI updates for pin/unpin
- "Updating suggestions..." ticker during generation

### 9.2 Accessibility

- Keyboard navigation for all controls
- Font size controls (A- / A+)
- High contrast mode toggle
- Screen reader announcements for suggestion updates

---

## Key Files to Create

| Path | Purpose |
|------|---------|
| `amplify/data/resource.ts` | DynamoDB tables + GraphQL schema |
| `amplify/storage/resource.ts` | S3 bucket config |
| `amplify/functions/ai-service/` | AI provider abstraction |
| `amplify/functions/rag-retrieval/` | RAG pipeline |
| `amplify/functions/suggestion-generator/` | Suggestion generation |
| `amplify/functions/domain-prep/` | Step Functions workflow |
| `src/components/Editor/` | Lexical editor + custom nodes |
| `src/components/DomainPanel/` | Domain chooser + source selection |
| `src/components/SuggestionFeed/` | Cards + signal controls |
| `src/components/AdminConsole/` | Admin dashboard |
| `src/lib/ai/` | Client-side AI provider types |
| `src/lib/auth/` | Passcode validation |