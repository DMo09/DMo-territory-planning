import prisma from './client';

const TARGET_INDUSTRIES = [
  { name: 'Banking', isTarget: true },
  { name: 'Insurance', isTarget: true },
  { name: 'Manufacturing', isTarget: true },
  { name: 'Healthcare', isTarget: true },
  { name: 'Technology', isTarget: false },
  { name: 'Retail', isTarget: false },
  { name: 'Energy', isTarget: false },
  { name: 'Government', isTarget: false },
];

const STARTER_PLAYS = [
  {
    name: 'AI Transformation Play',
    description: 'Target companies publicly investing in AI/ML initiatives. Show how OutSystems accelerates AI-enabled app development at scale, reducing time-to-value by 10x compared to traditional development.',
    recommendedIndustries: ['Banking', 'Insurance', 'Manufacturing', 'Healthcare'],
    recommendedTiers: [1, 2],
    isActive: true,
  },
  {
    name: 'Legacy Modernization Play',
    description: 'Target companies burdened by aging legacy systems. Position OutSystems as the fastest path to modernizing core systems without the risk and cost of a full rip-and-replace.',
    recommendedIndustries: ['Banking', 'Insurance', 'Manufacturing'],
    recommendedTiers: [1, 2],
    isActive: true,
  },
  {
    name: 'Citizen Developer / Hyperautomation Play',
    description: 'Help IT teams scale delivery by enabling business users to build apps. Reduce the app development backlog and enable automation of manual workflows across the enterprise.',
    recommendedIndustries: ['Manufacturing', 'Healthcare', 'Insurance'],
    recommendedTiers: [1, 2, 3],
    isActive: true,
  },
  {
    name: 'New Logo Land Play',
    description: 'Target net-new accounts with a proof-of-concept (POC) offer. Identify a high-value use case, deliver a 4-week POC, and convert to a platform deal.',
    recommendedIndustries: ['Banking', 'Insurance', 'Manufacturing', 'Healthcare'],
    recommendedTiers: [2],
    isActive: true,
  },
  {
    name: 'Platform Expansion Play',
    description: 'Expand existing OutSystems footprint from one department to enterprise-wide. Map all current use cases and identify the next 3 high-value opportunities for platform growth.',
    recommendedIndustries: ['Banking', 'Insurance', 'Manufacturing', 'Healthcare'],
    recommendedTiers: [1],
    isActive: true,
  },
];

async function seed() {
  console.log('Seeding database...');

  for (const ind of TARGET_INDUSTRIES) {
    await prisma.industryConfig.upsert({
      where: { name: ind.name },
      update: { isTarget: ind.isTarget },
      create: ind,
    });
  }
  console.log(`Seeded ${TARGET_INDUSTRIES.length} industries`);

  for (const play of STARTER_PLAYS) {
    const existing = await prisma.play.findFirst({ where: { name: play.name } });
    if (!existing) {
      await prisma.play.create({ data: play });
    }
  }
  console.log(`Seeded ${STARTER_PLAYS.length} plays`);

  console.log('Done!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
