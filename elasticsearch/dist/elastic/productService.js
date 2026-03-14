"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTS_INDEX = void 0;
exports.indexProduct = indexProduct;
exports.bulkIndexProducts = bulkIndexProducts;
exports.deleteProduct = deleteProduct;
exports.searchProducts = searchProducts;
exports.autocomplete = autocomplete;
const client_1 = require("./client");
exports.PRODUCTS_INDEX = process.env.ES_PRODUCTS_INDEX || 'velqip_products';
function getFirstString(value) {
    if (typeof value === 'string')
        return value.trim();
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        return value[0].trim();
    }
    return undefined;
}
function toNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    const str = getFirstString(value);
    if (!str)
        return fallback;
    const parsed = Number(str);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function toBoolean(value, fallback) {
    if (typeof value === 'boolean')
        return value;
    const str = getFirstString(value);
    if (!str)
        return fallback;
    const normalized = str.toLowerCase();
    if (['true', '1', 'yes'].includes(normalized))
        return true;
    if (['false', '0', 'no'].includes(normalized))
        return false;
    return fallback;
}
function sanitizeTextInput(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function buildSuggestInput(product) {
    const inputs = new Set();
    const candidates = [product.name, product.variant_name];
    for (const raw of candidates) {
        const value = sanitizeTextInput(raw);
        if (value)
            inputs.add(value);
    }
    return Array.from(inputs);
}
function normalizeProduct(product) {
    if (!product || typeof product !== 'object') {
        throw new Error('Invalid product payload');
    }
    if (!product.variant_id || typeof product.variant_id !== 'string') {
        throw new Error('variant_id is required and must be a string');
    }
    const normalized = { ...product };
    normalized.variant_id = product.variant_id.trim();
    if (!normalized.variant_id) {
        throw new Error('variant_id cannot be empty');
    }
    if (product.selling_price !== undefined) {
        normalized.selling_price = Number(product.selling_price);
    }
    if (product.available_stock !== undefined) {
        normalized.available_stock = Number(product.available_stock);
    }
    if (product.average_rating !== undefined) {
        normalized.average_rating = Number(product.average_rating);
    }
    if (product.units_sold !== undefined) {
        normalized.units_sold = Number(product.units_sold);
    }
    normalized.allergens = Array.isArray(product.allergens)
        ? product.allergens
        : product.allergens
            ? String(product.allergens).split(',').map((s) => s.trim()).filter(Boolean)
            : [];
    normalized.features = Array.isArray(product.features)
        ? product.features
        : product.features
            ? String(product.features).split(',').map((s) => s.trim()).filter(Boolean)
            : [];
    normalized.artificial_condiments = Array.isArray(product.artificial_condiments)
        ? product.artificial_condiments
        : product.artificial_condiments
            ? String(product.artificial_condiments).split(',').map((s) => s.trim()).filter(Boolean)
            : [];
    normalized.suggest = {
        input: buildSuggestInput(normalized),
        weight: Math.max(1, Math.floor(Number(normalized.units_sold || 1))),
    };
    return normalized;
}
function normalizeSearchParams(raw) {
    const page = Math.max(1, Math.floor(toNumber(raw.page, 1) || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(toNumber(raw.limit, 20) || 20)));
    const sortByInput = getFirstString(raw.sort_by);
    const sortOrderInput = getFirstString(raw.sort_order);
    return {
        q: sanitizeTextInput(getFirstString(raw.q)),
        category_id: sanitizeTextInput(getFirstString(raw.category_id)),
        vendor_id: sanitizeTextInput(getFirstString(raw.vendor_id)),
        is_veg: toBoolean(raw.is_veg),
        is_vegan: toBoolean(raw.is_vegan),
        is_gluten_free: toBoolean(raw.is_gluten_free),
        in_stock: toBoolean(raw.in_stock),
        min_price: toNumber(raw.min_price),
        max_price: toNumber(raw.max_price),
        min_rating: toNumber(raw.min_rating),
        min_calories: toNumber(raw.min_calories),
        max_calories: toNumber(raw.max_calories),
        min_protein: toNumber(raw.min_protein),
        max_protein: toNumber(raw.max_protein),
        new_arrival: toBoolean(raw.new_arrival),
        is_best_seller: toBoolean(raw.is_best_seller),
        page,
        limit,
        sort_by: sortByInput || 'relevance',
        sort_order: sortOrderInput || 'desc',
    };
}
function getSort(sortBy, sortOrder, q) {
    const order = sortOrder || 'desc';
    if (!sortBy || sortBy === 'relevance') {
        return q ? [{ _score: { order: 'desc' } }] : [{ updated_at: order }];
    }
    switch (sortBy) {
        case 'price':
            return [{ selling_price: order }, { _score: { order: 'desc' } }];
        case 'rating':
            return [{ average_rating: order }, { _score: { order: 'desc' } }];
        case 'latest':
            return [{ created_at: order }, { _score: { order: 'desc' } }];
        case 'popular':
            return [{ units_sold: order }, { _score: { order: 'desc' } }];
        default:
            return q ? [{ _score: { order: 'desc' } }] : [{ updated_at: order }];
    }
}
async function indexProduct(product) {
    const doc = normalizeProduct(product);
    await client_1.client.index({
        index: exports.PRODUCTS_INDEX,
        id: doc.variant_id,
        document: doc,
        refresh: 'wait_for',
    });
}
async function bulkIndexProducts(products) {
    if (!Array.isArray(products) || products.length === 0)
        return { indexed: 0, failed: 0 };
    const operations = [];
    for (const product of products) {
        const doc = normalizeProduct(product);
        operations.push({ index: { _index: exports.PRODUCTS_INDEX, _id: doc.variant_id } });
        operations.push(doc);
    }
    const response = await client_1.client.bulk({
        refresh: false,
        operations,
    });
    let failureCount = 0;
    let successCount = products.length;
    if (response.errors) {
        for (const item of response.items || []) {
            const action = item.index;
            if (action?.error) {
                failureCount += 1;
                console.error(`[ES] Bulk index failed for _id=${action._id || 'unknown'}: ${action.error.reason || 'unknown reason'}`);
            }
        }
        successCount = Math.max(products.length - failureCount, 0);
    }
    return { indexed: successCount, failed: failureCount };
}
async function deleteProduct(variantId) {
    if (!variantId || !variantId.trim()) {
        throw new Error('variantId is required');
    }
    try {
        await client_1.client.delete({
            index: exports.PRODUCTS_INDEX,
            id: variantId,
            refresh: 'wait_for',
        });
        return true;
    }
    catch (error) {
        const maybeStatus = error?.meta?.statusCode;
        if (maybeStatus === 404)
            return false;
        throw error;
    }
}
async function searchProducts(rawParams) {
    const params = normalizeSearchParams(rawParams);
    const from = (params.page - 1) * params.limit;
    const must = [];
    const filter = [];
    if (params.q) {
        must.push({
            multi_match: {
                query: params.q,
                fields: [
                    'name^4',
                    'variant_name^3',
                    'description^2',
                    'variant_description^2',
                    'features',
                    'allergens',
                ],
                type: 'best_fields',
                fuzziness: 'AUTO',
            },
        });
    }
    if (params.category_id)
        filter.push({ term: { category_id: params.category_id } });
    if (params.vendor_id)
        filter.push({ term: { vendor_id: params.vendor_id } });
    if (typeof params.is_veg === 'boolean')
        filter.push({ term: { is_veg: params.is_veg } });
    if (typeof params.is_vegan === 'boolean')
        filter.push({ term: { is_vegan: params.is_vegan } });
    if (typeof params.is_gluten_free === 'boolean')
        filter.push({ term: { is_gluten_free: params.is_gluten_free } });
    if (typeof params.new_arrival === 'boolean')
        filter.push({ term: { new_arrival: params.new_arrival } });
    if (typeof params.is_best_seller === 'boolean')
        filter.push({ term: { is_best_seller: params.is_best_seller } });
    if (params.in_stock)
        filter.push({ range: { available_stock: { gt: 0 } } });
    if (params.min_rating !== undefined)
        filter.push({ range: { average_rating: { gte: params.min_rating } } });
    if (params.min_price !== undefined || params.max_price !== undefined) {
        filter.push({
            range: {
                selling_price: {
                    ...(params.min_price !== undefined ? { gte: params.min_price } : {}),
                    ...(params.max_price !== undefined ? { lte: params.max_price } : {}),
                },
            },
        });
    }
    if (params.min_calories !== undefined || params.max_calories !== undefined) {
        filter.push({
            range: {
                calories: {
                    ...(params.min_calories !== undefined ? { gte: params.min_calories } : {}),
                    ...(params.max_calories !== undefined ? { lte: params.max_calories } : {}),
                },
            },
        });
    }
    if (params.min_protein !== undefined || params.max_protein !== undefined) {
        filter.push({
            range: {
                protein: {
                    ...(params.min_protein !== undefined ? { gte: params.min_protein } : {}),
                    ...(params.max_protein !== undefined ? { lte: params.max_protein } : {}),
                },
            },
        });
    }
    const query = must.length === 0 && filter.length === 0
        ? { match_all: {} }
        : {
            bool: {
                ...(must.length > 0 ? { must } : {}),
                ...(filter.length > 0 ? { filter } : {}),
            },
        };
    const response = await client_1.client.search({
        index: exports.PRODUCTS_INDEX,
        query,
        from,
        size: params.limit,
        sort: getSort(params.sort_by, params.sort_order, params.q),
        track_total_hits: true,
    });
    const hits = response.hits.hits || [];
    const totalRaw = response.hits.total;
    const total = typeof totalRaw === 'number' ? totalRaw : totalRaw?.value || 0;
    return {
        items: hits.map((hit) => hit._source).filter((item) => Boolean(item)),
        total,
        page: params.page,
        limit: params.limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
        tookMs: response.took || 0,
    };
}
async function autocomplete(prefix, size = 8) {
    const normalized = sanitizeTextInput(prefix);
    if (!normalized)
        return [];
    const response = await client_1.client.search({
        index: exports.PRODUCTS_INDEX,
        suggest: {
            product_suggest: {
                prefix: normalized,
                completion: {
                    field: 'suggest',
                    skip_duplicates: true,
                    size: Math.min(Math.max(size, 1), 20),
                },
            },
        },
    });
    const suggestData = response.suggest;
    const options = suggestData?.product_suggest?.[0]?.options || [];
    return options
        .map((option) => option.text)
        .filter((text) => Boolean(text))
        .slice(0, size);
}
