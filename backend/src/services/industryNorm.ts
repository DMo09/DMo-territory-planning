import prisma from '../db/client';

// Common aliases for industry normalization
const INDUSTRY_ALIASES: Record<string, string> = {
  // Banking
  'banking': 'Banking',
  'financial services': 'Banking',
  'banking & financial services': 'Banking',
  'bank': 'Banking',
  'finance': 'Banking',
  'fs': 'Banking',
  'banks': 'Banking',
  'investment banking': 'Banking',
  'capital markets': 'Banking',
  // Insurance
  'insurance': 'Insurance',
  'ins': 'Insurance',
  // Manufacturing
  'manufacturing': 'Manufacturing',
  'mfg': 'Manufacturing',
  'industrial manufacturing': 'Manufacturing',
  'industrial': 'Manufacturing',
  'automotive': 'Manufacturing',
  // Healthcare
  'healthcare': 'Healthcare',
  'health care': 'Healthcare',
  'health sciences': 'Healthcare',
  'life sciences': 'Healthcare',
  'pharma': 'Healthcare',
  'pharmaceutical': 'Healthcare',
  'medical': 'Healthcare',
  'biotech': 'Healthcare',
  // Technology
  'technology': 'Technology',
  'tech': 'Technology',
  'software': 'Technology',
  'it services': 'Technology',
  'information technology': 'Technology',
  // Retail
  'retail': 'Retail',
  'e-commerce': 'Retail',
  'ecommerce': 'Retail',
  'consumer goods': 'Retail',
  // Energy
  'energy': 'Energy',
  'utilities': 'Energy',
  'oil & gas': 'Energy',
  // Government
  'government': 'Government',
  'public sector': 'Government',
  'federal': 'Government',
  'state & local government': 'Government',
};

export async function normalizeIndustry(rawIndustry: string): Promise<string> {
  if (!rawIndustry) return 'Other';

  const lower = rawIndustry.toLowerCase().trim();

  // Direct alias match
  if (INDUSTRY_ALIASES[lower]) {
    return INDUSTRY_ALIASES[lower];
  }

  // Partial match
  for (const [alias, normalized] of Object.entries(INDUSTRY_ALIASES)) {
    if (lower.includes(alias) || alias.includes(lower)) {
      return normalized;
    }
  }

  // Check if it matches a configured industry (case-insensitive)
  const configs = await prisma.industryConfig.findMany();
  const match = configs.find((c: { name: string }) => c.name.toLowerCase() === lower);
  if (match) return match.name;

  // Return as-is (capitalized)
  return rawIndustry.trim().replace(/\b\w/g, l => l.toUpperCase());
}

export async function normalizeIndustryBatch(industries: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = [...new Set(industries)];
  await Promise.all(
    unique.map(async ind => {
      const normalized = await normalizeIndustry(ind);
      result.set(ind, normalized);
    })
  );
  return result;
}
