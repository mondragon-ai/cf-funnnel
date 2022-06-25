"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express = require('express');
const cors = require('cors');
exports.app = express();
const index_1 = require("../index");
const index_2 = require("../index");
const firestore_1 = require("firebase/firestore");
exports.app.use(express.json());
exports.app.use(cors({ origin: true }));
/**
 * Test API Route
 */
exports.app.get('/test', (req, res) => {
    res.send('Hello World!');
});
/**
 * Create Scene
 * @return { FB_UID, CLIENT_SECRET }
 */
exports.app.get('/createScene', async (req, res) => {
    const customer = await index_2.stripe.customers.create({
        description: "CUSTOM CLICK FUNNEL",
    });
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await index_2.stripe.paymentIntents.create({
        customer: customer.id,
        setup_future_usage: 'off_session',
        amount: 1000,
        currency: 'usd',
        automatic_payment_methods: {
            enabled: true,
        },
    });
    // Add a new document with a generated id.
    const docRef = await firestore_1.addDoc(firestore_1.collection(index_1.db, "users"), {
        STRIPE_UUID: customer.id,
        STRIPE_CART_UID: paymentIntent.id,
        STRIPE_CLENT_ID: paymentIntent.client_secret
    });
    res.json({ fbuid: docRef.id, clientSecret: paymentIntent.client_secret });
});
//# sourceMappingURL=funnel.js.map