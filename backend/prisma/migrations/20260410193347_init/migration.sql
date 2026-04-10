-- CreateTable
CREATE TABLE "territory_plans" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aeName" TEXT NOT NULL,
    "aeType" TEXT NOT NULL DEFAULT 'commercial',
    "rsdName" TEXT NOT NULL DEFAULT '',
    "rvpName" TEXT NOT NULL DEFAULT '',
    "svpName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "territory_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "territoryPlanId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountOwner" TEXT NOT NULL DEFAULT '',
    "companySize" TEXT NOT NULL DEFAULT '',
    "customerSegment" TEXT NOT NULL DEFAULT '',
    "billingState" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT '',
    "territory" TEXT NOT NULL DEFAULT '',
    "userRegion" TEXT NOT NULL DEFAULT '',
    "arr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arrCurrency" TEXT NOT NULL DEFAULT 'USD',
    "pipelineArr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pipelineArrCurrency" TEXT NOT NULL DEFAULT 'USD',
    "annualRevenue" DOUBLE PRECISION,
    "annualRevenueSource" TEXT,
    "annualRevenueConfidence" DOUBLE PRECISION,
    "aiSignal" BOOLEAN,
    "aiSignalSummary" TEXT,
    "aiSignalStatus" TEXT NOT NULL DEFAULT 'pending',
    "aiSignalSearchedAt" TIMESTAMP(3),
    "tier" INTEGER,
    "normalizedIndustry" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priority_selections" (
    "id" TEXT NOT NULL,
    "territoryPlanId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "priority_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "play_selections" (
    "id" TEXT NOT NULL,
    "territoryPlanId" TEXT NOT NULL,
    "playId" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "play_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendedIndustries" TEXT[],
    "recommendedTiers" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isTarget" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "industry_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "priority_selections_territoryPlanId_accountId_bucket_key" ON "priority_selections"("territoryPlanId", "accountId", "bucket");

-- CreateIndex
CREATE UNIQUE INDEX "play_selections_territoryPlanId_playId_key" ON "play_selections"("territoryPlanId", "playId");

-- CreateIndex
CREATE UNIQUE INDEX "industry_configs_name_key" ON "industry_configs"("name");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_territoryPlanId_fkey" FOREIGN KEY ("territoryPlanId") REFERENCES "territory_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_selections" ADD CONSTRAINT "priority_selections_territoryPlanId_fkey" FOREIGN KEY ("territoryPlanId") REFERENCES "territory_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_selections" ADD CONSTRAINT "priority_selections_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_selections" ADD CONSTRAINT "play_selections_territoryPlanId_fkey" FOREIGN KEY ("territoryPlanId") REFERENCES "territory_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "play_selections" ADD CONSTRAINT "play_selections_playId_fkey" FOREIGN KEY ("playId") REFERENCES "plays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
