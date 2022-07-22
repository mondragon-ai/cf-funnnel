"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartToOrder = exports.completeOrder = exports.sendOrder = exports.initialCharge = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const api_1 = require("../api");
const functions = __importStar(require("firebase-functions"));
/**
 *  Create an intial charge to the user from the landing page
 * @param FB_UUID
 * @param product
 * @param bump
 */
exports.initialCharge = (FB_UUID, product, bump) => {
    console.log("HELPER FUNCITONS: ", FB_UUID);
    setTimeout(() => {
        console.log("HELPER FUNCITONS - inside: ", FB_UUID);
        // Fetch INternally
        node_fetch_1.default("https://us-central1-shopify-recharge-352914.cloudfunctions.net/funnelAPI/customers/charge", {
            method: "POST",
            body: JSON.stringify({
                FB_UUID: FB_UUID,
                product: product,
                b: bump
            }),
            headers: {
                "Content-Type": "application/json",
            }
        })
            .then(resp => resp.json())
            .then(json => json);
    }, 2000);
};
/**
 *  Create Draft Order in 1000*60*5 minutes
 *  @param FB_UUID
 */
exports.sendOrder = (FB_UUID) => {
    functions.logger.log("\n\n\n\n\n#6 Send Order - Helper\n\n\n\n\n");
    console.log('36 - Shopify DRAFT_ORDER starts in 1000*60*1 minutes: ', FB_UUID);
    setTimeout(() => {
        functions.logger.log("\n\n\n\n\n#6 Send Order - Helper -- Inside Timer \n\n\n\n\n");
        console.log('38 - Shopify DRAFT_ORDER called: ', FB_UUID);
        const f = FB_UUID;
        // initiate Order 
        node_fetch_1.default("https://us-central1-shopify-recharge-352914.cloudfunctions.net/funnelAPI/customers/createOrder", {
            method: 'post',
            body: JSON.stringify({ FB_UUID: f }),
            headers: {
                "Content-Type": "application/json",
            }
        })
            .then(r => r.json())
            .then(json => json);
    }, 1000 * 60 * 1);
};
/**
 *  Complete Draft Order --> Order
 *  @param draftID
 */
exports.completeOrder = (draftID) => {
    console.log('414 - Shopify DRAFT_ORDER Complete: ', draftID);
    // Check the status of the Shopify Create Customer Call
    async function checkStatus(r) {
        // If 200 >= x < 300, & return customer ID
        if (r.ok) {
            console.log('392 - Shopify SUCCESS: ', r);
            return await r.json();
        }
        else {
            console.log('398 - Shopify: ', r);
            return await r.json();
        }
    }
    ;
    // Complete Order
    node_fetch_1.default(URL + `draft_orders/${draftID}/complete.json`, {
        method: 'put',
        headers: api_1.HEADERS_ADMIN
    })
        .then(r => checkStatus(r))
        .then(json => json);
};
/**
 *  Get FB Document and Return Cart
 *  @param FB_DOC
 *  @returns cart[product] || []
 */
exports.cartToOrder = (FB_DOC) => {
    console.log('61 - helpers: ', FB_DOC);
    // Create vars
    const { line_items } = FB_DOC;
    const ln = line_items.length;
    var cart = [];
    if (ln == 0) {
        // return empty []
        console.log('477 - Shopify: ', cart);
        return cart;
    }
    else {
        // return cart[product]
        console.log('480 - Shopify: ', cart);
        for (var i = 0; i < ln; i++) {
            cart = [
                ...cart,
                {
                    variant_id: line_items[i].variant_id,
                    quantity: line_items[i].quantity
                }
            ];
        }
        return cart;
    }
    ;
};
//# sourceMappingURL=helper.js.map