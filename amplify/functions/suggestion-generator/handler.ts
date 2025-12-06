import type { Handler } from 'aws-lambda';

interface SignalValues {
  formality: 'casual' | 'moderate' | 'formal';
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  complianceStrictness: 'lenient' | 'standard' | 'full';
}

interface GenerationRequest {
  documentContent: string;
  domainId: string;
  signals: SignalValues;
  approverPov?: string;
  retrievedSources?: Array<{
    url: string;
    title: string;
    content: string;
    category: string;
  }>;
}

interface Suggestion {
  id: string;
  type: 'structured' | 'narrative';
  title: string;
  content: string;
  sourceRefs: string[];
  confidence: number;
}

interface GenerationResponse {
  suggestions: Suggestion[];
  documentId: string;
  generatedAt: string;
}

// Remove redacted content from document
function stripRedactions(content: string): string {
  // Remove [[REDACTED:...]] markers and their content
  return content.replace(/\[\[REDACTED:[^\]]*\]\]/g, '[CONFIDENTIAL]');
}

// Build system prompt based on signals
function buildSystemPrompt(signals: SignalValues, approverPov?: string): string {
  const formalityMap = {
    casual: 'Use conversational, accessible language while maintaining professionalism.',
    moderate: 'Balance technical precision with readability.',
    formal: 'Use formal, technical language appropriate for official documents.',
  };

  const riskMap = {
    conservative: 'Prioritize risk mitigation and compliance. Flag any potential issues prominently.',
    moderate: 'Balance risk awareness with practical considerations.',
    aggressive: 'Focus on opportunities while noting key compliance requirements.',
  };

  const strictnessMap = {
    lenient: 'Highlight mandatory requirements; note optional best practices separately.',
    standard: 'Include both mandatory requirements and recommended practices.',
    full: 'Apply the strictest interpretation of all applicable regulations and standards.',
  };

  const povPrompts: Record<string, string> = {
    operational_risk: 'Focus on operational risks, business continuity, and process reliability.',
    regulatory_compliance: 'Prioritize regulatory requirements, reporting obligations, and audit readiness.',
    financial_impact: 'Emphasize cost implications, financial risks, and budget considerations.',
    safety_workforce: 'Focus on worker safety, health regulations, and workforce considerations.',
    environmental_impact: 'Prioritize environmental regulations, sustainability, and ecological impact.',
    legal_contractual: 'Focus on legal obligations, contractual requirements, and liability considerations.',
  };

  let prompt = `You are an expert regulatory compliance advisor helping draft planning documents.

${formalityMap[signals.formality]}
${riskMap[signals.riskAppetite]}
${strictnessMap[signals.complianceStrictness]}
`;

  if (approverPov && povPrompts[approverPov]) {
    prompt += `\nApprover Perspective: ${povPrompts[approverPov]}`;
  }

  prompt += `

Generate suggestions that are:
1. Actionable and specific
2. Backed by regulatory sources when available
3. Organized by priority and relevance
4. Clear about what is mandatory vs recommended

Format suggestions as either:
- Structured: Checklist items with clear requirements
- Narrative: Prose explanations with context and rationale`;

  return prompt;
}

// Generate suggestions using AI
async function generateSuggestions(
  request: GenerationRequest,
  apiKey: string
): Promise<Suggestion[]> {
  const cleanContent = stripRedactions(request.documentContent);
  const systemPrompt = buildSystemPrompt(request.signals, request.approverPov);

  // Build context from retrieved sources
  let sourceContext = '';
  if (request.retrievedSources && request.retrievedSources.length > 0) {
    sourceContext = '\n\nRelevant Regulatory Sources:\n';
    request.retrievedSources.forEach((source, i) => {
      sourceContext += `\n[${i + 1}] ${source.title} (${source.category})\nURL: ${source.url}\n${source.content.slice(0, 500)}...\n`;
    });
  }

  const userPrompt = `Please review this planning document and provide compliance suggestions:

Document Content:
${cleanContent}
${sourceContext}

Generate 3-5 relevant suggestions mixing structured checklists and narrative guidance. Return as JSON array with format:
[{
  "type": "structured" | "narrative",
  "title": "suggestion title",
  "content": "detailed content",
  "sourceRefs": ["url1", "url2"],
  "confidence": 0.0-1.0
}]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions || parsed;

    return suggestions.map((s: Suggestion, index: number) => ({
      id: `suggestion-${Date.now()}-${index}`,
      type: s.type || 'narrative',
      title: s.title || `Suggestion ${index + 1}`,
      content: s.content,
      sourceRefs: s.sourceRefs || [],
      confidence: s.confidence || 0.8,
    }));
  } catch {
    console.error('Failed to parse suggestions:', content);
    return [];
  }
}

// Main handler
export const handler: Handler = async (event) => {
  const request = event.arguments || event;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const suggestions = await generateSuggestions(
      request as GenerationRequest,
      apiKey
    );

    return {
      suggestions,
      documentId: request.documentId,
      generatedAt: new Date().toISOString(),
    } as GenerationResponse;
  } catch (error) {
    console.error('Suggestion generation error:', error);
    throw error;
  }
};


