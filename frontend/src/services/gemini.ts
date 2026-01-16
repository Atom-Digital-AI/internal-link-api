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
          maxOutputTokens: 4096,
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

  // Parse JSON from response using multiple extraction strategies
  const extractJson = (rawText: string): LinkSuggestion[] => {
    // Strategy 1: Try extracting from ```json...``` or ```...``` code blocks
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions;
        }
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 2: Try finding a JSON object pattern starting with { and containing "suggestions"
    const jsonObjectMatch = rawText.match(/\{[\s\S]*"suggestions"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        const parsed = JSON.parse(jsonObjectMatch[0]);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions;
        }
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 3: Try finding just the array portion
    const arrayMatch = rawText.match(/\[\s*\{[\s\S]*"sentence"[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 4: Try parsing the raw text directly
    try {
      const parsed = JSON.parse(rawText.trim());
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return parsed.suggestions;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 5: Salvage individual complete suggestions from truncated response
    // This handles cases where the API response was cut off mid-JSON
    const individualMatches = rawText.matchAll(
      /\{\s*"sentence"\s*:\s*"(?:[^"\\]|\\.)*"\s*,\s*"targetUrl"\s*:\s*"(?:[^"\\]|\\.)*"\s*,\s*"anchorText"\s*:\s*"(?:[^"\\]|\\.)*"\s*,\s*"reason"\s*:\s*"(?:[^"\\]|\\.)*"\s*\}/g
    );
    const salvaged = [...individualMatches].map(m => {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }).filter(Boolean);
    if (salvaged.length > 0) {
      console.warn(`Salvaged ${salvaged.length} suggestions from partial response`);
      return salvaged as LinkSuggestion[];
    }

    throw new Error('Could not extract valid JSON from response');
  };

  try {
    const suggestions = extractJson(text);

    // Validate that each suggestion has required fields
    return suggestions.filter(s =>
      s &&
      typeof s.sentence === 'string' &&
      typeof s.targetUrl === 'string' &&
      typeof s.anchorText === 'string'
    );
  } catch (error) {
    console.error('Failed to parse Gemini response:', text);
    console.error('Parse error:', error);

    // Detect truncation - response ends without proper JSON closure
    const trimmed = text.trim();
    const isTruncated = !trimmed.endsWith('}') && !trimmed.endsWith(']') &&
      (trimmed.includes('"suggestions"') || trimmed.includes('"sentence"'));

    if (isTruncated) {
      throw new Error('AI response was truncated. Try again or reduce the content length.');
    }
    throw new Error('Failed to parse AI suggestions. Please try again.');
  }
}
