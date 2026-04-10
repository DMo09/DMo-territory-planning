import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import type { RevenueProvider, RevenueResult } from './index';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;

async function braveSearch(query: string): Promise<string> {
  if (!BRAVE_KEY) return '';
  try {
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: { 'X-Subscription-Token': BRAVE_KEY, Accept: 'application/json' },
      params: { q: query, count: 5 },
      timeout: 8000,
    });
    const results = res.data.web?.results || [];
    return results.map((r: { title: string; description: string }) =>
      `${r.title}: ${r.description}`
    ).join('\n');
  } catch {
    return '';
  }
}

async function extractRevenueFromText(companyName: string, searchText: string): Promise<RevenueResult> {
  if (!searchText) {
    return { annualRevenue: null, source: 'web_search', confidence: 0 };
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Extract the annual revenue of "${companyName}" from this text. Return ONLY a JSON object with:
- "revenue": number in USD (null if not found)
- "confidence": 0.0-1.0 (how confident you are)

Text: ${searchText.slice(0, 2000)}

JSON only, no explanation:`,
    }],
  });

  try {
    const text = (message.content[0] as { text: string }).text.trim();
    const json = JSON.parse(text.replace(/```json?|```/g, '').trim());
    return {
      annualRevenue: json.revenue || null,
      source: 'web_search',
      confidence: json.confidence || 0.5,
    };
  } catch {
    return { annualRevenue: null, source: 'web_search', confidence: 0 };
  }
}

export class WebSearchRevenueProvider implements RevenueProvider {
  async getRevenue(companyName: string): Promise<RevenueResult> {
    const query = `${companyName} annual revenue 2024 2023`;
    const searchText = await braveSearch(query);
    return extractRevenueFromText(companyName, searchText);
  }
}

// Phase 2 stub
export class SalesforceRevenueProvider implements RevenueProvider {
  async getRevenue(_companyName: string): Promise<RevenueResult> {
    throw new Error('Salesforce provider not yet configured');
  }
}
