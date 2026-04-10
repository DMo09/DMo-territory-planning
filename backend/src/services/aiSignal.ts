import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db/client';
import { recomputeAccountTier } from './tiering';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;

async function braveSearch(query: string): Promise<string> {
  if (!BRAVE_KEY) return '';
  try {
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: { 'X-Subscription-Token': BRAVE_KEY, Accept: 'application/json' },
      params: { q: query, count: 8 },
      timeout: 10000,
    });
    const results = res.data.web?.results || [];
    return results.map((r: { title: string; description: string; url: string }) =>
      `${r.title}: ${r.description}`
    ).join('\n');
  } catch {
    return '';
  }
}

export async function searchAiSignal(accountId: string): Promise<void> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return;

  // Mark as searching
  await prisma.account.update({
    where: { id: accountId },
    data: { aiSignalStatus: 'searching' },
  });

  try {
    const query = `${account.accountName} artificial intelligence AI digital transformation strategy 2024 2025`;
    const searchText = await braveSearch(query);

    if (!searchText) {
      await prisma.account.update({
        where: { id: accountId },
        data: {
          aiSignal: false,
          aiSignalStatus: 'not_found',
          aiSignalSummary: null,
          aiSignalSearchedAt: new Date(),
        },
      });
      await recomputeAccountTier(accountId);
      return;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analyze whether "${account.accountName}" has PUBLIC SIGNALS of AI transformation based on this search result text.

AI signals include: AI strategy announcements, AI product launches, AI partnerships, large AI investments, executive statements about AI transformation, job postings for AI roles at scale, or news about major digital transformation initiatives.

Text: ${searchText.slice(0, 3000)}

Return ONLY JSON:
{
  "hasSignal": true or false,
  "summary": "1-2 sentence summary of the AI signal, or null if no signal"
}`,
      }],
    });

    const text = (message.content[0] as { text: string }).text.trim();
    const parsed = JSON.parse(text.replace(/```json?|```/g, '').trim());

    await prisma.account.update({
      where: { id: accountId },
      data: {
        aiSignal: parsed.hasSignal,
        aiSignalStatus: parsed.hasSignal ? 'found' : 'not_found',
        aiSignalSummary: parsed.summary || null,
        aiSignalSearchedAt: new Date(),
      },
    });

    await recomputeAccountTier(accountId);
  } catch (err) {
    await prisma.account.update({
      where: { id: accountId },
      data: { aiSignalStatus: 'error', aiSignalSearchedAt: new Date() },
    });
  }
}

export async function searchAiSignalBatch(accountIds: string[]): Promise<void> {
  // Sequential to avoid rate limiting
  for (const id of accountIds) {
    await searchAiSignal(id);
    // Small delay to be kind to rate limits
    await new Promise(r => setTimeout(r, 500));
  }
}

export async function searchAiSignalNext50(territoryPlanId: string): Promise<void> {
  // Find 50 accounts that are Tier 1/2 candidates (right industry + revenue) but not yet searched
  const accounts = await prisma.account.findMany({
    where: {
      territoryPlanId,
      aiSignalStatus: 'pending',
      annualRevenue: { gte: 500_000_000 },
    },
    take: 50,
    orderBy: { annualRevenue: 'desc' },
  });

  await searchAiSignalBatch(accounts.map((a: { id: string }) => a.id));
}
