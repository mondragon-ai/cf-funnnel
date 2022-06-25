import { Request, Response } from "express";
const express = require('express');
const cors = require('cors');
export const app = express();
import {db} from '../index'
import { stripe } from "../index";
import { collection, addDoc } from "firebase/firestore"; 

app.use( express.json())
app.use( cors({origin:true}))

/**
 * Test API Route
 */
app.get('/test', (req: Request, res: Response) => {
    res.send('Hello World!');
});

/**
 * Create Scene 
 * @return { FB_UID, CLIENT_SECRET } 
 */
app.get('/createScene', async (req: Request, res: Response) => { 

    const customer = await stripe.customers.create({
        description: "CUSTOM CLICK FUNNEL",
    });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        customer: customer.id,
        setup_future_usage: 'off_session',
        amount: 1000,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
    });

    // Add a new document with a generated id.
    const docRef = await addDoc(collection(db, "users"), {
        STRIPE_UUID: customer.id,
        STRIPE_CART_UID: paymentIntent.id,
        STRIPE_CLENT_ID: paymentIntent.client_secret
    });

    res.json({fbuid: docRef.id, clientSecret: paymentIntent.client_secret})
})