import { Router, Request } from 'express';
import prisma from '../db/client';

interface PlanParams { planId: string }

const router = Router({ mergeParams: true });

router.get('/', async (req: Request<PlanParams>, res) => {
  const sels = await prisma.playSelection.findMany({
    where: { territoryPlanId: req.params.planId },
    include: { play: true },
  });
  res.json(sels);
});

router.post('/', async (req: Request<PlanParams>, res) => {
  const { playId, notes = '' } = req.body;
  if (!playId) return res.status(400).json({ error: 'playId required' });

  const count = await prisma.playSelection.count({
    where: { territoryPlanId: req.params.planId },
  });
  if (count >= 5) return res.status(400).json({ error: 'Maximum 5 plays' });

  const sel = await prisma.playSelection.create({
    data: { territoryPlanId: req.params.planId, playId, notes },
    include: { play: true },
  });
  res.status(201).json(sel);
});

router.patch('/:id', async (req: Request<{ id: string }>, res) => {
  const sel = await prisma.playSelection.update({
    where: { id: req.params.id },
    data: { notes: req.body.notes },
    include: { play: true },
  });
  res.json(sel);
});

router.delete('/:id', async (req: Request<{ id: string }>, res) => {
  await prisma.playSelection.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
