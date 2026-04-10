import { Router } from 'express';
import prisma from '../db/client';

const router = Router();

// List all plans
router.get('/', async (_req, res) => {
  const plans = await prisma.territoryPlan.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(plans);
});

// Get one plan
router.get('/:id', async (req, res) => {
  const plan = await prisma.territoryPlan.findUnique({ where: { id: req.params.id } });
  if (!plan) return res.status(404).json({ error: 'Not found' });
  res.json(plan);
});

// Create plan
router.post('/', async (req, res) => {
  const { aeName, aeType, rsdName, rvpName, svpName } = req.body;
  if (!aeName) return res.status(400).json({ error: 'aeName is required' });

  const plan = await prisma.territoryPlan.create({
    data: {
      aeName,
      aeType: aeType || 'commercial',
      rsdName: rsdName || '',
      rvpName: rvpName || '',
      svpName: svpName || '',
    },
  });
  res.status(201).json(plan);
});

// Update plan
router.patch('/:id', async (req, res) => {
  const { aeName, aeType, rsdName, rvpName, svpName, status } = req.body;
  const plan = await prisma.territoryPlan.update({
    where: { id: req.params.id },
    data: {
      ...(aeName !== undefined && { aeName }),
      ...(aeType !== undefined && { aeType }),
      ...(rsdName !== undefined && { rsdName }),
      ...(rvpName !== undefined && { rvpName }),
      ...(svpName !== undefined && { svpName }),
      ...(status !== undefined && { status }),
    },
  });
  res.json(plan);
});

// Delete plan
router.delete('/:id', async (req, res) => {
  await prisma.territoryPlan.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
