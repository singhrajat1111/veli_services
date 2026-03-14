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
exports.client = void 0;
exports.checkElasticsearchConnection = checkElasticsearchConnection;
const elasticsearch_1 = require("@elastic/elasticsearch");
const dotenv = __importStar(require("dotenv"));
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
exports.client = new elasticsearch_1.Client({
    node: ES_URL,
    ...(auth ? { auth } : {}),
});
async function checkElasticsearchConnection() {
    try {
        await exports.client.ping();
        console.log(`[ES] Connected successfully → ${ES_URL}`);
    }
    catch (error) {
        console.error(`[ES] Connection failed → ${ES_URL}`, error);
        throw new Error(`Elasticsearch unreachable at ${ES_URL}`);
    }
}
