import axios from 'axios';
import type {
  TerritoryPlan,
  Account,
  Play,
  IndustryConfig,
  PrioritySelection,
  PlaySelection,
  PriorityBucket,
  ColumnMapping,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: BASE_URL });

// Territory Plans
export const plansApi = {
  list: () => api.get<TerritoryPlan[]>('/plans').then(r => r.data),
  get: (id: string) => api.get<TerritoryPlan>(`/plans/${id}`).then(r => r.data),
  create: (data: Partial<TerritoryPlan>) =>
    api.post<TerritoryPlan>('/plans', data).then(r => r.data),
  update: (id: string, data: Partial<TerritoryPlan>) =>
    api.patch<TerritoryPlan>(`/plans/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/plans/${id}`).then(r => r.data),
};

// Upload
export const uploadApi = {
  uploadCsv: (planId: string, file: File, mapping: ColumnMapping) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    return api.post<{ count: number }>(`/plans/${planId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  uploadGoogleSheet: (planId: string, sheetUrl: string, mapping: ColumnMapping) =>
    api.post<{ count: number }>(`/plans/${planId}/upload-sheet`, { sheetUrl, mapping })
      .then(r => r.data),
  previewCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ headers: string[]; rows: Record<string, string>[]; totalRows: number }>(
      '/upload/preview',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },
};

// Accounts
export const accountsApi = {
  list: (planId: string, params?: {
    tier?: number;
    industry?: string;
    search?: string;
    aiSignal?: boolean;
    page?: number;
    pageSize?: number;
  }) => api.get<{ accounts: Account[]; total: number }>(`/plans/${planId}/accounts`, { params })
    .then(r => r.data),

  update: (planId: string, accountId: string, data: Partial<Account>) =>
    api.patch<Account>(`/plans/${planId}/accounts/${accountId}`, data).then(r => r.data),

  // Enrichment
  searchRevenue: (planId: string, accountId: string) =>
    api.post<Account>(`/plans/${planId}/accounts/${accountId}/search-revenue`).then(r => r.data),

  searchAiSignal: (planId: string, accountId: string) =>
    api.post<Account>(`/plans/${planId}/accounts/${accountId}/search-ai`).then(r => r.data),

  searchAiSignalBatch: (planId: string, accountIds: string[]) =>
    api.post(`/plans/${planId}/accounts/search-ai-batch`, { accountIds }).then(r => r.data),

  searchAiSignalNext50: (planId: string) =>
    api.post(`/plans/${planId}/accounts/search-ai-next50`).then(r => r.data),

  runEnrichment: (planId: string) =>
    api.post(`/plans/${planId}/enrich`).then(r => r.data),

  getSuggestions: (planId: string) =>
    api.get<{
      bigBets: Account[];
      win: Account[];
      breakInto: Account[];
      plays: Play[];
    }>(`/plans/${planId}/suggestions`).then(r => r.data),
};

// Priority selections
export const priorityApi = {
  list: (planId: string) =>
    api.get<PrioritySelection[]>(`/plans/${planId}/priorities`).then(r => r.data),
  add: (planId: string, accountId: string, bucket: PriorityBucket, notes = '') =>
    api.post<PrioritySelection>(`/plans/${planId}/priorities`, { accountId, bucket, notes })
      .then(r => r.data),
  update: (planId: string, id: string, data: Partial<PrioritySelection>) =>
    api.patch<PrioritySelection>(`/plans/${planId}/priorities/${id}`, data).then(r => r.data),
  remove: (planId: string, id: string) =>
    api.delete(`/plans/${planId}/priorities/${id}`).then(r => r.data),
};

// Play selections
export const playSelectionsApi = {
  list: (planId: string) =>
    api.get<PlaySelection[]>(`/plans/${planId}/play-selections`).then(r => r.data),
  add: (planId: string, playId: string, notes = '') =>
    api.post<PlaySelection>(`/plans/${planId}/play-selections`, { playId, notes }).then(r => r.data),
  update: (planId: string, id: string, data: Partial<PlaySelection>) =>
    api.patch<PlaySelection>(`/plans/${planId}/play-selections/${id}`, data).then(r => r.data),
  remove: (planId: string, id: string) =>
    api.delete(`/plans/${planId}/play-selections/${id}`).then(r => r.data),
};

// Admin
export const adminApi = {
  getIndustries: () => api.get<IndustryConfig[]>('/admin/industries').then(r => r.data),
  updateIndustry: (id: string, data: Partial<IndustryConfig>) =>
    api.patch<IndustryConfig>(`/admin/industries/${id}`, data).then(r => r.data),
  createIndustry: (data: Partial<IndustryConfig>) =>
    api.post<IndustryConfig>('/admin/industries', data).then(r => r.data),
  deleteIndustry: (id: string) =>
    api.delete(`/admin/industries/${id}`).then(r => r.data),

  getPlays: () => api.get<Play[]>('/admin/plays').then(r => r.data),
  createPlay: (data: Partial<Play>) =>
    api.post<Play>('/admin/plays', data).then(r => r.data),
  updatePlay: (id: string, data: Partial<Play>) =>
    api.patch<Play>(`/admin/plays/${id}`, data).then(r => r.data),
  deletePlay: (id: string) =>
    api.delete(`/admin/plays/${id}`).then(r => r.data),
};
