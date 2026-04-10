import prisma from '../db/client';

const REVENUE_THRESHOLD = 500_000_000; // $500M
const ARR_CUSTOMER_THRESHOLD = 10_000;  // $10K

export interface TierInput {
  arr: number;
  annualRevenue: number | null;
  normalizedIndustry: string;
  aiSignal: boolean | null;
  aiSignalStatus: string;
}

export async function computeTier(input: TierInput): Promise<number | null> {
  const targetIndustries = await getTargetIndustries();

  const isLargeRevenue = input.annualRevenue !== null && input.annualRevenue >= REVENUE_THRESHOLD;
  const isCustomer = input.arr > ARR_CUSTOMER_THRESHOLD;
  const isTargetIndustry = targetIndustries.includes(input.normalizedIndustry.toLowerCase());
  const hasAiSignal = input.aiSignal === true;

  // Tier 1: Large revenue + current customer + target industry + AI signal
  if (isLargeRevenue && isCustomer && isTargetIndustry && hasAiSignal) {
    return 1;
  }

  // Tier 2: Large revenue + NOT customer + target industry + AI signal
  if (isLargeRevenue && !isCustomer && isTargetIndustry && hasAiSignal) {
    return 2;
  }

  // Can't tier yet if no revenue data and no AI signal check
  if (input.annualRevenue === null && input.aiSignalStatus === 'pending') {
    return null;
  }

  // Tier 3: Everything else
  return 3;
}

let cachedTargetIndustries: string[] | null = null;
let cacheTime = 0;

async function getTargetIndustries(): Promise<string[]> {
  // Cache for 60s to avoid DB hit on every tier computation
  if (cachedTargetIndustries && Date.now() - cacheTime < 60_000) {
    return cachedTargetIndustries;
  }
  const configs = await prisma.industryConfig.findMany({ where: { isTarget: true } });
  cachedTargetIndustries = configs.map((c: { name: string }) => c.name.toLowerCase());
  cacheTime = Date.now();
  return cachedTargetIndustries as string[];
}

export function invalidateTierCache() {
  cachedTargetIndustries = null;
}

export async function recomputeAccountTier(accountId: string): Promise<number | null> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return null;

  const tier = await computeTier({
    arr: account.arr,
    annualRevenue: account.annualRevenue,
    normalizedIndustry: account.normalizedIndustry || account.industry,
    aiSignal: account.aiSignal,
    aiSignalStatus: account.aiSignalStatus,
  });

  await prisma.account.update({ where: { id: accountId }, data: { tier } });
  return tier;
}

export async function recomputeAllTiers(territoryPlanId: string): Promise<void> {
  const accounts = await prisma.account.findMany({ where: { territoryPlanId } });
  await getTargetIndustries(); // ensure cache is warm

  await Promise.all(
    accounts.map(async (account: { id: string; arr: number; annualRevenue: number | null; normalizedIndustry: string; industry: string; aiSignal: boolean | null; aiSignalStatus: string }) => {
      const tier = await computeTier({
        arr: account.arr,
        annualRevenue: account.annualRevenue,
        normalizedIndustry: account.normalizedIndustry || account.industry,
        aiSignal: account.aiSignal,
        aiSignalStatus: account.aiSignalStatus,
      });
      return prisma.account.update({ where: { id: account.id }, data: { tier } });
    })
  );
}
