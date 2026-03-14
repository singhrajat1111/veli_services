import * as dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import elasticRouter from './routes/elastic.routes';
import { checkElasticsearchConnection } from './elastic/client';

dotenv.config();

const PORT = Number(process.env.PORT || 8081);
const HOST = process.env.HOST || '0.0.0.0';
const ROUTE_PREFIX = process.env.ES_ROUTE_PREFIX || '/elastic';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await checkElasticsearchConnection();
    res.status(200).json({ service: 'elasticsearch-module', status: 'ok' });
  } catch (error) {
    res.status(500).json({ service: 'elasticsearch-module', status: 'error', error: String(error) });
  }
});

app.use(ROUTE_PREFIX, elasticRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

async function start(): Promise<void> {
  await checkElasticsearchConnection();
  app.listen(PORT, HOST, () => {
    console.log(`Elasticsearch module listening on http://${HOST}:${PORT}${ROUTE_PREFIX}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Elasticsearch module:', error);
  process.exit(1);
});
