import { client } from './client';
import { velqipProductsIndex } from './indices';
import { PRODUCTS_INDEX } from './productService';

export async function createVelqipProductsIndex(): Promise<void> {
  const exists = await client.indices.exists({ index: PRODUCTS_INDEX });
  if (exists) {
    console.log(`${PRODUCTS_INDEX} index already exists. Skipping creation.`);
    return;
  }
  await client.indices.create({
    index: PRODUCTS_INDEX,
    ...velqipProductsIndex,
  });
  console.log(`${PRODUCTS_INDEX} index created successfully.`);
}

async function main(): Promise<void> {
  try {
    await createVelqipProductsIndex();
  } catch (error) {
    console.error(`Error creating ${PRODUCTS_INDEX} index:`, error);
    process.exitCode = 1;
  }
}

main();
