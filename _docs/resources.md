# Resources

This document lists the primary resources, services, and tools used in the **Regulatory & Compliance Deep Agent Web Application**.

---

## 1. AI Solutions
- **OpenAI / OpenRouter**
  - Drafting assistance
  - Embeddings for retrieval-augmented generation (RAG)
  - Dynamic model selection with admin override
- **Retrieval-Augmented Generation (RAG)**
  - Uses public regulatory and compliance sources
  - Excludes blogs and paywalled standards

---

## 2. AWS Services
### Frontend & Hosting
- **AWS Amplify**
  - Hosting React Single Page Application (SPA)
  - Provides authentication and deployment pipeline

### APIs & Orchestration
- **AWS AppSync (GraphQL API)**
  - Document, snapshot, domain, suggestion, and sharing endpoints
- **AWS Lambda**
  - Suggestion generation
  - RAG retrieval
  - Export link creation
- **AWS Step Functions**
  - Domain preparation workflow
  - Multi-step suggestion orchestration
- **Amazon EventBridge**
  - Triggers subagent refresh on document creation or domain changes

### Data & Storage
- **Amazon DynamoDB**
  - Stores documents, snapshots, feed state, domains, source selections, and read-only tokens
- **Amazon S3**
  - Stores evidence attachments and exports
- **AWS Secrets Manager**
  - Manages AI keys and admin codes

### Observability & Governance
- **Amazon CloudWatch**
  - Monitoring application performance
- **AWS CloudTrail**
  - Governance and audit logging

---

## 3. Security & Compliance
- **AWS Key Management Service (KMS)**
  - Encryption for data at rest and in transit
- **Inline Redaction**
  - Ensures proprietary information is not sent to AI
- **Passcode & Admin Code**
  - Shared passcode for user access
  - Secondary admin code for overrides and caps

---

## 4. Application Components
- **Rich Text Editor**
  - Headings, lists, tables, inline citations, autosave, snapshots
- **Domain Chooser Panel**
  - Country → Site hierarchy with optional asset class
- **Suggestion Feed**
  - Structured and narrative cards with pin/unpin and refresh
- **Signal Controls**
  - Toggles for formality, risk appetite, compliance strictness
- **Admin Console**
  - Rotate passcodes, manage caps, override AI model selection
- **Sharing**
  - Passcode-protected read-only links (72h expiry)
  - 3-day retention policy with auto-purge

---

## 5. External Sources
- **Public Government & Regulatory Bodies**
  - GDPR, HIPAA, SOX, PCI-DSS, environmental and safety regulations
- **Exclusions**
  - Blogs
  - Paywalled standards (flagged for human research)

---

## 6. Development & Observability Tools
- **React SPA** (frontend framework)
- **GraphQL schema design** (AppSync)
- **CloudWatch dashboards** for performance metrics
- **CloudTrail logs** for compliance and audit trails
