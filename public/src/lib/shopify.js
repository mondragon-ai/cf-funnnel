console.log("PUBLIC - SHOPIFY.JS");

/**
 * Build & Instantiate Shopify Client
 * @param { domain, storefront }  
 * 
 */
 var client = ShopifyBuy.buildClient({
    domain: 'shophodgetwins.myshopify.com',
    storefrontAccessToken: '6acb860cfdb0d87b1f7ece385e7727f4'
});

/**
 * 
 * Create Checkout Instance & Store ID locally on run
 * @returns shopify checkout ID : String
 */
// ("#payment-form").addEventListener('submit', async (event) => {
//     event.preventDefault();

//     console.log("EVENT TWO STARTED ------------------ > ")

//     const {error} = await stripe.confirmSetup({
//         //`Elements` instance that was used to create the Payment Element
//         elements,
//         confirmParams: {
//             return_url: 'http://127.0.0.1:5500/public/upsell.html',
//         }
//     });

//     if (error) {
//         // This point will only be reached if there is an immediate error when
//         // confirming the payment. Show error to your customer (for example, payment
//         // details incomplete)
//         const messageContainer = document.querySelector('#error-message');
//         messageContainer.textContent = error.message;
//     } else {
//         // Your customer will be redirected to your `return_url`. For some payment
//         // methods like iDEAL, your customer will be redirected to an intermediate
//         // site first to authorize the payment, then redirected to the `return_url`.
//     }
// });
