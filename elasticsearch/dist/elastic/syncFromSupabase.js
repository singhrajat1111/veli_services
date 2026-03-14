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
exports.syncProducts = syncProducts;
const supabase_js_1 = require("@supabase/supabase-js");
const productService_1 = require("./productService");
const dotenv = __importStar(require("dotenv"));
const client_1 = require("./client");
dotenv.config();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SYNC_RPC = process.env.SUPABASE_SYNC_RPC || 'get_denormalized_products';
const SYNC_BATCH_SIZE = Math.min(Math.max(Number(process.env.ES_SYNC_BATCH_SIZE || 100), 1), 1000);
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase env variables');
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
async function syncProducts() {
    await (0, client_1.checkElasticsearchConnection)();
    const startTime = Date.now();
    const { data, error } = await supabase.rpc(SUPABASE_SYNC_RPC);
    if (error)
        throw error;
    if (!data || !Array.isArray(data)) {
        throw new Error('No data returned from Supabase RPC');
    }
    let totalIndexed = 0;
    let totalFailed = 0;
    let batch = [];
    for (let i = 0; i < data.length; i++) {
        batch.push(data[i]);
        if (batch.length === SYNC_BATCH_SIZE) {
            const result = await (0, productService_1.bulkIndexProducts)(batch);
            totalIndexed += result.indexed;
            totalFailed += result.failed;
            console.log(`Indexed ${i + 1}/${data.length} products`);
            batch = [];
        }
    }
    if (batch.length > 0) {
        const result = await (0, productService_1.bulkIndexProducts)(batch);
        totalIndexed += result.indexed;
        totalFailed += result.failed;
        console.log(`Indexed final ${batch.length} products`);
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Sync complete. Total: ${data.length} products in ${elapsed}s`);
    console.log(`✅ Indexed: ${totalIndexed} | ❌ Failed: ${totalFailed}`);
}
async function main() {
    try {
        await syncProducts();
    }
    catch (error) {
        console.error('Sync failed:', error);
        process.exitCode = 1;
    }
}
main();
