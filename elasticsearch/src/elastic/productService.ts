import { client } from './client';
import type {
  QueryDslQueryContainer,
  SortCombinations,
} from '@elastic/elasticsearch/lib/api/types';

export const PRODUCTS_INDEX = process.env.ES_PRODUCTS_INDEX || 'velqip_products';

export interface VelqipProduct {
  variant_id: string;
  product_id?: string;
  name?: string;
  variant_name?: string;
  description?: string;
  variant_description?: string;
  category_id?: string;
  vendor_id?: string;
  selling_price?: number;
  available_stock?: number;
  average_rating?: number;
  units_sold?: number;
  is_veg?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  new_arrival?: boolean;
  is_best_seller?: boolean;
  user_visibility?: string;
  created_at?: string;
  updated_at?: string;
  features?: string | string[];
  allergens?: string[] | string;
  artificial_condiments?: string[] | string;
  calories?: number;
  protein?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  carbohydrates?: number;
  sugar?: number;
  added_sugars?: number;
  dietary_fibre?: number;
  sodium?: number;
  cholesterol?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitamin_a?: number;
  vitamin_b?: number;
  vitamin_c?: number;
  serving_size?: string;
  measurement_type_unit?: string;
  nutrient_id?: string;
  barcode?: string;
  mrp?: number;
  weight?: number;
  weighing_unit?: string;
  stock_keeping_unit?: string;
  thumbnail_image?: string;
  total_reviews?: number;
  is_returnable?: boolean;
  is_taxable?: boolean;
  tax_method?: string;
  tax_amount?: number;
  [key: string]: unknown;
}

export interface SearchParams {
  q?: string;
  category_id?: string;
  vendor_id?: string;
  is_veg?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  in_stock?: boolean;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  min_calories?: number;
  max_calories?: number;
  min_protein?: number;
  max_protein?: number;
  new_arrival?: boolean;
  is_best_seller?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'relevance' | 'price' | 'rating' | 'latest' | 'popular';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult {
  items: VelqipProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  tookMs: number;
}

type QueryValue = string | string[] | number | boolean | undefined;
interface NormalizedSearchParams {
  q?: string;
  category_id?: string;
  vendor_id?: string;
  is_veg?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  in_stock?: boolean;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  min_calories?: number;
  max_calories?: number;
  min_protein?: number;
  max_protein?: number;
  new_arrival?: boolean;
  is_best_seller?: boolean;
  page: number;
  limit: number;
  sort_by: NonNullable<SearchParams['sort_by']>;
  sort_order: NonNullable<SearchParams['sort_order']>;
}

function getFirstString(value: QueryValue): string | undefined {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0].trim();
  }
  return undefined;
}

function toNumber(value: QueryValue, fallback?: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const str = getFirstString(value);
  if (!str) return fallback;
  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: QueryValue, fallback?: boolean): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const str = getFirstString(value);
  if (!str) return fallback;
  const normalized = str.toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return fallback;
}

function sanitizeTextInput(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildSuggestInput(product: VelqipProduct): string[] {
  const inputs = new Set<string>();
  const candidates = [product.name, product.variant_name];
  for (const raw of candidates) {
    const value = sanitizeTextInput(raw as string | undefined);
    if (value) inputs.add(value);
  }
  return Array.from(inputs);
}

function normalizeProduct(product: VelqipProduct): VelqipProduct {
  if (!product || typeof product !== 'object') {
    throw new Error('Invalid product payload');
  }
  if (!product.variant_id || typeof product.variant_id !== 'string') {
    throw new Error('variant_id is required and must be a string');
  }

  const normalized: VelqipProduct = { ...product };
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

function normalizeSearchParams(raw: SearchParams | Record<string, QueryValue>): NormalizedSearchParams {
  const page = Math.max(1, Math.floor(toNumber(raw.page, 1) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(toNumber(raw.limit, 20) || 20)));
  const sortByInput = getFirstString(raw.sort_by) as SearchParams['sort_by'];
  const sortOrderInput = getFirstString(raw.sort_order) as SearchParams['sort_order'];

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

function getSort(
  sortBy: SearchParams['sort_by'],
  sortOrder: SearchParams['sort_order'],
  q?: string,
): SortCombinations[] {
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

export async function indexProduct(product: VelqipProduct): Promise<void> {
  const doc = normalizeProduct(product);
  await client.index({
    index: PRODUCTS_INDEX,
    id: doc.variant_id,
    document: doc,
    refresh: 'wait_for',
  });
}

export async function bulkIndexProducts(products: VelqipProduct[]): Promise<{ indexed: number; failed: number }> {
  if (!Array.isArray(products) || products.length === 0) return { indexed: 0, failed: 0 };

  const operations: unknown[] = [];
  for (const product of products) {
    const doc = normalizeProduct(product);
    operations.push({ index: { _index: PRODUCTS_INDEX, _id: doc.variant_id } });
    operations.push(doc);
  }

  const response = await client.bulk({
    refresh: false,
    operations,
  });

  let failureCount = 0;
  let successCount = products.length;
  if (response.errors) {
    for (const item of response.items || []) {
      const action = (item as { index?: { _id?: string; error?: { reason?: string } } }).index;
      if (action?.error) {
        failureCount += 1;
        console.error(
          `[ES] Bulk index failed for _id=${action._id || 'unknown'}: ${action.error.reason || 'unknown reason'}`,
        );
      }
    }
    successCount = Math.max(products.length - failureCount, 0);
  }

  return { indexed: successCount, failed: failureCount };
}

export async function deleteProduct(variantId: string): Promise<boolean> {
  if (!variantId || !variantId.trim()) {
    throw new Error('variantId is required');
  }

  try {
    await client.delete({
      index: PRODUCTS_INDEX,
      id: variantId,
      refresh: 'wait_for',
    });
    return true;
  } catch (error: unknown) {
    const maybeStatus = (error as { meta?: { statusCode?: number } })?.meta?.statusCode;
    if (maybeStatus === 404) return false;
    throw error;
  }
}

export async function searchProducts(rawParams: SearchParams | Record<string, QueryValue>): Promise<SearchResult> {
  const params = normalizeSearchParams(rawParams);
  const from = (params.page - 1) * params.limit;

  const must: QueryDslQueryContainer[] = [];
  const filter: QueryDslQueryContainer[] = [];

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

  if (params.category_id) filter.push({ term: { category_id: params.category_id } });
  if (params.vendor_id) filter.push({ term: { vendor_id: params.vendor_id } });
  if (typeof params.is_veg === 'boolean') filter.push({ term: { is_veg: params.is_veg } });
  if (typeof params.is_vegan === 'boolean') filter.push({ term: { is_vegan: params.is_vegan } });
  if (typeof params.is_gluten_free === 'boolean') filter.push({ term: { is_gluten_free: params.is_gluten_free } });
  if (typeof params.new_arrival === 'boolean') filter.push({ term: { new_arrival: params.new_arrival } });
  if (typeof params.is_best_seller === 'boolean') filter.push({ term: { is_best_seller: params.is_best_seller } });
  if (params.in_stock) filter.push({ range: { available_stock: { gt: 0 } } });
  if (params.min_rating !== undefined) filter.push({ range: { average_rating: { gte: params.min_rating } } });
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

  const query: QueryDslQueryContainer =
    must.length === 0 && filter.length === 0
      ? { match_all: {} }
      : {
          bool: {
            ...(must.length > 0 ? { must } : {}),
            ...(filter.length > 0 ? { filter } : {}),
          },
        };

  const response = await client.search<VelqipProduct>({
    index: PRODUCTS_INDEX,
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
    items: hits.map((hit) => hit._source).filter((item): item is VelqipProduct => Boolean(item)),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
    tookMs: response.took || 0,
  };
}

export async function autocomplete(prefix: string, size = 8): Promise<string[]> {
  const normalized = sanitizeTextInput(prefix);
  if (!normalized) return [];

  const response = await client.search({
    index: PRODUCTS_INDEX,
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

  const suggestData = response.suggest as
    | { product_suggest?: Array<{ options?: Array<{ text?: string }> }> }
    | undefined;

  const options = suggestData?.product_suggest?.[0]?.options || [];
  return options
    .map((option) => option.text)
    .filter((text): text is string => Boolean(text))
    .slice(0, size);
}
