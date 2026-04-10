import { Router, Request } from 'express';
import prisma from '../db/client';

interface PlanParams { planId: string }

const router = Router({ mergeParams: true });

router.get('/', async (req: Request<PlanParams>, res) => {
  const sels = await prisma.prioritySelection.findMany({
    where: { territoryPlanId: req.params.planId },
    include: { account: true },
  });
  res.json(sels);
});

router.post('/', async (req: Request<PlanParams>, res) => {
  const { accountId, bucket, notes = '' } = req.body;
  if (!accountId || !bucket) return res.status(400).json({ error: 'accountId and bucket required' });

  const LIMITS: Record<string, number> = { big_bet: 3, win: 10, break_into: 25 };
  const count = await prisma.prioritySelection.count({
    where: { territoryPlanId: req.params.planId, bucket },
  });
  if (count >= (LIMITS[bucket] || 99)) {
    return res.status(400).json({ error: `Maximum ${LIMITS[bucket]} selections for ${bucket}` });
  }

  const sel = await prisma.prioritySelection.create({
    data: { territoryPlanId: req.params.planId, accountId, bucket, notes },
    include: { account: true },
  });
  res.status(201).json(sel);
});

router.patch('/:id', async (req: Request<PlanParams & { id: string }>, res) => {
  const sel = await prisma.prioritySelection.update({
    where: { id: req.params.id },
    data: { notes: req.body.notes },
    include: { account: true },
  });
  res.json(sel);
});

router.delete('/:id', async (req: Request<{ id: string }>, res) => {
  await prisma.prioritySelection.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
