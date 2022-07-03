import { json, Request, Response } from "express";
import fetch from 'node-fetch';
const express = require('express');
const cors = require('cors');
export const app = express();
import {db} from '../index'
import { stripe } from "../index";
import { collection, addDoc, getDoc, doc, updateDoc, getDocs } from "firebase/firestore"; 
import Shopify from "@shopify/shopify-api";
const SHOP_URL = 'shophodgetwins'; 
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const URL = `https://${SHOP_URL}.myshopify.com/admin/api/2022-04/`;

// Admin Headers 
const HEADERS_ADMIN = { 
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN 
}

// Add middleware to handle json
app.use( express.json());
// Make cross origin
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
app.get('/test', async (req: Request, res: Response) => {
    res.status(200).json({msg: "SUCCESS"})
});

/**
 * Create Scene 
 * @return { FB_UID, CLIENT_SECRET } 
 */
app.get('/createScene', async (req: Request, res: Response) => { 

    // Create Stripe Customer
    const customer = await stripe.customers.create({
        description: "CUSTOM CLICK FUNNEL",
    });

    // Create a SetUp Intent to get client side secrete key
    const paymentIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card']
    });
    
    // Add a new document with a generated id.
    const docRef = await addDoc(collection(db, "users"), {
        STRIPE_UUID: customer.id,
        STRIPE_CART_UID: paymentIntent.id,
        STRIPE_CLENT_ID: paymentIntent.client_secret,
        SHOPIFY_CHECKOUT_ID: ""
    });

    res.json({fbuid: docRef.id, clientSecret: paymentIntent.client_secret});
});

/**
 *  Add Email to Stripe/Shopify. Pull FB_UID from POST req to get doc
 *  @param { email, FB_UID } req.body
 */
app.post('/addEmail', async (req: Request, res: Response) => {
    const { email, fbUID } = req.body;

    // Fetch the user/{user} doc frmo FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${fbUID}`);
    const docSnap = await getDoc(docRef);
    const userData  = docSnap.data();

    // Make sure the doc exists.
    if (docSnap.exists()) {

        // Update Stripe customer
        await stripe.customers.update(
            `${userData.STRIPE_UUID}`, 
            {email: `${email}`}
        );

        // Add a email with a generated FB_UUID
        await updateDoc(docRef, {
            email: `${email}`
        });
        res.status(200).json("SUCCESS"); 

    } else {
        res.status(400).json("FB REF DOC NOT FOUND"); 
    }  
}); 

/**
 * Submit Shipping to FB. CC Info captured client side
 *  @param { ShippingAddress, FBUID } req
 */
app.post('/handleSubmit',  async (req: Request, res: Response) => {
    const { shippingAddress, fbUID} = req.body;

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${fbUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data()

    if (snapShot.exists()) {
    
        // Add Shipping to FB
        await updateDoc(docRef, {
            shipping: {
                address: {
                    line1: `${shippingAddress.address.line1}`,
                    city:  `${shippingAddress.address.city}`,
                    state:  `${shippingAddress.address.province}`,
                    country:  "US",
                    zip:  `${shippingAddress.address.zip}`
                },
                name:  `${shippingAddress.name}`
            },
            isReadyToCharge: true,
            email: `${data.email}`,
            SHOPIFY_CHECKOUT_ID: ""
        })
        res.status(200).json({Msg: "SUCCESS: Shiping added to Firebase"})

    } else {
        res.status(400).json("FIREBASE: ID Doesn't exist")

    }
});

/**
 *  Create Shopify Order, Charge Stripe, COomplete Order on Success & send to conf page
 *  @param { FB_UUID } req
 */
app.post('/checkout', async (req: Request, res: Response) => { 

    const { FB_UUID } = req.body;

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data()

    if (snapShot.exists()) {

        // Get Customer Paymenth Method ID
        const paymentMethods = await stripe.paymentMethods.list({
            customer: data.STRIPE_UUID,
            type: 'card',
        });

        // Check the status of the Shopify Create Customer Call
        async function checkStatus(r) {

            // If 200 >= x < 300, & return customer ID
            if (r.ok) { 

                const data = await r.json();
                const d = {
                    customers: [{
                        id: data.customer.id
                    }] 
                }
                console.log('173 - SHOPIFY: ', d)
                return  d

            } else if ( r.status == 422 ) { 
                
                // If email is with an existing user search the email 
                const response = await fetch(URL + `customers/search.json?query=email:"${data.email}"&fields=id,email`, {
                    method: 'get',
                    headers: HEADERS_ADMIN
                })
                .then(res => res.json())
                .then(jsonData =>  jsonData )
                .catch(e => console.log(e)); 

                console.log('187 - SHOPIFY: ', response)

                // Return the shopify UUID
                return response

            } else {
                res.status(400).json({msg: "SHOPIFY: Unknonwn. See logs for more info."})
            }
        }

        // Customer Data
        const customer_data = {
            customer: {
                first_name: `${data.shipping.name}`,
                last_name:"",
                email: `${data.email}`,
                phone:"",
            }
        }

        // Create New Customer OR search for existing on 422 status 
        const shopifyUuid = await fetch(URL + `customers.json`, {
            method: 'post',
            body:    JSON.stringify(customer_data),
            headers: HEADERS_ADMIN
        })
        .then(res => checkStatus(res))
        .then(json => json);

         // Address Data
        const address_data = {
            address :{
                address1:`${data.shipping.address.line1}`,
                company: "",
                address2: "",//`${data.shipping.address.line1}`,
                city: `${data.shipping.address.city}`,
                province: `${data.shipping.address.state}`,
                phone: "",
                zip: `${data.shipping.address.zip}`,
                last_name: "",
                first_name:  `${data.shipping.name}`,
                country: "US", //`${data.shipping.address.line1}`,
                country_code: "US"
            }
        }

        // Add Address to existing customer (SHOPIFY)
        await fetch(URL + `customers/${shopifyUuid.customers[0].id}/addresses.json`, {
            method: 'post',
            body:    JSON.stringify(address_data),
            headers: HEADERS_ADMIN
        })
        .then(r => { return r.json() })
        .then(json => json);

        // ADD SHOPIFY UUID TO DATABASE
        await updateDoc(docRef, {
            SHOPIFY_UUID: shopifyUuid.customers[0].id
        })

        // Order Data (SHOPIFY)
        const order_data = {
            order:{
                line_items: cartToOrder(data),
                customer:{
                    id: shopifyUuid.customers[0].id 
                }
            }
        }

        // Create Order & Get Price
        const shopify_order = await fetch(URL + `orders.json`, {
            method: 'post',
            body: JSON.stringify(order_data),
            headers: HEADERS_ADMIN
        })
        .then(r =>  r.json())
        .then(json => json)

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: String(shopify_order.order.current_subtotal_price).replace(".", ""), // ! MAKE DYNAMIC FROM shopify_order
                currency: 'usd',
                customer: data.STRIPE_UUID,
                payment_method: paymentMethods.data[0].id,
                off_session: true,
                confirm: true,
                receipt_email: data.email, 

            });

            res.status(200).json({msg: "SUCCESS: Stripe Paid", data: paymentIntent});
    
        } catch (err) {
            // Error code will be authentication_required if authentication is needed
            console.log('291 - Error code is: ', err.code);
            const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
            console.log('293 - PI retrieved: ', paymentIntentRetrieved.id);
            res.status(400).json(`STRIPE: Payment Error - ${err.code}`);
        }

        res.status(200).json({msg: "SUCCESS: Stripe Paid", data: shopify_order});
    
    } else {
        res.status(400).json({msg: `FIREBASE: Database error.`});
    }
})

app.post('/addProduct', async (req: Request, res: Response) => {

    const { FB_UUID, Product } = req. body;

    console.log(FB_UUID, Product)

    // Decostruct Product = { P_UID, QTY } 
    const { variant_id, quantity } = Product;

    // Fetch FB doc for FB_UUID
    const docRef = doc(db, 'users', FB_UUID);
    const snapShot = await getDoc(docRef)
    const data = snapShot.data();
    const { line_items } = data

    try {

        if (!line_items) {
            await updateDoc(docRef, {
                line_items: [
                    {
                        variant_id: variant_id,
                        quantity: quantity
                    }
                ]
            })
        }

        // Update line_items: [{}]  
        await updateDoc(docRef, {
            line_items: [
                ...line_items, 
                {
                    variant_id: variant_id,
                    quantity: quantity
                }
            ]
        })
        res.status(200).json({m: "SUCCESS: Product Added to FB cart in refDoc. 💯", FB_UUID: FB_UUID, Product: Product})

    } catch (e) {
        res.status(400).json({m: "FIREBASE ERROR: Problem adding cart. 💯", e: e})
 
    }

});


const cartToOrder =  (FB_DOC) => {

    const { line_items } = FB_DOC
    const ln = line_items.length
    var cart = []

    if (ln == 0 ) { 
        return line_items
     } else {
        for (var i = 0; i < ln - 1; i++) {
            cart = [
                {
                    variant_id: line_items[i].variant_id,
                    quantity: line_items[i].quantity
                }
            ];
        }
        return cart
    }

}



