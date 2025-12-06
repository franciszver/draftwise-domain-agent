flowchart TD
    %% User Layer
    U[User: Planner / COO / Compliance Officer / Auditor]

    %% Frontend
    subgraph Frontend [Frontend: AWS Amplify React SPA]
        Editor[Rich Text Editor\n(Autosave + Snapshots)]
        DomainPanel[Domain Chooser\n(Country → Site → Asset Class)]
        SignalControls[Signal Controls\n(Formality, Risk Appetite, Strictness)]
        SuggestionFeed[Suggestion Feed\n(Structured + Narrative Cards)]
        AdminConsole[Admin Console\n(Passcode, Caps, Model Override)]
    end

    %% Backend
    subgraph Backend [Backend Services]
        API[AppSync GraphQL API]
        Lambda[Lambda Functions\n(Suggestions, RAG Retrieval, Export Links)]
        StepFn[AWS Step Functions\n(Domain Prep Workflow)]
        EventBridge[Amazon EventBridge\n(Subagent Refresh)]
    end

    %% Data Layer
    subgraph Data [Data & Storage]
        DynamoDB[Amazon DynamoDB\n(Documents, Snapshots, Feed State)]
        S3[Amazon S3\n(Evidence Attachments, Exports)]
        Secrets[AWS Secrets Manager\n(AI Keys, Admin Codes)]
    end

    %% AI Layer
    subgraph AI [AI Providers]
        OpenAI[OpenAI / OpenRouter\n(Drafting + Embeddings)]
    end

    %% Sharing & Retention
    subgraph Sharing [Sharing & Retention]
        ReadOnlyLinks[Passcode-Protected Links\n72h Expiry]
        Retention[Retention Policy\n3-Day Auto Purge]
    end

    %% Observability
    subgraph Observability [Monitoring & Governance]
        CloudWatch[Amazon CloudWatch]
        CloudTrail[Amazon CloudTrail]
    end

    %% User Flows
    U --> Editor
    U --> DomainPanel
    U --> SignalControls
    U --> SuggestionFeed
    U --> AdminConsole

    %% Document Editing Workflow
    Editor --> API
    API --> Lambda
    Lambda --> DynamoDB
    Lambda --> S3
    Editor --> SuggestionFeed

    %% Domain Preparation Workflow
    DomainPanel --> API
    API --> StepFn
    StepFn --> Lambda
    EventBridge --> Lambda
    Lambda --> DynamoDB

    %% Suggestion Generation Workflow
    SignalControls --> API
    SuggestionFeed --> API
    API --> Lambda
    Lambda --> OpenAI
    Lambda --> SuggestionFeed

    %% Admin Console Workflow
    AdminConsole --> API
    API --> Secrets
    AdminConsole --> Lambda
    Lambda --> OpenAI

    %% Sharing Workflow
    Lambda --> ReadOnlyLinks
    ReadOnlyLinks --> U
    DynamoDB --> Retention
    S3 --> Retention

    %% Observability Workflow
    Backend --> CloudWatch
    Backend --> CloudTrail
