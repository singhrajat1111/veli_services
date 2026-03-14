import { createClient } from '@supabase/supabase-js';
import { bulkIndexProducts, VelqipProduct } from './productService';
import * as dotenv from 'dotenv';
import { checkElasticsearchConnection } from './client';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SYNC_RPC = process.env.SUPABASE_SYNC_RPC || 'get_denormalized_products';
const SYNC_BATCH_SIZE = Math.min(Math.max(Number(process.env.ES_SYNC_BATCH_SIZE || 100), 1), 1000);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function syncProducts(): Promise<void> {
  await checkElasticsearchConnection();
  const startTime = Date.now();

  const { data, error } = await supabase.rpc(SUPABASE_SYNC_RPC);
  if (error) throw error;
  if (!data || !Array.isArray(data)) {
    throw new Error('No data returned from Supabase RPC');
  }

  let totalIndexed = 0;
  let totalFailed = 0;
  let batch: VelqipProduct[] = [];
  for (let i = 0; i < data.length; i++) {
    batch.push(data[i] as VelqipProduct);
    if (batch.length === SYNC_BATCH_SIZE) {
      const result = await bulkIndexProducts(batch);
      totalIndexed += result.indexed;
      totalFailed += result.failed;
      console.log(`Indexed ${i + 1}/${data.length} products`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    const result = await bulkIndexProducts(batch);
    totalIndexed += result.indexed;
    totalFailed += result.failed;
    console.log(`Indexed final ${batch.length} products`);
  }
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Sync complete. Total: ${data.length} products in ${elapsed}s`);
  console.log(`✅ Indexed: ${totalIndexed} | ❌ Failed: ${totalFailed}`);
}

async function main(): Promise<void> {
  try {
    await syncProducts();
  } catch (error) {
    console.error('Sync failed:', error);
    process.exitCode = 1;
  }
}

main();
