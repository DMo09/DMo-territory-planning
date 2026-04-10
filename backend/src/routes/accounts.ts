import { Router, Request } from 'express';
import prisma from '../db/client';
import { searchAiSignal, searchAiSignalBatch, searchAiSignalNext50 } from '../services/aiSignal';
import { getCompanyRevenue } from '../services/enrichment/index';
import { recomputeAccountTier } from '../services/tiering';
import { getPrioritySuggestions } from '../services/playRecommender';

interface PlanParams { planId: string }
interface AccountParams extends PlanParams { accountId: string }

const router = Router({ mergeParams: true });

// List accounts for a plan
router.get('/', async (req: Request<PlanParams>, res) => {
  const { planId } = req.params;
  const { tier, industry, search, page = '1', pageSize = '50' } = req.query;

  const where: Record<string, unknown> = { territoryPlanId: planId };
  if (tier) where.tier = parseInt(tier as string);
  if (industry) where.normalizedIndustry = industry as string;
  if (search) {
    where.OR = [
      { accountName: { contains: search as string, mode: 'insensitive' } },
      { industry: { contains: search as string, mode: 'insensitive' } },
      { normalizedIndustry: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  const take = parseInt(pageSize as string);

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      skip,
      take,
      orderBy: [{ tier: 'asc' }, { annualRevenue: 'desc' }, { arr: 'desc' }],
    }),
    prisma.account.count({ where }),
  ]);

  res.json({ accounts, total });
});

// Update account
router.patch('/:accountId', async (req: Request<AccountParams>, res) => {
  const account = await prisma.account.update({
    where: { id: req.params.accountId },
    data: req.body,
  });
  res.json(account);
});

// Search revenue for single account
router.post('/:accountId/search-revenue', async (req: Request<AccountParams>, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.params.accountId } });
  if (!account) return res.status(404).json({ error: 'Not found' });

  try {
    const result = await getCompanyRevenue(account.accountName);
    const updated = await prisma.account.update({
      where: { id: account.id },
      data: {
        annualRevenue: result.annualRevenue,
        annualRevenueSource: result.source,
        annualRevenueConfidence: result.confidence,
      },
    });
    await recomputeAccountTier(account.id);
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Revenue search failed' });
  }
});

// Search AI signal for single account
router.post('/:accountId/search-ai', async (req: Request<AccountParams>, res) => {
  const { accountId } = req.params;
  searchAiSignal(accountId).catch(console.error);
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  res.json({ ...account, aiSignalStatus: 'searching' });
});

// Search AI signal for batch of accounts
router.post('/search-ai-batch', async (req: Request<PlanParams>, res) => {
  const { accountIds } = req.body as { accountIds: string[] };
  if (!accountIds?.length) return res.status(400).json({ error: 'accountIds required' });
  searchAiSignalBatch(accountIds).catch(console.error);
  res.json({ queued: accountIds.length });
});

// Search AI signal for next 50 candidates
router.post('/search-ai-next50', async (req: Request<PlanParams>, res) => {
  const { planId } = req.params;
  searchAiSignalNext50(planId).catch(console.error);
  res.json({ queued: true });
});

// Run full enrichment
router.post('/enrich', async (req: Request<PlanParams>, res) => {
  const { planId } = req.params;
  const accounts = await prisma.account.findMany({
    where: { territoryPlanId: planId, annualRevenue: null },
  });
  (async () => {
    for (const account of accounts) {
      try {
        const result = await getCompanyRevenue(account.accountName);
        await prisma.account.update({
          where: { id: account.id },
          data: {
            annualRevenue: result.annualRevenue,
            annualRevenueSource: result.source,
            annualRevenueConfidence: result.confidence,
          },
        });
        await recomputeAccountTier(account.id);
      } catch { /* continue */ }
    }
  })().catch(console.error);
  res.json({ queued: accounts.length });
});

// Get priority suggestions
router.get('/suggestions', async (req: Request<PlanParams>, res) => {
  const { planId } = req.params;
  const suggestions = await getPrioritySuggestions(planId);
  res.json(suggestions);
});

export default router;
