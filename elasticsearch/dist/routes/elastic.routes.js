"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const productService_1 = require("../elastic/productService");
const client_1 = require("../elastic/client");
const router = express.Router();
router.get('/health', async (req, res) => {
    try {
        await client_1.client.ping();
        res.json({ status: 'ok' });
    }
    catch (error) {
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
        await (0, productService_1.indexProduct)(product);
        res.json({ success: true, variantId: product.variant_id });
    }
    catch (error) {
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
        const result = await (0, productService_1.bulkIndexProducts)(products);
        res.json({ success: true, indexed: result.indexed, failed: result.failed });
    }
    catch (error) {
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
        const deleted = await (0, productService_1.deleteProduct)(req.params.variantId);
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found in index' });
        }
        res.json({ success: true });
    }
    catch (error) {
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
        const params = req.query;
        const result = await (0, productService_1.searchProducts)(params);
        res.json(result);
    }
    catch (error) {
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
        const suggestions = await (0, productService_1.autocomplete)(prefix);
        res.json({ suggestions });
    }
    catch (error) {
        console.error('[ES] autocomplete error:', error);
        res.status(500).json({
            error: 'Autocomplete failed',
            ...(process.env.NODE_ENV !== 'production' && {
                details: String(error),
            }),
        });
    }
});
exports.default = router;
