import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

dotenv.config();

const ES_URL = process.env.ES_URL;
const ES_API_KEY = process.env.ES_API_KEY;
const ES_USERNAME = process.env.ES_USERNAME;
const ES_PASSWORD = process.env.ES_PASSWORD;

if (!ES_URL) {
  throw new Error('Missing ES_URL in environment variables');
}

const auth = ES_API_KEY
  ? { apiKey: ES_API_KEY }
  : ES_USERNAME && ES_PASSWORD
  ? { username: ES_USERNAME, password: ES_PASSWORD }
  : undefined;

export const client = new Client({
  node: ES_URL,
  ...(auth ? { auth } : {}),
});

export async function checkElasticsearchConnection(): Promise<void> {
  try {
    await client.ping();
    console.log(`[ES] Connected successfully → ${ES_URL}`);
  } catch (error) {
    console.error(`[ES] Connection failed → ${ES_URL}`, error);
    throw new Error(`Elasticsearch unreachable at ${ES_URL}`);
  }
}
