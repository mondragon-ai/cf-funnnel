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
    const { email, fullName, fbUID } = req.body;

    // Fetch the user/{user} doc frmo FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${fbUID}`);
    const docSnap = await getDoc(docRef);
    const userData  = docSnap.data();

    // Make sure the doc exists.
    if (docSnap.exists()) {

        // // Update Stripe customer
        // await stripe.customers.update(
        //     `${userData.STRIPE_UUID}`, 
        //     {email: `${email}`}
        // );

        // Add a email with a generated FB_UUID
        await updateDoc(docRef, {
            email: `${fullName}`,
            name: email,
        });
        res.status(200).json("SUCCESS"); 

    } else {
        res.status(400).json("FB REF DOC NOT FOUND"); 
    }  
}); 

/**
 * Submit Shipping to FB. CC Info captured client side
 *  @param { ShippingAddress, FBUID, Product } req
 */
app.post('/handleSubmit',  async (req: Request, res: Response) => {
    const { shippingAddress, fbUID, product } = req.body;

    // const product = {
    //     variant_id: 41513672474796,
    //     price: 3400
    // }

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${fbUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data()

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
                }
                console.log('135 - SHOPIFY: ', d)
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

                console.log('149 - SHOPIFY: ', response);
                console.log('150 - SHOPIFY: ', data);

                // Return the shopify UUID
                return response

            } else {
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
        }

        // Create New Customer OR search for existing on 422 status 
        const shopifyCustomer = await fetch(URL + `customers.json`, {
            method: 'post',
            body:    JSON.stringify(customer_data),
            headers: HEADERS_ADMIN
        })
        .then(res => checkStatus(res))
        .then(json => json);
        console.log('193 - SHOPIFY: ', shopifyCustomer);

        // Update Customer 
        const customer = await stripe.customers.update(
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
        console.log('213 - STRIPE: ', customer);

        // Add Shipping & Shopify UUID to FB
        await updateDoc(docRef, {
            line_items:[
                {
                    variant_id: product.variant_id,
                    quantity: 1
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

        initialCharge(fbUID, product);

        res.status(200).json({Msg: "SUCCESS: Shiping added to Firebase"})

    } else {
        res.status(400).json("FIREBASE: ID Doesn't exist")

    }
});

const initialCharge =  (fbUID, product) => {

    setTimeout(async()=> {

        await fetch("http://127.0.0.1:8080/charge", {
                method: 'post',
                body:    JSON.stringify({
                    FB_UUID: fbUID,
                    product: product
                }),
                headers: HEADERS_ADMIN
            })
            .then(r => r.json())
            .then(json => json);
    }, 1500)

};

app.post('/charge', async (req: Request, res: Response) => {

    const { product, FB_UUID} = req.body;

    console.log('274 - /CHARGE: ', product);


    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data()

    // Get Customer Paymenth Method ID
    const paymentMethods = await stripe.paymentMethods.list({
        customer: data.STRIPE_UUID,
        type: 'card',
    });

    console.log('288 - STRIPE: ', paymentMethods);


    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: product.price,
            currency: 'usd',
            customer: data.STRIPE_UUID,
            payment_method: paymentMethods.data[0].id,
            off_session: true,
            confirm: true,
            receipt_email: data.email, 

        });

        console.log('303 - STRIPE: ', paymentIntent);

        // Add Shipping & Shopify UUID to FB
        await updateDoc(docRef, {
            SHOPIFY_CHECKOUT_ID: paymentMethods.data[0].id
        });


        // Send Order
        await fetch("http://127.0.0.1:8080/sendOrder", {
            method: 'post',
            body:    JSON.stringify({FB_UUID: FB_UUID}),
            headers: HEADERS_ADMIN
        })
        .then(r => r.json())
        .then(json => json);

        res.status(200).json({m: "SUCCESS! ", d: paymentIntent})

    } catch (err) {
        // Error code will be authentication_required if authentication is needed
        console.log('291 - Error code is: ', err.code);
        const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
        console.log('293 - PI retrieved: ', paymentIntentRetrieved.id);
        res.status(400).json(`STRIPE: Payment Error - ${err.code}`);
    }

    res.status(200).json({m: "SUCCESS! "})
});

/**
 *  Create Shopify Order, Charge Stripe, COomplete Order on Success & send to conf page
 *  @param { FB_UUID } req
 */
app.post('/sendOrder', async (req: Request, res: Response) => { 

    const { FB_UUID } = req.body;
    console.log('338 - /SEND_ORDER: ', FB_UUID);

    // Fetch the user/{user} doc from FB for Stripe/Shopify Cart/IDs
    const docRef = doc(db, "users", `${FB_UUID}`);
    const snapShot = await getDoc(docRef);
    const data = snapShot.data()

    if (snapShot.exists()) {
        
        console.log('340 - /SEND_ORDER: ', data);

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
        }

        // Create Order & Get Price
        const shopify_order = await fetch(URL + `draft_orders.json`, {
            method: 'post',
            body: JSON.stringify(draft_order_data),
            headers: HEADERS_ADMIN
        })
        .then(r =>  r.json())
        .then(json => json);

        console.log('375 - Shopify: ', shopify_order);

        sendOrder(shopify_order.draft_order.id);
    
    } else {
        res.status(400).json({msg: `FIREBASE: Database error.`});
    }
});

const sendOrder =  (draftID) => {

    console.log('386 - Shopify DRANF_ORDER: ', draftID);

    // Check the status of the Shopify Create Customer Call
    async function checkStatus(r) {

        // If 200 >= x < 300, & return customer ID
        if (r.ok) { 
            console.log('392 - Shopify SUCCESS: ', r);

            return  r.json()

        } else { 

            console.log('398 - Shopify: ', r);
            
            return r.json();

        } 
    };

    setTimeout(async()=> {

        // Complete Order
        const shopify_order = await fetch(URL + `draft_orders/${draftID}/complete.json`, {
            method: 'put',
            headers: HEADERS_ADMIN
        })
        .then(r =>  checkStatus(r))
        .then(json => json);

    }, 1500)

};

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

    console.log('470 - Shopify: ', FB_DOC);

    const { line_items } = FB_DOC
    const ln = line_items.length
    var cart = []

    if (ln == 0 ) { 
        console.log('477 - Shopify: ', cart);
        return cart
     } else {
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



