import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import prisma from '../db/client';
import { normalizeIndustryBatch } from '../services/industryNorm';
import { recomputeAllTiers } from '../services/tiering';
import { getCompanyRevenue } from '../services/enrichment/index';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

interface ColumnMapping {
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

function parseRows(rows: Record<string, string>[], mapping: ColumnMapping) {
  return rows
    .filter(row => row[mapping.accountName]?.trim())
    .map(row => ({
      accountName: row[mapping.accountName]?.trim() || '',
      accountOwner: row[mapping.accountOwner]?.trim() || '',
      companySize: row[mapping.companySize]?.trim() || '',
      customerSegment: row[mapping.customerSegment]?.trim() || '',
      billingState: row[mapping.billingState]?.trim() || '',
      industry: row[mapping.industry]?.trim() || '',
      territory: row[mapping.territory]?.trim() || '',
      userRegion: row[mapping.userRegion]?.trim() || '',
      arr: parseFloat(row[mapping.arr]?.replace(/[^0-9.-]/g, '') || '0') || 0,
      arrCurrency: row[mapping.arrCurrency]?.trim() || 'USD',
      pipelineArr: parseFloat(row[mapping.pipelineArr]?.replace(/[^0-9.-]/g, '') || '0') || 0,
      pipelineArrCurrency: row[mapping.pipelineArrCurrency]?.trim() || 'USD',
    }));
}

async function importRows(planId: string, rows: ReturnType<typeof parseRows>) {
  // Normalize industries in batch
  const rawIndustries = [...new Set(rows.map(r => r.industry))];
  const industryMap = await normalizeIndustryBatch(rawIndustries);

  // Delete existing accounts for this plan before reimport
  await prisma.account.deleteMany({ where: { territoryPlanId: planId } });

  // Batch insert in chunks of 100
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await prisma.account.createMany({
      data: chunk.map(r => ({
        territoryPlanId: planId,
        ...r,
        normalizedIndustry: industryMap.get(r.industry) || r.industry,
      })),
    });
  }

  // Kick off tier computation (without AI signal initially)
  await recomputeAllTiers(planId);

  return rows.length;
}

// Preview CSV (no plan needed)
router.post('/preview', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const rows = parse(req.file.buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  res.json({
    headers,
    rows: rows.slice(0, 5),
    totalRows: rows.length,
  });
});

// Preview Google Sheet
router.post('/preview-sheet', async (req, res) => {
  const { sheetUrl } = req.body;
  if (!sheetUrl) return res.status(400).json({ error: 'sheetUrl required' });

  try {
    // Extract sheet ID and convert to CSV export URL
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid Google Sheets URL' });

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await axios.get(csvUrl, { timeout: 15000, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const rows = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    res.json({ headers, rows: rows.slice(0, 5), totalRows: rows.length });
  } catch {
    res.status(400).json({ error: 'Could not load Google Sheet. Make sure it is publicly viewable.' });
  }
});

// Upload CSV to plan
router.post('/plans/:planId/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const mapping: ColumnMapping = JSON.parse(req.body.mapping || '{}');
  if (!mapping.accountName) return res.status(400).json({ error: 'Column mapping required' });

  const rows = parse(req.file.buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const parsed = parseRows(rows, mapping);
  const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
  const count = await importRows(planId, parsed);
  res.json({ count });
});

// Upload Google Sheet to plan
router.post('/plans/:planId/upload-sheet', async (req, res) => {
  const { sheetUrl, mapping }: { sheetUrl: string; mapping: ColumnMapping } = req.body;
  if (!sheetUrl || !mapping?.accountName) {
    return res.status(400).json({ error: 'sheetUrl and mapping required' });
  }

  try {
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid Google Sheets URL' });

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await axios.get(csvUrl, { timeout: 15000, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const rows = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const parsed = parseRows(rows, mapping);
    const count = await importRows(req.params.planId, parsed);
    res.json({ count });
  } catch {
    res.status(400).json({ error: 'Failed to import Google Sheet' });
  }
});

export default router;
