import e, { json, Request, Response } from "express";
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
const URL = `https://${SHOP_URL}.myshopify.com/admin/api/2022-07/`;

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
 *  Build & Instantiate Shopify Client
 *  @param { domain, storefront }  
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
 * @return { FB_UUID, CLIENT_SECRET } 
 */
app.get('/createScene', async (req: Request, res: Response) => { 

    try { 
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
            STRIPE_PI_UID: paymentIntent.id,
            STRIPE_CLIENT_ID: paymentIntent.client_secret,
            ORDER_STARTED: false,
        });
        res.status(200).json({m: "SUCCESS:  Stripe Customer/Intent Created & Firebase doc created.", FB_UUID: docRef.id, clientSecret: paymentIntent.client_secret});

    } catch (e) {
        res.status(400).json({m: "ERROR:  Stripe or Firebase", e: e});
    }
});

/**
 *  Add Email to Stripe/Shopify. Pull FB_UUID from POST req to get doc
 *  @param { email, FB_UUID } req.body
 */
app.post('/addEmail', async (req: Request, res: Response) => {
    const { email, fullName, FB_UUID } = req.body;

    // Fetch the user/{user} doc frmo FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const docSnap = await getDoc(docRef);

    // Make sure the doc exists.
    if (docSnap.exists()) {

        // Add a email with a generated FB_UUID
        await updateDoc(docRef, {
            email: `${fullName}`,
            name: email,
        });
        res.status(200).json({m: "SUCCESS: Update Firebase Doc."}); 

    } else {
        res.status(400).json({m: "FB REF DOC NOT FOUND"}); 
    }  
}); 

/**
 * Submit Shipping to FB. CC Info captured client side
 *  @param { ShippingAddress, FB_UUID, Product, bump } req
 */
app.post('/handleSubmit',  async (req: Request, res: Response) => {

    // Deconstruct the request body
    const { shippingAddress, FB_UUID, product, bump } = req.body;

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data()
    let b = bump ? 399 : 0

    if (snapShot.exists()) {

        // Check the status of the Shopify Create Customer Call
        async function checkStatus(r) {

            // If 200 >= x < 300, & return customer ID
            if (r.ok) { 

                const data = await r.json();
                const d = {
                    customers: [{
                        id: data.customer.id
                    }] 
                };
                // Return customer if created
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

                // Return the shopify UUID
                return response

            } else {
                // error
                res.status(400).json({msg: "SHOPIFY: Unknonwn. See logs for more info."})
            }
        }

        // Customer Data
        const customer_data = {
            customer:{
                first_name: data.name,
                last_name:"",
                email: data.email,
                phone:"",
                verified_email:true,
                addresses:[
                    {
                        address1:shippingAddress.address.line1,
                        city: shippingAddress.address.city,
                        province: shippingAddress.address.province,
                        phone: "",
                        zip: shippingAddress.address.zip,
                        last_name:"",
                        first_name: data.name,
                        country:"US",
                        country_name:"United States", 
                        default: true
                    }
                ]
            }
        };

        // Create New Customer OR search for existing on 422 status 
        const shopifyCustomer = await fetch(URL + `customers.json`, {
            method: 'post',
            body:    JSON.stringify(customer_data),
            headers: HEADERS_ADMIN
        })
        .then(res => checkStatus(res))
        .then(json => json);

        // Update Stripe Customer 
        await stripe.customers.update(
            data.STRIPE_UUID,
            {
                email: data.email,
                name: data.name,
                shipping: {
                    name:  data.name,
                    address: {
                        line1: shippingAddress.address.line1,
                        city: shippingAddress.address.city,
                        state: shippingAddress.address.province,
                        postal_code: shippingAddress.address.zip,
                        country: "US"
                    }
                }
            }
        );

        // Add Shipping & Shopify UUID to FB
        await updateDoc(docRef, {
            BUMP_OFFER: b, 
            line_items:[
                {
                    variant_id: product.variant_id,
                    quantity: 1,
                    price: product.price,
                    title: product.title
                }
            ],
            SHOPIFY_UUID: shopifyCustomer.customers[0].id,
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
            email: data.email
        });

        // Initiate the initial charge (LANDING PAGE)
        initialCharge(FB_UUID, product, b);
        res.status(200).json({m: "SUCCESS: Shipping added to Firebase & Stripe updated & Shopify."});

    } else {
        res.status(400).json("FIREBASE: ID Doesn't exist");
    }
});

/**
 *  Initialize the charge from event two
 *  @param FB_UUID 
 *  @param product 
 */
const initialCharge =  (FB_UUID, product, bump) => {

    setTimeout(async()=> {
        // create initial charge
        await fetch("http://127.0.0.1:8080/charge", {
                method: 'post',
                body:    JSON.stringify({
                    FB_UUID: FB_UUID,
                    product: product,
                    b: bump
                }),
                headers: HEADERS_ADMIN
            })
            .then(r => r.json())
            .then(json => json);
    }, 1500);

};

/**
 *  Charge the customer 
 *  @param { product, FB_UUID, b  } req
 *  @return 
 */
app.post('/charge', async (req: Request, res: Response) => {

    // get Product and FB_UUID
    const { product, FB_UUID, b } = req.body;

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data();
    const price = (product.price + b + 599);

    try {
        // Get Customer Paymenth Method ID
        const paymentMethods = await stripe.paymentMethods.list({
            customer: data.STRIPE_UUID,
            type: 'card',
        });

        // Make the initial Stripe charge based on product price
        const paymentIntent = await stripe.paymentIntents.create({
            amount: price,
            currency: 'usd',
            customer: data.STRIPE_UUID,
            payment_method: paymentMethods.data[0].id,
            off_session: true,
            confirm: true,
            receipt_email: data.email, 

        });

        // Add Shipping & Shopify UUID to FB
        await updateDoc(docRef, {
            SHOPIFY_CHECKOUT_ID: paymentMethods.data[0].id
        });

        if (data.ORDER_STARTED) {
            // Send headers success
            res.status(200).json({m: "SUCCESS: Sripe succesffuly charged customer.", d: paymentIntent, started: data.ORDER_STARTED});

        } else {
            sendOrder(FB_UUID);
        }
        

    } catch (err) {
        // Error code will be authentication_required if authentication is needed
        console.log('291 - Error code is: ', err.code);
        const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
        console.log('293 - PI retrieved: ', paymentIntentRetrieved.id);
        // Send errors
        res.status(400).json(`STRIPE: Payment Error - ${err.code}`);
    }
});


/**
 *  Create Draft Order in 1000*60*5 minutes
 *  @param FB_UUID
 */
 const sendOrder =  (FB_UUID: string) => {

    console.log('327 - Shopify DRAFT_ORDER starts in 1000*60*1 minutes: ', FB_UUID);
    setTimeout(()=> {

        console.log('330 - Shopify DRAFT_ORDER called: ', FB_UUID);
        const f = FB_UUID;
    
        // initiate Order 
        fetch("http://127.0.0.1:8080/sendOrder", {
            method: 'post',
            body:    JSON.stringify({FB_UUID: f}),
            headers: HEADERS_ADMIN
        })
        .then(r => r.json())
        .then(json => json);

    }, 1000*60*1);

};

/**
 *  Create Shopify Order, Charge Stripe, COomplete Order on Success & send to conf page
 *  @param { FB_UUID } req
 */
app.post('/sendOrder', async (req: Request, res: Response) => { 

    console.log('349 - Shopify DRAFT_ORDER Created');

    // Get FB_UUID
    const { FB_UUID } = req.body;

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data();

    if (snapShot.exists()) {

        // Prevent order from repeating 
        await updateDoc(docRef, {
            ORDER_STARTED: true
        });
        
        // Order Data (SHOPIFY)
        const draft_order_data = {
            draft_order:{
                line_items: await cartToOrder(data),
                customer:{
                    id: data.SHOPIFY_UUID
                },
                use_customer_default_address:true,
                tags: "CUSTOM_CLICK_FUNNEL",
                shipping_line: {
                    custom: "STANDARD_SHIPPING",
                    price: 5.99,
                    title: "Standard Shipping"
                }
            }
        };

        setTimeout( async () => {
            // Create Order & Get Price
            const shopify_order = await fetch(URL + `draft_orders.json`, {
                method: 'post',
                body: JSON.stringify(draft_order_data),
                headers: HEADERS_ADMIN
            })
            .then(r =>  r.json()) 
            .then(json => json);

            // Complete Draft Order --> Order
            completeOrder(shopify_order.draft_order.id);

        }, 1000*60*1);

        res.status(200).json({msg: `SUCCESS: Shopify draft order created.`});
    
    } else {
        res.status(400).json({msg: `FIREBASE: Database error.`});
    }
});

/**
 *  Complete Draft Order --> Order
 *  @param draftID 
 */
const completeOrder = (draftID) => {

    console.log('414 - Shopify DRAFT_ORDER Complete: ', draftID);

    // Check the status of the Shopify Create Customer Call
    async function checkStatus(r) {

        // If 200 >= x < 300, & return customer ID
        if (r.ok) { 
            console.log('392 - Shopify SUCCESS: ', r);
            return  await r.json()
        } else { 
            console.log('398 - Shopify: ', r);            
            return await r.json();
        } 
    };

    // Complete Order
    const shopify_order = fetch(URL + `draft_orders/${draftID}/complete.json`, {
        method: 'put',
        headers: HEADERS_ADMIN
    })
    .then(r =>  checkStatus(r))
    .then(json => json);
};

/**
 *  Add prodct to FB Doc cart
 *  @param { product, FB_UUID } req
 */
app.post('/addProduct', async (req: Request, res: Response) => {

    // Deconstruct product
    const { FB_UUID, product } = req. body;
    console.log(FB_UUID, product)

    // Decostruct Product = { P_UID, QTY } 
    const { variant_id, quantity, price, title } = product;

    // Fetch FB doc for FB_UUID
    const docRef = doc(db, 'users', FB_UUID); 
    const snapShot = await getDoc(docRef)
    const data = snapShot.data();
    const { line_items } = data

    try {

        // If no line items already exist add
        if (!line_items) {
            await updateDoc(docRef, {
                line_items: [
                    {
                        title: title,
                        price: price,
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
                    title: title,
                    price: price,
                    variant_id: variant_id,
                    quantity: quantity
                }
            ]
        });

        // Once added make the charge
        await fetch("http://127.0.0.1:8080/charge", {
            method: 'post',
            body:    JSON.stringify({
                FB_UUID: FB_UUID, 
                product: product,
                b: 0
            }),
            headers: HEADERS_ADMIN
        })
        .then(r => r.json())
        .then(json => json);

        res.status(200).json({m: "SUCCESS: Product Added to FB cart in refDoc. 💯", FB_UUID: FB_UUID, product: product})

    } catch (e) {
        res.status(400).json({m: "FIREBASE ERROR: Problem adding cart. 💯", e: e})
 
    }
});

/**
 *   
 *  @param FB_DOC 
 *  @returns cart[product] || []
 */
const cartToOrder =  (FB_DOC) => {

    console.log('470 - Shopify: ', FB_DOC);

    // Create vars
    const { line_items } = FB_DOC
    const ln = line_items.length
    var cart = []

    if (ln == 0 ) { 
        // return empty []
        console.log('477 - Shopify: ', cart);
        return cart
     } else {
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
        return cart
    }
}



 