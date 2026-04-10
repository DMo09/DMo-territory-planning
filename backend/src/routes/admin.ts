import { Router } from 'express';
import prisma from '../db/client';
import { invalidateTierCache } from '../services/tiering';

const router = Router();

// Industries
router.get('/industries', async (_req, res) => {
  const industries = await prisma.industryConfig.findMany({ orderBy: { name: 'asc' } });
  res.json(industries);
});

router.post('/industries', async (req, res) => {
  const { name, isTarget = true } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const ind = await prisma.industryConfig.create({ data: { name, isTarget } });
  invalidateTierCache();
  res.status(201).json(ind);
});

router.patch('/industries/:id', async (req, res) => {
  const { isTarget } = req.body;
  const ind = await prisma.industryConfig.update({
    where: { id: req.params.id },
    data: { isTarget },
  });
  invalidateTierCache();
  res.json(ind);
});

router.delete('/industries/:id', async (req, res) => {
  await prisma.industryConfig.delete({ where: { id: req.params.id } });
  invalidateTierCache();
  res.json({ ok: true });
});

// Plays
router.get('/plays', async (_req, res) => {
  const plays = await prisma.play.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(plays);
});

router.post('/plays', async (req, res) => {
  const { name, description, recommendedIndustries = [], recommendedTiers = [], isActive = true } = req.body;
  if (!name || !description) return res.status(400).json({ error: 'name and description required' });

  const play = await prisma.play.create({
    data: { name, description, recommendedIndustries, recommendedTiers, isActive },
  });
  res.status(201).json(play);
});

router.patch('/plays/:id', async (req, res) => {
  const { name, description, recommendedIndustries, recommendedTiers, isActive } = req.body;
  const play = await prisma.play.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(recommendedIndustries !== undefined && { recommendedIndustries }),
      ...(recommendedTiers !== undefined && { recommendedTiers }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.json(play);
});

router.delete('/plays/:id', async (req, res) => {
  await prisma.play.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
