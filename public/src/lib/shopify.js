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
