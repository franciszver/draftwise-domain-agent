# Regulatory & Compliance Deep Agent Web Application PRD

## Product Requirements Document (PRD)

### 1. Overview
The Regulatory & Compliance Deep Agent is a single-tenant, cloud-native ideation application designed to assist planners, COOs, compliance officers, and auditors in drafting planning documents with continuous, domain-informed suggestions and compliance guidance. The application leverages AWS Amplify, AWS managed services, and AI-driven retrieval-augmented generation (RAG) to provide real-time, summarized feedback based on public regulatory and compliance information relevant to the user-defined domain.

### 2. Goals
- Enable planners and COOs to draft comprehensive planning documents with live, domain-aware guidance.  
- Provide continuous, structured and narrative suggestions based on up-to-date regulatory and compliance sources.  
- Simplify compliance planning for projects such as Pacifico's off-grid 5GW datacenter.  
- Deliver a simple, intuitive interface with autosave, revision management, and shareable read-only links.  
- Ensure privacy and security with inline redaction and controlled access.  

### 3. Target Users
- Planners  
- Chief Operating Officers (COOs)  
- Compliance Officers  
- Auditors  

### 4. Key Features
- **Left-side rich text editor**: Google Docs-style editing with headings, lists, tables, inline citations, autosave, and revision snapshots.  
- **Right-side domain panel**: Guided domain chooser (Country → Site) with optional asset class selection (default: Datacenter).  
- **Source selection**: Minimum two public regulatory/compliance categories; excludes blogs and paywalled standards.  
- **Domain preparation**: Visible progress steps with abort/retry; asynchronous subagent refresh on new document creation or domain changes.  
- **Continuous suggestions**: Debounced feed of structured/narrative cards; pinned cards remain at top with stale badges and refresh option.  
- **Signal controls**: Toggles for formality, risk appetite, and compliance strictness (default strictness = full).  
- **Approver suggestions**: Multiple POV presets (Operational risk, Regulatory compliance, Financial impact, Safety & workforce, Environmental impact, Legal/contractual).  
- **Inline redaction**: Visible markers for proprietary information not sent to AI; hover tooltips explain redactions.  
- **Shareable read-only links**: Passcode-protected, auto-expiring after 72 hours.  
- **Admin console**: Secondary admin code to rotate passcode, manage caps, and override AI model selection.  

### 5. Functional Requirements
- Rich text editor: headings, bold/italic/underline, lists, tables, links, inline citations, page breaks.  
- Autosave and snapshots: debounced autosave + manual snapshot button; rolling cap of 20 snapshots per document.  
- Domain guided chooser: Country → Site hierarchy with optional asset class; custom jurisdiction/source input allowed.  
- Source selection: Minimum two categories required; UI nudges for recommended pairs.  
- Domain prep workflow: Progress steps with visible status; abort discards partial data and resets clean.  
- Suggestion feed: Single scrolling feed with card morphing, pin/unpin, stale badges, per-card refresh.  
- Signal controls: Formality, risk appetite, compliance strictness toggles.  
- Approver POV: Multiple presets with re-ranking of suggestions.  
- RAG sources: Public government/regulatory bodies only.  
- AI integration: OpenAI/OpenRouter with dynamic model selection and admin override.  
- Privacy: Inline redaction markers; minimal logging.  
- Sharing: Passcode-protected read-only links with 72-hour auto-expiry.  
- Retention: 3-day retention for docs, suggestions, attachments; immediate purge on delete.  

### 6. Non-Functional Requirements
- Performance: Responsive editor; visible “Updating suggestions…” ticker.  
- Security: Encryption with KMS; Secrets Manager for keys; least privilege access.  
- Scalability: Single-tenant deployment with caps on active sessions and links.  
- Accessibility: Keyboard-first workflows; font size controls.  

### 7. Architecture
**Frontend and Access**  
- AWS Amplify hosting a React SPA with left editor and right panel.  
- Landing page with shared passcode; admin console protected by secondary admin code.  

**APIs and Orchestration**  
- AWS AppSync GraphQL API for documents, snapshots, domains, suggestions, approvals POV, and read-only links.  
- AWS Lambda for suggestion generation, RAG retrieval, template assembly, and export link creation.  
- AWS Step Functions for domain prep and multi-step suggestion flows.  
- Amazon EventBridge to trigger subagent refresh on document creation or domain changes.  

**Data and Storage**  
- Amazon DynamoDB for documents, snapshots, feed state, domains, source selections, and read-only tokens.  
- Amazon S3 for evidence attachments and exports with foldering.  
- AWS Secrets Manager for AI keys and admin codes.  
- Amazon CloudWatch and CloudTrail for monitoring and governance.  

**AI Providers**  
- OpenAI/OpenRouter for drafting and embeddings; public sources only; paywalled standards flagged for human research.  

### 8. Data Model
- **Domain**: Country, site, optional asset class, selected source categories, prep status, citations index.  
- **Document**: Content, status, autosave timestamps, snapshot list, read-only link state.  
- **Suggestion**: Type, source summary, confidence, pinned state, superseded flag, POV ranking.  
- **Template**: AI-generated title, sections, placeholders, domain mapping.  
- **Evidence**: File/link references, associated section, preview metadata.  
- **Admin**: Passcode, admin code, model preferences, caps, retention settings.  

### 9. Security, Governance, and Retention
- Single shared passcode with secondary admin code.  
- Encryption via KMS; Secrets Manager for keys.  
- Inline redaction markers for privacy.  
- 3-day retention with configurable purge; immediate delete.  

### 10. Performance and UX Guarantees
- Responsive typing with slight suggestion delays.  
- Best-practice latency routing.  
- User controls for refreshing stale cards.  

### 11. MVP Build Plan
- Foundations: Amplify app, passcode gating, AppSync schema, DynamoDB, S3, Secrets Manager.  
- Domain prep: Guided chooser, source selection, prep workflow, subagent refresh.  
- Editor + suggestions: Rich text editor, autosave, snapshots, suggestion feed, signal controls.  
- AI integration: RAG + drafting, inline redaction, dynamic model routing.  
- Sharing and retention: Read-only links, retention policies.  
- Observability: CloudWatch and CloudTrail.  

---

This PRD outlines a single-tenant, AWS Amplify-powered ideation machine that helps planners and COOs draft compliant planning documents with continuous AI-driven guidance based on public regulatory knowledge.
