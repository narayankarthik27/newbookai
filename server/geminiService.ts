import { GoogleGenAI } from '@google/genai';
import { Book, Recommendation } from '../src/types.js';

let aiInstance: GoogleGenAI | null = null;

function getAi(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

export async function explainRecommendations(
  queryOrFavorite: string,
  recommendations: Recommendation[],
  isBookMatch: boolean = false
): Promise<Recommendation[]> {
  const ai = getAi();

  if (!ai || !process.env.GEMINI_API_KEY) {
    // Generate intelligent algorithmic narrative rationale when API key is not configured
    return recommendations.map(rec => {
      const matchKeywords = rec.matchedKeywords?.length ? rec.matchedKeywords.join(', ') : 'thematic motifs';
      const rationale = isBookMatch
        ? `Shares strong narrative affinity and structural pacing, especially around key themes (${matchKeywords}). Recommended for readers drawn to deep character introspection and similar world-building.`
        : `Matches your search intent with high semantic vector convergence. Focuses strongly on ${matchKeywords}, delivering relevant atmosphere and subject matter.`;

      return {
        ...rec,
        aiExplanation: rationale,
      };
    });
  }

  try {
    const bookSummaries = recommendations.map((rec, i) =>
      `[${i + 1}] "${rec.book.title}" by ${rec.book.authors} (${rec.book.categories}): ${rec.book.description ? rec.book.description.slice(0, 220) + '...' : 'No description'}`
    ).join('\n\n');

    const prompt = `You are an expert literary curator and AI book recommender.
The user ${isBookMatch ? `is looking for books similar to their favorite book: "${queryOrFavorite}"` : `searched with query: "${queryOrFavorite}"`}.

Here are the top ${recommendations.length} vector-matched candidate books:
${bookSummaries}

For EACH of the ${recommendations.length} books, provide a concise 1-2 sentence compelling rationale explaining specifically why it matches the reader's interest, what shared themes or stylistic elements it has, and who will love reading it.

Format your response strictly as JSON with this structure:
{
  "explanations": [
    { "index": 1, "rationale": "..." },
    { "index": 2, "rationale": "..." }
  ]
}
Return only valid JSON.`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
        if (response) break;
      } catch (e) {
        lastError = e;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const text = response.text || '';
    const parsed = JSON.parse(text);

    if (parsed.explanations && Array.isArray(parsed.explanations)) {
      return recommendations.map((rec, idx) => {
        const found = parsed.explanations.find((e: any) => e.index === idx + 1);
        return {
          ...rec,
          aiExplanation: found?.rationale || `Strong semantic match for "${queryOrFavorite}" with thematic parallels in ${rec.book.categories}.`,
        };
      });
    }
  } catch (err) {
    console.error('Gemini explanation generation failed, falling back to local rationale:', err);
  }

  // Fallback if LLM call had an issue
  return recommendations.map(rec => ({
    ...rec,
    aiExplanation: `Recommended based on close vector similarity (${(rec.score * 100).toFixed(0)}% match) and overlapping themes: ${rec.matchedKeywords?.slice(0, 3).join(', ') || rec.book.categories}.`,
  }));
}
