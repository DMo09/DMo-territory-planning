export type AEType = 'commercial' | 'enterprise';
export type PlanStatus = 'draft' | 'complete';
export type Tier = 1 | 2 | 3;
export type PriorityBucket = 'big_bet' | 'win' | 'break_into';
export type AISignalStatus = 'pending' | 'searching' | 'found' | 'not_found' | 'error';

export interface TerritoryPlan {
  id: string;
  aeName: string;
  aeType: AEType;
  rsdName: string;
  rvpName: string;
  svpName: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  accounts?: Account[];
  prioritySelections?: PrioritySelection[];
  playSelections?: PlaySelection[];
}

export interface Account {
  id: string;
  territoryPlanId: string;
  // From upload
  accountName: string;
  accountOwner: string;
  companySize: string;
  customerSegment: string;
  billingState: string;
  industry: string;
  territory: string;
  userRegion: string;
  arr: number;
  arrCurrency: string;
  pipelineArr: number;
  pipelineArrCurrency: string;
  // Enriched
  annualRevenue: number | null;
  annualRevenueSource: string | null;
  annualRevenueConfidence: number | null;
  aiSignal: boolean | null;
  aiSignalSummary: string | null;
  aiSignalStatus: AISignalStatus;
  aiSignalSearchedAt: string | null;
  // Computed
  tier: Tier | null;
  normalizedIndustry: string;
}

export interface PrioritySelection {
  id: string;
  territoryPlanId: string;
  accountId: string;
  account?: Account;
  bucket: PriorityBucket;
  notes: string;
}

export interface Play {
  id: string;
  name: string;
  description: string;
  recommendedIndustries: string[];
  recommendedTiers: Tier[];
  isActive: boolean;
}

export interface PlaySelection {
  id: string;
  territoryPlanId: string;
  playId: string;
  play?: Play;
  notes: string;
}

export interface IndustryConfig {
  id: string;
  name: string;
  isTarget: boolean;
}

export interface TierSummary {
  tier1: number;
  tier2: number;
  tier3: number;
  pending: number;
  total: number;
}

export interface UploadPreview {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  columnMapping: ColumnMapping;
}

export interface ColumnMapping {
  accountName: string;
  accountOwner: string;
  companySize: string;
  customerSegment: string;
  billingState: string;
  industry: string;
  territory: string;
  userRegion: string;
  arr: string;
  arrCurrency: string;
  pipelineArr: string;
  pipelineArrCurrency: string;
}
