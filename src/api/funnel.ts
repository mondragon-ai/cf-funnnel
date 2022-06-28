import { Request, Response } from "express";
const express = require('express');
const cors = require('cors');
export const app = express();
import {db} from '../index'
import { stripe } from "../index";
import { collection, addDoc, getDoc, doc, updateDoc, getDocs } from "firebase/firestore"; 
import Shopify from "@shopify/shopify-api";

app.use( express.json());
app.use( cors({origin:true}));

/**
 * Build & Instantiate Shopify Client
 * @param { domain, storefront }  
 * 
 */
 const shopifyClient = new Shopify.Clients.Storefront(
    'shophodgetwins.myshopify.com',
    '6acb860cfdb0d87b1f7ece385e7727f4'
 );

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

    // Shopify Cart
    const cart = await shopifyClient.query({
        data: `mutation cartCreate {
            cartCreate(input: {
                attributes: { key: "cart_attribute", value: "This is a cart attribute" }
            }) {
                cart {
                    id
                    createdAt
                    updatedAt
                    attributes {
                        key
                        value
                    }
                    cost {
                        totalAmount {
                        amount
                        currencyCode
                        }
                        subtotalAmount {
                        amount
                        currencyCode
                        }
                        totalTaxAmount {
                        amount
                        currencyCode
                        }
                        totalDutyAmount {
                        amount
                        currencyCode
                        }
                    }
                    buyerIdentity {
                        customer {
                            id
                        }
                    }
                }

                userErrors {
                    field
                    message
                }
            }
        }`,
    }).then(e => e);
    
    // Add a new document with a generated id.
    const docRef = await addDoc(collection(db, "users"), {
        STRIPE_UUID: customer.id,
        STRIPE_CART_UID: paymentIntent.id,
        STRIPE_CLENT_ID: paymentIntent.client_secret,
        SHOPIFY_CART_ID: cart.body.data.cartCreate.cart.id
    });

    res.json({fbuid: docRef.id, clientSecret: paymentIntent.client_secret, shopifyCart: cart.body.data.cartCreate.cart.id});
});

app.post('/addEmail', async (req: Request, res: Response) => {
    const { email, fbUID } = req.body;

    console.log("EMAIL: ", email);
    console.log("fbUID: ", fbUID);

    // Fetch the user/{user} doc frmo FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${fbUID}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const userData  = docSnap.data();

        // Update Stripe Cart
        const customer = await stripe.customers.update(
            `${userData.STRIPE_UUID}`, 
            {email: `${email}`}
        );

        // Update Shopify Cart
        const shopifyCart = await shopifyClient.query({
            data:`
            mutation {
                cartBuyerIdentityUpdate(buyerIdentity: {
                email: "${email}"
                }, cartId: "${userData.SHOPIFY_CART_ID}") {
                cart {
                    id
                    checkoutUrl
                    createdAt
                    updatedAt
                }
                }
            }`
        }).then(response => response);

        // Add a new document with a generated id.
        await updateDoc(docRef, {
            email: `${email}`
        });
        
        res.status(200).json("SUCCESS"); 

    } else { 

        res.status(400).json("FB REF DOC NOT FOUND"); 

    }
        
}); 

app.post('/handleSubmit',  async (req: Request, res: Response) => {
    const { shippingAddress, fbUID} = req.body;

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${fbUID}`);

    // TODO: Add Shipping to FB
    await updateDoc(docRef, {
        shipping: {
            address: {
                line1: `${shippingAddress.address.line1}`,
                city:  `${shippingAddress.address.city}`,
                state:  `${shippingAddress.address.province}`,
                country:  `${shippingAddress.address.country}`,
                zip:  `${shippingAddress.address.zip}`
            },
            name:  `${shippingAddress.name}`
        },
        isReadyToCharge: true
    })

    res.status(200).json("Succesfully added Shiping to Firebase")

});

app.get('/checkout', async (req: Request, res: Response) => {

    res.status(200).json("Sold ");
})


