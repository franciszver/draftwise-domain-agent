# Super Prompt: Build the Regulatory & Compliance Deep Agent Web Application

You are tasked with generating the **complete implementation plan and starter codebase** for the **Regulatory & Compliance Deep Agent Web Application**. This project must be delivered as a one-shot output that includes architecture, infrastructure setup, core features, and integration details.

---

## Context

The application is a **single-tenant, cloud-native ideation tool** designed to help planners, COOs, compliance officers, and auditors draft planning documents with continuous, domain-informed suggestions and compliance guidance. It leverages **AWS Amplify**, **AWS managed services**, and **AI-driven retrieval-augmented generation (RAG)** to provide real-time, summarized feedback based on public regulatory and compliance information.

---

## Product Requirements (PRD Highlights)

- **Rich Text Editor**: Google Docs-style editing with autosave, snapshots, inline citations, tables, lists.
- **Domain Chooser Panel**: Guided workflow (Country → Site → Asset Class).
- **Source Selection**: Minimum two public regulatory/compliance categories; exclude blogs/paywalled standards.
- **Suggestion Feed**: Continuous, debounced feed of structured/narrative cards; pin/unpin, refresh, stale badges.
- **Signal Controls**: Toggles for formality, risk appetite, compliance strictness.
- **Approver POV Presets**: Operational risk, regulatory compliance, financial impact, safety/workforce, environmental impact, legal/contractual.
- **Inline Redaction**: Proprietary info masked before AI calls.
- **Sharing**: Passcode-protected read-only links, auto-expiring after 72 hours.
- **Retention**: 3-day retention for docs, suggestions, attachments; immediate purge on delete.
- **Admin Console**: Rotate passcodes, manage caps, override AI model selection.

---

## Approach (Build Order)

1. **Foundations**: Amplify app, AppSync schema, DynamoDB, S3, Secrets Manager.  
2. **Document Editing Core**: Rich text editor, autosave, snapshots.  
3. **Domain Preparation Workflow**: Chooser, source selection, Step Functions, EventBridge triggers.  
4. **Suggestion Engine**: Feed, signal controls, POV presets.  
5. **AI Integration**: Lambda, OpenAI/OpenRouter, inline redaction, dynamic model routing.  
6. **Sharing & Retention**: Read-only links, purge policies.  
7. **Admin Console**: Passcode rotation, caps, model override.  
8. **Observability & Governance**: CloudWatch, CloudTrail.  
9. **Performance & UX Enhancements**: Accessibility, latency improvements.  

---

## Architecture (System Components)

- **Frontend**: React SPA hosted on AWS Amplify.  
- **Backend**: AWS AppSync (GraphQL API), AWS Lambda, AWS Step Functions, Amazon EventBridge.  
- **Data Layer**: DynamoDB (documents, snapshots, feed state), S3 (attachments, exports), Secrets Manager (keys, admin codes).  
- **AI Layer**: OpenAI/OpenRouter for drafting + embeddings (RAG).  
- **Observability**: CloudWatch, CloudTrail.  
- **Security**: KMS encryption, inline redaction, passcode + admin code.  

---

## Resources

- **AI Solutions**: OpenAI/OpenRouter, RAG with public regulatory sources.  
- **AWS Services**: Amplify, AppSync, Lambda, Step Functions, EventBridge, DynamoDB, S3, Secrets Manager, CloudWatch, CloudTrail, KMS.  
- **Frontend Tools**: React SPA, GraphQL schema design.  
- **Compliance Sources**: Public government/regulatory bodies (GDPR, HIPAA, SOX, PCI-DSS, environmental/safety regulations).  
- **Exclusions**: Blogs, paywalled standards.  

---

## Workflow Diagram (Mermaid)

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (Amplify React SPA)
    participant API as AppSync GraphQL API
    participant Lambda as AWS Lambda
    participant StepFn as AWS Step Functions
    participant EventBridge as Amazon EventBridge
    participant DynamoDB as Amazon DynamoDB
    participant S3 as Amazon S3
    participant Secrets as AWS Secrets Manager
    participant AI as OpenAI/OpenRouter
    participant Sharing as Sharing & Retention
    participant Observability as CloudWatch/CloudTrail

    User->>Frontend: Edit Document / Choose Domain / Adjust Signals
    Frontend->>API: Submit edits, domain, signals
    API->>Lambda: Process request
    Lambda->>DynamoDB: Store document/snapshots
    Lambda->>S3: Store attachments/exports
    Lambda->>AI: Generate suggestions (RAG + drafting)
    AI-->>Lambda: Return suggestions
    Lambda-->>Frontend: Update Suggestion Feed

    Frontend->>API: Domain prep request
    API->>StepFn: Trigger workflow
    StepFn->>Lambda: Execute domain prep
    EventBridge->>Lambda: Refresh subagent

    Frontend->>AdminConsole: Admin actions (rotate passcode, override model)
    AdminConsole->>API: Send admin commands
    API->>Secrets: Update keys/admin codes
    API->>Lambda: Apply model override

    Lambda->>Sharing: Generate read-only link (72h expiry)
    Sharing-->>User: Share link
    DynamoDB->>Sharing: Enforce 3-day retention
    S3->>Sharing: Enforce 3-day retention

    Backend->>Observability: Log metrics/events
    Observability-->>AdminConsole: Provide dashboards/logs
Deliverables
Generate the following in one shot:

Infrastructure Setup: Terraform/CDK/Amplify configuration for AWS services.

Frontend Code: React components for editor, domain panel, signal controls, suggestion feed, admin console.

Backend Code: AppSync schema, Lambda handlers, Step Functions workflows, EventBridge triggers.

Data Models: DynamoDB tables, S3 foldering, Secrets Manager keys.

AI Integration: Lambda → OpenAI/OpenRouter calls with inline redaction.

Sharing & Retention: Logic for passcode-protected links, 72h expiry, 3-day purge.

Observability: CloudWatch dashboards, CloudTrail logging.

Documentation: README.md with setup instructions, PRD.md, approach.md, architecture.md, resources.md..

Output Format
Provide code snippets for frontend (React), backend (Lambda, AppSync schema), and infrastructure (Terraform/CDK/Amplify).

Include clear instructions for deployment and configuration.

Ensure security best practices (KMS encryption, least privilege IAM).

Organize output into sections: Infrastructure → Frontend → Backend → AI → Sharing → Observability → Docs.

Goal
Deliver a ready-to-deploy starter codebase and infrastructure plan that embodies the PRD, approach, architecture, and resources in a single comprehensive output.

Code

---

⚡ This super prompt now includes the **Mermaid sequence diagram** so the LLM has both textual and visual guidance.  
