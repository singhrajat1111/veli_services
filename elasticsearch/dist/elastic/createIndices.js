"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVelqipProductsIndex = createVelqipProductsIndex;
const client_1 = require("./client");
const indices_1 = require("./indices");
const productService_1 = require("./productService");
async function createVelqipProductsIndex() {
    const exists = await client_1.client.indices.exists({ index: productService_1.PRODUCTS_INDEX });
    if (exists) {
        console.log(`${productService_1.PRODUCTS_INDEX} index already exists. Skipping creation.`);
        return;
    }
    await client_1.client.indices.create({
        index: productService_1.PRODUCTS_INDEX,
        ...indices_1.velqipProductsIndex,
    });
    console.log(`${productService_1.PRODUCTS_INDEX} index created successfully.`);
}
async function main() {
    try {
        await createVelqipProductsIndex();
    }
    catch (error) {
        console.error(`Error creating ${productService_1.PRODUCTS_INDEX} index:`, error);
        process.exitCode = 1;
    }
}
main();
