import type { PageInfo, AnalyzeResponse, LinkSuggestion } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function getInternalLinkSuggestions(
  pageData: AnalyzeResponse,
  targetPages: PageInfo[]
): Promise<LinkSuggestion[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY environment variable.');
  }

  const prompt = `You are an SEO expert. Analyze this blog post and suggest internal linking opportunities.

**Page Title:** ${pageData.title || 'Untitled'}
**URL:** ${pageData.url}
**Word Count:** ${pageData.word_count}
**Current Internal Links:** ${pageData.internal_links.total}
**Links to Target Pages:** ${pageData.internal_links.to_target_pages}

**Target Pages Available to Link To:**
${targetPages.slice(0, 20).map(p => `- ${p.url}`).join('\n')}

**Article Content:**
${pageData.extracted_content.slice(0, 8000)}

Suggest 3-5 specific places in the content where internal links to target pages would be natural and valuable for SEO.

IMPORTANT: Respond ONLY with valid JSON in this exact format, no other text:
{
  "suggestions": [
    {
      "sentence": "The exact sentence or phrase from the content where the link should be added",
      "targetUrl": "The full URL from the target pages list to link to",
      "anchorText": "The specific words to make into a link",
      "reason": "Brief explanation of why this link makes sense"
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText.trim());
    return parsed.suggestions || [];
  } catch {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Failed to parse AI suggestions. Please try again.');
  }
}
