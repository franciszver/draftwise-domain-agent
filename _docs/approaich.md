# Approach Document (approuach.md)

This document outlines the recommended order of agent actions and feature development for the **Regulatory & Compliance Deep Agent Web Application**. The goal is to build features in a logical sequence that ensures stability, usability, and compliance.

---

## 1. Foundations
- **Amplify App Setup**: Deploy React SPA with passcode gating.
- **Authentication & Access Control**: Implement shared passcode and admin code.
- **AppSync Schema Design**: Define GraphQL schema for documents, domains, suggestions, snapshots, and sharing.
- **DynamoDB & S3 Setup**: Provision storage for documents, snapshots, evidence attachments, and exports.
- **Secrets Manager**: Store AI keys and admin codes securely.

---

## 2. Document Editing Core
- **Rich Text Editor**: Implement headings, lists, tables, inline citations.
- **Autosave & Snapshots**: Debounced autosave and manual snapshot button with rolling cap.
- **Revision Management**: Snapshot history with restore capability.

---

## 3. Domain Preparation Workflow
- **Domain Chooser Panel**: Country → Site hierarchy with optional asset class.
- **Source Selection**: Require minimum two categories; exclude blogs/paywalled standards.
- **Step Functions Workflow**: Visible progress steps with abort/retry.
- **EventBridge Integration**: Trigger subagent refresh on new document creation or domain changes.

---

## 4. Suggestion Engine
- **Suggestion Feed**: Continuous, debounced feed of structured/narrative cards.
- **Pin/Unpin & Refresh**: Allow users to manage suggestions.
- **Signal Controls**: Toggles for formality, risk appetite, compliance strictness.
- **Approver POV Presets**: Operational risk, regulatory compliance, financial impact, safety/workforce, environmental impact, legal/contractual.

---

## 5. AI Integration
- **Lambda Functions**: Suggestion generation, RAG retrieval, export link creation.
- **OpenAI/OpenRouter Integration**: Drafting and embeddings.
- **Inline Redaction**: Ensure proprietary information is not sent to AI.
- **Dynamic Model Selection**: Admin override for AI model choice.

---

## 6. Sharing & Retention
- **Read-Only Links**: Passcode-protected, auto-expiring after 72 hours.
- **Retention Policies**: 3-day retention for docs, suggestions, attachments; immediate purge on delete.

---

## 7. Admin Console
- **Passcode Rotation**: Secondary admin code to rotate shared passcode.
- **Caps Management**: Control active sessions and link caps.
- **Model Override**: Select AI models dynamically.

---

## 8. Observability & Governance
- **CloudWatch Dashboards**: Monitor performance and latency.
- **CloudTrail Logs**: Track governance and audit trails.
- **Error Handling**: Visible status updates and retry options.

---

## 9. Performance & UX Guarantees
- **Responsive Typing**: Ensure minimal latency in editor.
- **Suggestion Latency**: Best-practice routing with visible ticker.
- **Accessibility**: Keyboard-first workflows, font size controls.

---

## Recommended Build Order
1. Foundations (Amplify, AppSync, DynamoDB, S3, Secrets Manager)  
2. Document Editing Core (Editor, Autosave, Snapshots)  
3. Domain Preparation Workflow (Chooser, Source Selection, Step Functions)  
4. Suggestion Engine (Feed, Signal Controls, Approver POV)  
5. AI Integration (Lambda, OpenAI/OpenRouter, Redaction)  
6. Sharing & Retention (Read-only links, purge policies)  
7. Admin Console (Rotation, Caps, Model Override)  
8. Observability & Governance (CloudWatch, CloudTrail)  
9. Performance & UX Enhancements (Accessibility, latency improvements)  

---

This approach ensures that foundational infrastructure is solid before layering in advanced features like AI-driven suggestions, sharing, and governance.
