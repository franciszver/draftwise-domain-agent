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
  suggestionCount?: number;
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
  const count = request.suggestionCount || 5;

  // Log incoming request for debugging
  console.log(`[Suggestion Generator] Generating ${count} suggestions`);
  console.log(`[Suggestion Generator] Retrieved sources count: ${request.retrievedSources?.length || 0}`);
  if (request.retrievedSources && request.retrievedSources.length > 0) {
    console.log('[Suggestion Generator] Source URLs being sent to AI:');
    request.retrievedSources.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.url}`);
    });
  }

  // Build context from retrieved sources with explicit URL list for AI reference
  let sourceContext = '';
  let availableSourceUrls: string[] = [];

  if (request.retrievedSources && request.retrievedSources.length > 0) {
    availableSourceUrls = request.retrievedSources.map(s => s.url);

    sourceContext = '\n\n=== REGULATORY SOURCES (use these exact URLs in sourceRefs) ===\n';
    request.retrievedSources.forEach((source, i) => {
      sourceContext += `\nSOURCE ${i + 1}:\n`;
      sourceContext += `  Title: ${source.title}\n`;
      sourceContext += `  Category: ${source.category}\n`;
      sourceContext += `  URL: ${source.url}\n`;
      sourceContext += `  Content Preview: ${(source.content || '').slice(0, 400)}...\n`;
    });
    sourceContext += '\n=== END SOURCES ===\n';
  }

  const sourceUrlsList = availableSourceUrls.length > 0
    ? `\nAvailable source URLs to cite:\n${availableSourceUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}\n`
    : '';

  const userPrompt = `Please review this planning document and provide compliance suggestions:

Document Content:
${cleanContent}
${sourceContext}
${sourceUrlsList}

Generate exactly ${count} relevant suggestions mixing structured checklists and narrative guidance.

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid JSON. No markdown, no explanation, just the JSON object.
2. For EACH suggestion, include "sourceRefs" as an array of URLs.
3. ONLY use URLs from the "Available source URLs to cite" list above - copy them EXACTLY character-for-character.
4. DO NOT invent, fabricate, or modify URLs. DO NOT use placeholder URLs like "example.gov" or "example.com".
5. If no source URL is relevant, use an empty array: "sourceRefs": []
6. Each suggestion should cite 1-3 relevant sources from the provided list when applicable.

Return a JSON object with this exact format:
{
  "suggestions": [
    {
      "type": "structured",
      "title": "suggestion title here",
      "content": "detailed content with formatting",
      "sourceRefs": [],
      "confidence": 0.85
    }
  ]
}

Remember: sourceRefs must contain ONLY URLs copied exactly from the "Available source URLs to cite" list, or be an empty array.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://draftwise.app',
      'X-Title': 'DraftWise Domain Agent',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    // Log raw AI response for debugging
    console.log('[Suggestion Generator] Raw AI response:', content.slice(0, 500));

    // Sometimes AI wraps response in markdown code blocks, try to extract JSON
    let jsonContent = content;

    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
      console.log('[Suggestion Generator] Extracted JSON from markdown code block');
    }

    const parsed = JSON.parse(jsonContent);
    const suggestions = parsed.suggestions || parsed;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error('[Suggestion Generator] No suggestions in parsed response:', parsed);
      throw new Error('AI returned no suggestions');
    }

    console.log(`[Suggestion Generator] Parsed ${suggestions.length} suggestions`);

    return suggestions.map((s: Suggestion, index: number) => {
      const sourceRefs = s.sourceRefs || [];
      console.log(`[Suggestion Generator] Suggestion ${index + 1} "${s.title}" has ${sourceRefs.length} sourceRefs:`, sourceRefs);

      return {
        id: `suggestion-${Date.now()}-${index}`,
        type: s.type || 'narrative',
        title: s.title || `Suggestion ${index + 1}`,
        content: s.content || '',
        sourceRefs,
        confidence: s.confidence || 0.8,
      };
    });
  } catch (parseError) {
    console.error('[Suggestion Generator] Failed to parse suggestions. Raw content:', content);
    console.error('[Suggestion Generator] Parse error:', parseError);
    // Throw error instead of returning empty - this will trigger the frontend fallback
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }
}

// Main handler
export const handler: Handler = async (event) => {
  const rawRequest = event.arguments || event;
  // Use OpenRouter by default, fall back to OpenAI if not configured
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Parse signals if it's a JSON string (from GraphQL)
  let signals: SignalValues;
  if (typeof rawRequest.signals === 'string') {
    signals = JSON.parse(rawRequest.signals);
  } else {
    signals = rawRequest.signals;
  }

  // Parse retrievedSources if it's a JSON string
  let retrievedSources = rawRequest.retrievedSources;
  if (typeof retrievedSources === 'string') {
    retrievedSources = JSON.parse(retrievedSources);
  }

  const request: GenerationRequest = {
    documentContent: rawRequest.documentContent,
    domainId: rawRequest.domainId,
    signals,
    approverPov: rawRequest.approverPov,
    suggestionCount: rawRequest.suggestionCount,
    retrievedSources,
  };

  try {
    const suggestions = await generateSuggestions(request, apiKey);

    return {
      suggestions,
      documentId: rawRequest.documentId,
      generatedAt: new Date().toISOString(),
    } as GenerationResponse;
  } catch (error) {
    console.error('Suggestion generation error:', error);
    throw error;
  }
};


