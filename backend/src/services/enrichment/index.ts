export interface RevenueResult {
  annualRevenue: number | null;
  source: string;
  confidence: number; // 0-1
}

export interface RevenueProvider {
  getRevenue(companyName: string): Promise<RevenueResult>;
}

// Registry — swap out providers without changing business logic
let activeProvider: RevenueProvider;

export function setRevenueProvider(provider: RevenueProvider) {
  activeProvider = provider;
}

export async function getCompanyRevenue(companyName: string): Promise<RevenueResult> {
  if (!activeProvider) {
    throw new Error('No revenue provider configured');
  }
  return activeProvider.getRevenue(companyName);
}
