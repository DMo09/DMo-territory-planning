import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import prisma from './client';

// Mapping from CSV headers to model fields
const INDUSTRY_ALIASES: Record<string, string> = {
  'computer & technology': 'Technology',
  'retail & wholesale': 'Retail',
  'manufacturing': 'Manufacturing',
  'healthcare': 'Healthcare',
  'construction/ engineering': 'Construction/Engineering',
  'corporate (business) services': 'Business Services',
  'advertising/media/publishing': 'Media/Publishing',
  'transportation & logistics': 'Transportation',
  'consumer, food & beverage': 'Consumer/Food',
  'telecommunications': 'Telecommunications',
  'insurance': 'Insurance',
  'banking': 'Banking',
  'energy & utilities': 'Energy',
};

function normalizeIndustry(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return INDUSTRY_ALIASES[lower] || raw.trim();
}

function parseAmount(val: string): number {
  if (!val) return 0;
  // Strip currency symbols (€, $, £), commas, spaces
  const cleaned = val.replace(/[€$£,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function importCsv(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  console.log(`Parsed ${rows.length} rows`);

  // Group by Account Owner
  const byOwner = new Map<string, typeof rows>();
  for (const row of rows) {
    const owner = row['Account Owner']?.trim() || 'Unknown';
    if (!byOwner.has(owner)) byOwner.set(owner, []);
    byOwner.get(owner)!.push(row);
  }

  console.log(`Found ${byOwner.size} unique AE(s): ${[...byOwner.keys()].join(', ')}`);

  for (const [aeName, aeRows] of byOwner) {
    // Check if plan already exists for this AE, if so delete and re-create
    const existing = await prisma.territoryPlan.findFirst({ where: { aeName } });
    if (existing) {
      await prisma.territoryPlan.delete({ where: { id: existing.id } });
      console.log(`Deleted existing plan for ${aeName}`);
    }

    // Create territory plan
    const plan = await prisma.territoryPlan.create({
      data: {
        aeName,
        aeType: 'commercial',
        rsdName: '',
        rvpName: '',
        svpName: '',
        status: 'draft',
      },
    });

    console.log(`Created plan for ${aeName} (id: ${plan.id})`);

    // Import accounts in chunks
    const CHUNK = 50;
    let imported = 0;
    for (let i = 0; i < aeRows.length; i += CHUNK) {
      const chunk = aeRows.slice(i, i + CHUNK);
      await prisma.account.createMany({
        data: chunk.map(row => {
          const rawIndustry = row['Industry'] || '';
          const normalizedIndustry = normalizeIndustry(rawIndustry);
          const arr = parseAmount(row['ARR (max) (converted)']);
          const pipelineArr = parseAmount(row['Pipeline - ARR (converted)']);

          return {
            territoryPlanId: plan.id,
            accountName: row['Account Name'] || '',
            accountOwner: row['Account Owner'] || '',
            companySize: row['Company Size'] || '',
            customerSegment: row['Customer Segment'] || '',
            billingState: row['Billing State/Province'] || '',
            industry: rawIndustry,
            normalizedIndustry,
            territory: row['Territory'] || '',
            userRegion: row['User Region'] || '',
            arr,
            arrCurrency: row['ARR (max) (converted) Currency'] || 'USD',
            pipelineArr,
            pipelineArrCurrency: row['Pipeline - ARR (converted) Currency'] || 'USD',
            // Tiering deferred — no revenue data yet, AI signal not run
            tier: null,
            aiSignalStatus: 'pending',
          };
        }),
      });
      imported += chunk.length;
    }

    console.log(`  Imported ${imported} accounts for ${aeName}`);
  }

  // Print summary
  const totalPlans = await prisma.territoryPlan.count();
  const totalAccounts = await prisma.account.count();
  console.log(`\nDone! ${totalPlans} plan(s), ${totalAccounts} account(s) in DB.`);

  // Show industry breakdown for first plan
  const firstPlan = await prisma.territoryPlan.findFirst();
  if (firstPlan) {
    const accounts = await prisma.account.findMany({ where: { territoryPlanId: firstPlan.id } });
    const byIndustry = accounts.reduce((acc: Record<string, number>, a) => {
      acc[a.normalizedIndustry || a.industry] = (acc[a.normalizedIndustry || a.industry] || 0) + 1;
      return acc;
    }, {});
    console.log(`\nIndustry breakdown for ${firstPlan.aeName}:`);
    Object.entries(byIndustry)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ind, count]) => console.log(`  ${ind}: ${count}`));

    const withArr = accounts.filter(a => a.arr > 0);
    console.log(`\n  Accounts with ARR > 0: ${withArr.length}`);
    console.log(`  Accounts with no ARR (prospects): ${accounts.length - withArr.length}`);
  }
}

const csvPath = process.argv[2] || '/tmp/accounts.csv';
importCsv(csvPath)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
