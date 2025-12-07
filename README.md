# DraftWise - Regulatory Compliance Deep Agent

A cloud-native ideation application that assists planners, COOs, compliance officers, and auditors in drafting planning documents with continuous, domain-informed suggestions and compliance guidance.

## Features

### Rich Text Editor
- Google Docs-style editing with headings, lists, tables, and inline citations
- Autosave with debounced persistence
- Manual snapshot creation for version control
- Rolling cap of 20 snapshots per document

### Domain Configuration
- Guided domain chooser (Country -> Site/Region)
- Asset class selection (default: Datacenter)
- Source category selection for regulatory focus areas:
  - Environmental Regulations
  - Data Privacy
  - Financial Compliance
  - Safety & Workforce
  - Legal / Contractual

### AI-Powered Suggestions
- Continuous suggestion feed based on document content and domain
- Structured checklists and narrative guidance
- Signal controls for:
  - Formality (casual, moderate, formal)
  - Risk appetite (conservative, moderate, aggressive)
  - Compliance strictness (lenient, standard, full)
- Approver POV presets (Operational Risk, Regulatory Compliance, Financial Impact, etc.)
- Pin/unpin suggestions with stale badges and refresh options

### Domain Preparation
- Automated source discovery using Brave Search API
- Content extraction via Jina AI Reader
- RAG (Retrieval-Augmented Generation) for context-aware suggestions
- Progress tracking with abort/retry capability

### Sharing & Access
- Passcode-protected application access
- Admin console with secondary admin code
- Shareable read-only links with 72-hour auto-expiry
- Session management with configurable limits

## Architecture

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lexical** for rich text editing
- **Vite** for build tooling

### Backend (AWS Amplify Gen 2)
- **AWS AppSync** GraphQL API
- **Amazon DynamoDB** for data persistence
- **AWS Lambda** functions:
  - `ai-service` - OpenAI/OpenRouter integration
  - `suggestion-generator` - AI suggestion generation
  - `rag-retrieval` - Vector similarity search
  - `domain-prep` - Domain preparation orchestration
  - `source-discovery` - Brave Search + Jina extraction
  - `share-link` - Read-only link management
  - `retention-cleanup` - Automated data retention

### Data Models
- **Document** - Planning documents with content and metadata
- **Snapshot** - Document revision history
- **Domain** - Jurisdiction and source configuration
- **RegulatorySource** - Indexed sources for RAG
- **Suggestion** - AI-generated compliance suggestions
- **ReadOnlyToken** - Shareable link tokens
- **AdminConfig** - Application configuration
- **ActiveSession** - Session tracking

## Getting Started

### Prerequisites
- Node.js 18+
- AWS Account with Amplify access
- AWS CLI configured with appropriate profile

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd draftwise-domain-agent

# Install dependencies
npm install
```

### Environment Variables

Create environment variables for local development:

```bash
# Frontend (Vite)
VITE_LOCAL_PASSCODE=your-passcode
VITE_LOCAL_ADMIN_CODE=your-admin-code
```

### AWS Secrets (via Parameter Store)

The following secrets must be configured in AWS Systems Manager Parameter Store:

- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `OPENROUTER_API_KEY` - OpenRouter API key (optional, for model routing)
- `BRAVE_API_KEY` - Brave Search API key for source discovery
- `JINA_API_KEY` - Jina AI Reader API key for content extraction

### Development

```bash
# Start Amplify sandbox (deploys backend)
npx ampx sandbox

# In another terminal, start the dev server
npm run dev
```

### Production Deployment

```bash
# Deploy via Amplify Hosting
# Connect your repository to AWS Amplify Console
# See DEPLOYMENT.md for detailed instructions
```

## Project Structure

```
draftwise-domain-agent/
├── amplify/
│   ├── backend.ts          # Backend definition
│   ├── data/
│   │   └── resource.ts     # GraphQL schema
│   └── functions/          # Lambda functions
│       ├── ai-service/
│       ├── domain-prep/
│       ├── rag-retrieval/
│       ├── retention-cleanup/
│       ├── share-link/
│       ├── source-discovery/
│       └── suggestion-generator/
├── src/
│   ├── components/
│   │   ├── Editor/         # Lexical editor components
│   │   ├── Layout/         # Header, navigation
│   │   ├── Modals/         # Modal dialogs
│   │   └── RightPanel/     # Domain, suggestions, history panels
│   ├── data/               # Static data (countries)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities (share links)
│   ├── pages/              # Route pages
│   └── store/              # Redux store and slices
├── amplify.yml             # Amplify build configuration
├── package.json
└── vite.config.ts
```

## Usage

1. **Login** - Enter the application passcode on the landing page
2. **Create Document** - Click "New Document" and enter a title
3. **Configure Domain** - Select country, region, and compliance categories
4. **Prepare Domain** - Click "Prepare Domain" to index regulatory sources
5. **Write Content** - Use the rich text editor to draft your document
6. **Review Suggestions** - Switch to the Suggestions tab for AI guidance
7. **Share** - Create read-only links for stakeholders

## License

Proprietary - All rights reserved

