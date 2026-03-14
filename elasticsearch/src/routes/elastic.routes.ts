import * as express from 'express';
import {
  indexProduct,
  bulkIndexProducts,
  deleteProduct,
  searchProducts,
  autocomplete,
  SearchParams,
} from '../elastic/productService';
import { client } from '../elastic/client';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await client.ping();
    res.json({ status: 'ok' });
  } catch (error: unknown) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ES_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

router.post('/index-product', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product || typeof product !== 'object') {
      return res.status(400).json({ error: 'Invalid payload: product object is required' });
    }
    await indexProduct(product);
    res.json({ success: true, variantId: product.variant_id });
  } catch (error: unknown) {
    console.error('[ES] index-product error:', error);
    res.status(500).json({
      error: 'Indexing failed',
      ...(process.env.NODE_ENV !== 'production' && {
        details: String(error),
      }),
    });
  }
});

router.post('/index-products-bulk', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid payload: products array is required' });
    }
    if (products.length > 500) {
      return res.status(400).json({
        error: 'Max 500 products per bulk request. Use multiple batches.',
      });
    }
    const result = await bulkIndexProducts(products);
    res.json({ success: true, indexed: result.indexed, failed: result.failed });
  } catch (error: unknown) {
    console.error('[ES] index-products-bulk error:', error);
    res.status(500).json({
      error: 'Bulk indexing failed',
      ...(process.env.NODE_ENV !== 'production' && {
        details: String(error),
      }),
    });
  }
});

router.delete('/product/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;
    if (!variantId || !variantId.trim()) {
      return res.status(400).json({ error: 'variantId is required' });
    }
    const deleted = await deleteProduct(req.params.variantId);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found in index' });
    }
    res.json({ success: true });
  } catch (error: unknown) {
    console.error('[ES] delete product error:', error);
    res.status(500).json({
      error: 'Delete failed',
      ...(process.env.NODE_ENV !== 'production' && {
        details: String(error),
      }),
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const params = req.query as unknown as SearchParams;
    const result = await searchProducts(params);
    res.json(result);
  } catch (error: unknown) {
    console.error('[ES] search error:', error);
    res.status(500).json({
      error: 'Search failed',
      ...(process.env.NODE_ENV !== 'production' && {
        details: String(error),
      }),
    });
  }
});

router.get('/autocomplete', async (req, res) => {
  try {
    const { prefix } = req.query;
    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'prefix query parameter is required' });
    }
    const suggestions = await autocomplete(prefix as string);
    res.json({ suggestions });
  } catch (error: unknown) {
    console.error('[ES] autocomplete error:', error);
    res.status(500).json({
      error: 'Autocomplete failed',
      ...(process.env.NODE_ENV !== 'production' && {
        details: String(error),
      }),
    });
  }
});

export default router;
