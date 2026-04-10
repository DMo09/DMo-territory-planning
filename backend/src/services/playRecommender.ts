import prisma from '../db/client';

interface AccountRow {
  id: string;
  normalizedIndustry: string;
  industry: string;
  tier: number | null;
  arr: number;
  pipelineArr: number;
  annualRevenue: number | null;
  aiSignal: boolean | null;
}

interface PlayRow {
  id: string;
  name: string;
  description: string;
  recommendedIndustries: string[];
  recommendedTiers: number[];
  isActive: boolean;
}

export async function getPlayRecommendations(territoryPlanId: string) {
  const accounts = await prisma.account.findMany({ where: { territoryPlanId } }) as AccountRow[];
  const plays = await prisma.play.findMany({ where: { isActive: true } }) as PlayRow[];

  const industryCounts = accounts.reduce((acc: Record<string, number>, a: AccountRow) => {
    const ind = a.normalizedIndustry || a.industry;
    acc[ind] = (acc[ind] || 0) + 1;
    return acc;
  }, {});

  const topIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ind]) => ind.toLowerCase());

  const tier1Count = accounts.filter((a: AccountRow) => a.tier === 1).length;
  const tier2Count = accounts.filter((a: AccountRow) => a.tier === 2).length;
  const dominantTiers: number[] = [];
  if (tier1Count > 0) dominantTiers.push(1);
  if (tier2Count > 0) dominantTiers.push(2);
  if (tier1Count === 0 && tier2Count === 0) dominantTiers.push(3);

  const scored = plays.map((play: PlayRow) => {
    let score = 0;
    for (const ind of play.recommendedIndustries) {
      if (topIndustries.includes(ind.toLowerCase())) score += 2;
    }
    for (const tier of play.recommendedTiers) {
      if (dominantTiers.includes(tier)) score += 1;
    }
    return { play, score };
  });

  return scored
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, 5)
    .map((s: { play: PlayRow }) => s.play);
}

export async function getPrioritySuggestions(territoryPlanId: string) {
  const accounts = await prisma.account.findMany({
    where: { territoryPlanId },
    orderBy: [
      { annualRevenue: 'desc' },
      { pipelineArr: 'desc' },
      { arr: 'desc' },
    ],
  }) as AccountRow[];

  const bigBetCandidates = accounts
    .filter((a: AccountRow) => (a.tier === 1 || a.tier === 2) && a.aiSignal === true)
    .slice(0, 5);

  const winCandidates = accounts
    .filter((a: AccountRow) => a.tier === 1 || a.tier === 2)
    .sort((a: AccountRow, b: AccountRow) => (b.pipelineArr - a.pipelineArr) || (b.arr - a.arr))
    .slice(0, 15);

  const breakIntoCandidates = accounts
    .filter((a: AccountRow) => a.arr === 0 || a.arr === null)
    .sort((a: AccountRow, b: AccountRow) => {
      if ((a.tier === 2) !== (b.tier === 2)) return a.tier === 2 ? -1 : 1;
      return ((b.annualRevenue || 0) - (a.annualRevenue || 0)) || (b.pipelineArr - a.pipelineArr);
    })
    .slice(0, 30);

  const recommendedPlays = await getPlayRecommendations(territoryPlanId);

  return { bigBets: bigBetCandidates, win: winCandidates, breakInto: breakIntoCandidates, plays: recommendedPlays };
}
