"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const express = require('express');
const cors = require('cors');
exports.app = express();
const index_1 = require("../index");
const index_2 = require("../index");
const firestore_1 = require("firebase/firestore");
const shopify_api_1 = __importDefault(require("@shopify/shopify-api"));
const SHOP_URL = 'shophodgetwins';
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const URL = `https://${SHOP_URL}.myshopify.com/admin/api/2022-04/`;
const HEADERS_ADMIN = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': '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'
};
exports.app.use(express.json());
exports.app.use(cors({ origin: true }));
/**
 * Build & Instantiate Shopify Client
 * @param { domain, storefront }
 *
 */
const shopifyClient = new shopify_api_1.default.Clients.Storefront('shophodgetwins.myshopify.com', '6acb860cfdb0d87b1f7ece385e7727f4');
/**
 * Test API Route
 */
exports.app.get('/test', async (req, res) => {
    res.status(200).json({ msg: "SUCCESS" });
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
    const paymentIntent = await index_2.stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card']
    });
    // Add a new document with a generated id.
    const docRef = await firestore_1.addDoc(firestore_1.collection(index_1.db, "users"), {
        STRIPE_UUID: customer.id,
        STRIPE_CART_UID: paymentIntent.id,
        STRIPE_CLENT_ID: paymentIntent.client_secret,
        SHOPIFY_CHECKOUT_ID: ""
    });
    res.json({ fbuid: docRef.id, clientSecret: paymentIntent.client_secret });
});
/**
 *  Add Email to Stripe/Shopify. Pull FB_UID from POST req to get doc
 *  @param { email, FB_UID } req.body
 */
exports.app.post('/addEmail', async (req, res) => {
    const { email, fbUID } = req.body;
    console.log("EMAIL: ", email);
    console.log("fbUID: ", fbUID);
    // Fetch the user/{user} doc frmo FB for Stripe/Shopify Cart/IDs
    const docRef = firestore_1.doc(index_1.db, "users", `${fbUID}`);
    const docSnap = await firestore_1.getDoc(docRef);
    // Make sure the doc exists.
    if (docSnap.exists()) {
        const userData = docSnap.data();
        // Update Stripe Cart
        const customer = await index_2.stripe.customers.update(`${userData.STRIPE_UUID}`, { email: `${email}` });
        // Add a new document with a generated id.
        await firestore_1.updateDoc(docRef, {
            email: `${email}`
        });
        res.status(200).json("SUCCESS");
    }
    else {
        res.status(400).json("FB REF DOC NOT FOUND");
    }
});
/**
 * Submit Shipping to FB. CC Info captured client side
 *  @param { ShippingAddress, FBUID } req
 */
exports.app.post('/handleSubmit', async (req, res) => {
    const { shippingAddress, fbUID } = req.body;
    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = firestore_1.doc(index_1.db, "users", `${fbUID}`);
    const snapShot = await firestore_1.getDoc(docRef);
    const data = snapShot.data();
    if (snapShot.exists()) {
        // Add Shipping to FB
        await firestore_1.updateDoc(docRef, {
            shipping: {
                address: {
                    line1: `${shippingAddress.address.line1}`,
                    city: `${shippingAddress.address.city}`,
                    state: `${shippingAddress.address.province}`,
                    country: `${shippingAddress.address.country}`,
                    zip: `${shippingAddress.address.zip}`
                },
                name: `${shippingAddress.name}`
            },
            isReadyToCharge: true,
            email: `${data.email}`,
            SHOPIFY_CHECKOUT_ID: ""
        });
        res.status(200).json({ Msg: "SUCCESS: Shiping added to Firebase" });
    }
    else {
        res.status(400).json("FIREBASE: ID Doesn't exist");
    }
});
/**
 * Handle Checkout for Shopify between Stripe
 *  @param { FBUID } req
 */
exports.app.post('/checkout', async (req, res) => {
    const { FB_UUID } = req.body;
    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = firestore_1.doc(index_1.db, "users", `${FB_UUID}`);
    const snapShot = await firestore_1.getDoc(docRef);
    const data = snapShot.data();
    // Get Customer Paymenth Method ID
    // const paymentMethods = await stripe.paymentMethods.list({
    //     customer: data.STRIPE_UUID,
    //     type: 'card',
    // });
    if (snapShot.exists()) {
        async function checkStatus(r) {
            if (r.ok) { // res.status >= 200 && res.status < 300
                return r;
            }
            else if (r.status == 422) {
                const response = await node_fetch_1.default(URL + `/customers/search.json?query=email:"${data.email}"&fields=id,email`, {
                    method: 'get',
                    headers: HEADERS_ADMIN
                })
                    .then(res => res.json())
                    .then(jsonData => {
                    console.log("174: SUCCESS. The data is: ", jsonData);
                    return jsonData;
                })
                    .catch(e => console.log(e));
                return response;
            }
            else {
                res.status(400).json({ msg: "SHOPIFY: Unknonwn. See logs for more info." });
            }
        }
        const customerBody = {
            customer: {
                first_name: `${data.shipping.name}`,
                last_name: "",
                email: `${data.email}`,
                phone: "",
                addresses: [{
                        address1: `${data.shipping.address.line1}`,
                        city: `${data.shipping.address.city}`,
                        province: `${data.shipping.address.province}`,
                        phone: "",
                        zip: `${data.shipping.address.zip}`,
                        last_name: "",
                        first_name: `${data.shipping.name}`,
                        country: `${data.shipping.address.line1}`,
                    }]
            }
        };
        // const body = {
        //     customer: {
        //         email:`HenryBottle@fork.com`,
        //         first_name:`${data.shipping.name}`,
        //         last_name:""
        //     }
        // }
        const shopifyUuid = await node_fetch_1.default(URL + `customers.json`, {
            method: 'post',
            body: JSON.stringify(customerBody),
            headers: HEADERS_ADMIN
        })
            .then(res => checkStatus(res))
            .then(json => json);
        const order_data = {
            order: {
                line_items: [
                    {
                        variant_id: 41175550886060,
                        quantity: 1
                    }
                ],
                customer: {
                    id: shopifyUuid.customers[0].id // ! ADD user frmo above 
                }
            }
        };
        console.log("251: SUCCESS. The data is: ", shopifyUuid.customers[0].id);
        // const draftOrder = await fetch(URL + `orders.json`, {
        //     method: 'post',
        //     body: JSON.stringify(order_data),
        //     headers: HEADERS_ADMIN
        // })
        // .then(r =>  r.json())
        // .then(json => json)
        // console.log("252: SUCCESS. The data is: ", draftOrder);
        res.status(200).json({ msg: "SUCCESS: Stripe Paid", data: shopifyUuid });
        // try {
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: 1099,
        //         currency: 'usd',
        //         customer: data.STRIPE_UUID,
        //         payment_method: paymentMethods.data[0].id,
        //         off_session: true,
        //         confirm: true,
        //     });
        //     res.status(200).json({msg: "SUCCESS: Stripe Paid", data: paymentIntent});
        // } catch (err) {
        //     // Error code will be authentication_required if authentication is needed
        //     console.log('Error code is: ', err.code);
        //     const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
        //     console.log('PI retrieved: ', paymentIntentRetrieved.id);
        //     res.status(200).json(`STRIPE: Payment Error - ${err.code}`);
        // }
    }
    else {
    }
});
//# sourceMappingURL=funnel.js.map