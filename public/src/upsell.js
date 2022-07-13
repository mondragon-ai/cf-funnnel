console.log('started', localStorage);
// const startTimer = () => {

//     console.log('Timer Started. Shopify DRAFT_ORDER starts in 1000*30*1 minutes. ID: ', localStorage.getItem("FB_UUID"));

//     const f = localStorage.getItem("FB_UUID");

//     console.log('8 - Shopify DRAFT_ORDER starts in 1000*60*5 minutes: ', f);

//     // initiate Order 
//     fetch("http://127.0.0.1:8080/sendOrder", {
//         method: 'post',
//         body:    JSON.stringify({FB_UUID: f}),
//         headers: {
//             'Content-Type': 'application/json',
//         },
//     })
//     .then(r => r.json())
//     .then(json => json);

// };
// startTimer();

/**
 *  Call /addProduct from upsell-one
 */
$("#ADD_VIP").click(async function (e) { 
    e.preventDefault();
    const f = localStorage.getItem("FB_UUID");

    // initiate Order 
    await fetch("http://127.0.0.1:8080/addProduct", {
        method: 'post',
        body:    JSON.stringify({
            FB_UUID: f,
            product: {
                variant_id: 41271082451116,
                price: 900,
                quantity: 1,
                title: "Wrist Band"
            }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(r => r.json())
    .then(json => json);
    window.location.href="http://127.0.0.1:5500/public/congrats.html"

});
console.log('ended', localStorage);