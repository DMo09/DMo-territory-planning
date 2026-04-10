import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import plansRouter from './routes/plans';
import uploadRouter from './routes/upload';
import accountsRouter from './routes/accounts';
import prioritiesRouter from './routes/priorities';
import playSelectionsRouter from './routes/playSelections';
import adminRouter from './routes/admin';
import { WebSearchRevenueProvider } from './services/enrichment/webSearch';
import { setRevenueProvider } from './services/enrichment/index';

// Configure revenue provider (swap to Salesforce here in Phase 2)
setRevenueProvider(new WebSearchRevenueProvider());

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Routes
app.use('/api/plans', plansRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/plans/:planId/accounts', accountsRouter);
app.use('/api/plans/:planId/priorities', prioritiesRouter);
app.use('/api/plans/:planId/play-selections', playSelectionsRouter);
app.use('/api/admin', adminRouter);

// Upload routes that need planId context
app.post('/api/plans/:planId/upload', uploadRouter);
app.post('/api/plans/:planId/upload-sheet', uploadRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
