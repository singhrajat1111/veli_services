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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const elastic_routes_1 = __importDefault(require("./routes/elastic.routes"));
const client_1 = require("./elastic/client");
dotenv.config();
const PORT = Number(process.env.PORT || 8081);
const HOST = process.env.HOST || '0.0.0.0';
const ROUTE_PREFIX = process.env.ES_ROUTE_PREFIX || '/elastic';
const app = (0, express_1.default)();
app.disable('x-powered-by');
app.use(express_1.default.json({ limit: '2mb' }));
app.get('/health', async (_req, res) => {
    try {
        await (0, client_1.checkElasticsearchConnection)();
        res.status(200).json({ service: 'elasticsearch-module', status: 'ok' });
    }
    catch (error) {
        res.status(500).json({ service: 'elasticsearch-module', status: 'error', error: String(error) });
    }
});
app.use(ROUTE_PREFIX, elastic_routes_1.default);
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});
async function start() {
    await (0, client_1.checkElasticsearchConnection)();
    app.listen(PORT, HOST, () => {
        console.log(`Elasticsearch module listening on http://${HOST}:${PORT}${ROUTE_PREFIX}`);
    });
}
start().catch((error) => {
    console.error('Failed to start Elasticsearch module:', error);
    process.exit(1);
});
