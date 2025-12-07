# DraftWise Demo Script

A step-by-step guide to demonstrate all key features of the DraftWise Domain Agent application.

---

## Pre-Demo Setup

1. Ensure the backend is running: `npm run amplify:sandbox`
2. Ensure the frontend is running: `npm run dev`
3. Open the application in your browser (typically http://localhost:5173)
4. Have a sample document file ready for upload demo (PDF, TXT, or DOCX)

---

## Demo Flow

### 1. Landing Page and Authentication

**Location:** `/`

**Talking Points:**
- "DraftWise is a compliance-focused drafting assistant for regulatory planning documents"
- "The application helps draft datacenter planning documents with AI-powered suggestions based on jurisdiction-specific regulations"

**Actions:**
1. Enter the demo passcode to authenticate
2. Click "Enter" to proceed

**Transition:** After login, you will be redirected to the Documents page

---

### 2. Documents Management

**Location:** `/documents`

**Talking Points:**
- "This is the central hub for managing all your documents"
- "You can see document titles, creation dates, associated domains, and status"

**Actions:**
1. Show the empty state (if no documents exist) or existing documents
2. Point out the action buttons: Open, Share, Duplicate, Delete
3. Click "New Document" to create a new document

---

### 3. New Document Creation Wizard

**Location:** New Document Modal

**Talking Points:**
- "Creating a new document is a guided multi-step process"
- "First, we configure the regulatory domain - the jurisdiction and asset class"

**Step 1: Domain Configuration**
1. Enter a document title (e.g., "Singapore Datacenter Expansion Plan")
2. Select a country from the dropdown (e.g., "Singapore")
3. Optionally enter a site/region
4. Select an asset class (e.g., "Datacenter")
5. Click "Next"

**Step 2: Source Categories**
1. Show the available compliance categories:
   - Environmental Regulations
   - Data Privacy
   - Financial Compliance
   - Safety & Workforce
   - Legal / Contractual
2. Select relevant categories for the demo
3. Click "Next"

**Step 3: Template Prepopulation (Optional)**
1. "You can optionally start with a pre-built template for your asset class"
2. Check the "Prepopulate with template" checkbox
3. Show that the template name reflects the selected asset class
4. Click "Create Document"

**Transition:** The system will prepare the domain and redirect to the Editor

---

### 4. Domain Preparation

**Talking Points:**
- "The system is now discovering and indexing regulatory sources for your jurisdiction"
- "This includes searching for relevant regulations, extracting content, and building a knowledge base"

**Actions:**
1. Watch the progress indicator and log messages
2. Point out the source discovery process
3. Wait for completion (shows "Domain preparation complete!")

---

### 5. Editor Interface Overview

**Location:** `/editor`

**Talking Points:**
- "This is the main editing interface with three key areas"

**Actions:**
1. Point out the **Left Panel** (Domain information and preparation)
2. Point out the **Center Panel** (Rich text editor with formatting toolbar)
3. Point out the **Right Panel** (AI Suggestions feed)

---

### 6. Rich Text Editor

**Location:** Center Panel

**Talking Points:**
- "The editor supports rich text formatting similar to Word or Google Docs"
- "Documents auto-save as you type"

**Actions:**
1. Show the template content (if prepopulated) with formatted headings
2. Demonstrate text formatting:
   - Bold text (Ctrl+B)
   - Italic text (Ctrl+I)
   - Headings (H1, H2, H3 buttons)
   - Bullet lists
   - Numbered lists
3. Type some sample content about datacenter planning

---

### 7. Signal Settings

**Location:** Right Panel - Settings Area

**Talking Points:**
- "Before generating suggestions, you can tune the AI's behavior with signal settings"
- "These settings affect how conservative or aggressive the suggestions will be"

**Actions:**
1. Show the three signal settings:

   **Formality:**
   - Click the info icon to show tooltip
   - "Controls the tone - from casual internal memos to formal regulatory submissions"

   **Risk Appetite:**
   - Click the info icon to show tooltip
   - "Determines how conservative the suggestions are regarding regulatory interpretation"

   **Stickiness:**
   - Click the info icon to show tooltip
   - "Controls how strictly the suggestions adhere to exact regulatory wording"

2. Adjust the settings to demonstrate different configurations

---

### 8. AI Suggestion Generation

**Location:** Right Panel

**Talking Points:**
- "Now let's generate AI-powered compliance suggestions based on your document content"

**Actions:**
1. Show the "Suggestions to generate" dropdown (3, 5, 8, 10, or 15)
2. Select a number (e.g., 5)
3. Click "Generate Suggestions"
4. Watch the loading state
5. Show the generated suggestions appearing

---

### 9. Suggestion Cards

**Location:** Right Panel - Suggestion Feed

**Talking Points:**
- "Each suggestion card contains actionable compliance guidance"

**Actions:**
1. Expand a suggestion card (if collapsed) to show full content
2. Point out the card elements:
   - Title and severity badge (high/medium/low)
   - Full suggestion content with rich formatting
   - Source references (regulatory URLs)
   - Action buttons

3. Demonstrate card actions:
   - **Collapse/Expand:** Click the chevron to toggle visibility
   - **Pin:** Click the pin icon to keep a suggestion visible across regenerations
   - **Refresh:** Click refresh to regenerate just this suggestion
   - **Archive:** Click archive to hide the suggestion

4. Click "Generate More" to append additional suggestions without replacing existing ones

---

### 10. Source Management

**Location:** Right Panel - "View Sources" button

**Talking Points:**
- "You can view and manage all indexed regulatory sources"

**Actions:**
1. Click "View Sources" to open the Sources Modal
2. Show sources grouped by category
3. Demonstrate removing a source (explain this excludes it from future suggestions)

---

### 11. Document Upload

**Location:** Sources Modal

**Talking Points:**
- "You can also upload your own reference documents to include in the knowledge base"
- "Supported formats include PDF, Word documents, and plain text files"

**Actions:**
1. Show the drag-and-drop upload area
2. Either drag a file or click to select
3. Show the upload progress
4. Show the uploaded file appearing in "User Uploaded" category
5. Close the modal

---

### 12. Archived Suggestions

**Location:** Right Panel

**Talking Points:**
- "Archived suggestions are not deleted - you can restore them if needed"

**Actions:**
1. Click "View Archived" button
2. Show archived suggestions
3. Demonstrate restoring an archived suggestion
4. Click "View Active" to return to main feed

---

### 13. Document Sharing

**Location:** Header or Documents Page

**Talking Points:**
- "You can share documents with stakeholders using secure read-only links"

**Actions:**
1. Click the Share button in the header
2. Show the share modal with:
   - Generated share URL
   - Passcode for access
   - Expiration time (72 hours)
3. Copy the link to demonstrate

---

### 14. Document History

**Location:** Right Panel - History Tab

**Talking Points:**
- "The system maintains a history of document versions"

**Actions:**
1. Click the "History" tab
2. Show auto-saved snapshots
3. Demonstrate restoring a previous version (if available)

---

### 15. Documents Page Actions

**Location:** `/documents`

**Talking Points:**
- "Let's return to the documents page to show management features"

**Actions:**
1. Navigate back to Documents (click Documents in header)
2. Demonstrate:
   - **Duplicate:** Create a copy of an existing document
   - **Delete:** Remove a document (with confirmation)
   - **Share:** Generate share link directly from list

---

## Feature Summary

| Feature | Description |
|---------|-------------|
| Multi-step Document Creation | Guided wizard with domain configuration |
| Template Prepopulation | Asset-class specific starting templates |
| Domain Preparation | Automated regulatory source discovery |
| Rich Text Editor | Full formatting capabilities with auto-save |
| AI Suggestions | Configurable count and behavior settings |
| Signal Settings | Formality, Risk, Stickiness with tooltips |
| Collapsible Cards | Compact view showing title and severity |
| Source Management | View, remove, and upload sources |
| Document Management | Full CRUD operations on documents |
| Secure Sharing | Time-limited read-only links with passcodes |
| Version History | Track and restore previous versions |

---

## Demo Tips

1. **Prepare sample content:** Have some datacenter planning text ready to paste for faster demos
2. **Use meaningful examples:** Reference real jurisdictions (Singapore, Germany, California) for credibility
3. **Show the AI in action:** The suggestion generation is the core value proposition
4. **Highlight customization:** Signal settings show how the tool adapts to different use cases
5. **Emphasize security:** Mention the passcode protection and link expiration for sharing

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Suggestions not generating | Check backend is running, verify API keys are configured |
| Sources not loading | Ensure domain preparation completed successfully |
| Upload failing | Verify file is under 10MB and supported format |
| Share link not working | Check the link has not expired (72 hour limit) |

---

## Closing

End the demo by:
1. Summarizing the key value propositions:
   - "Accelerates compliance drafting with jurisdiction-aware AI"
   - "Reduces regulatory research time with automated source discovery"
   - "Provides auditable suggestions with source citations"
2. Offering to answer questions
3. Providing next steps for trial or implementation
