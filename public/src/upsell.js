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

    $("#ADD_VIP").text("LOADING....");

    // initiate Order 
    await fetch("http://127.0.0.1:8080/addProduct", {
        method: 'post',
        body:    JSON.stringify({
            FB_UUID: f,
            product: {
                variant_id: 41271082451116,
                price: 900,
                quantity: 1,
                title: "LGB Wristband Pack"
            }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(r => r.json())
    .then(json => {
        // $("#ADD_VIP").text("YES! CLAIM MY FREE WRISTBANDS AND SIGN ME UP");
        window.location.href="http://127.0.0.1:5500/public/congrats.html"
        return json
    });

});



$("#DOWN_SELL_ONE").click( async (e) => {  
    e.preventDefault();
    const f = localStorage.getItem("FB_UUID");

    
  
    $("#DOWN_SELL_ONE").text("LOADING....");
    $("#DOWN_SELL_FOUR").text("LOADING....");
    $("#DOWN_SELL_THREE").text("LOADING....");
    $("#DOWN_SELL_TWO").text("LOADING....");
  
    // initiate Order 
    await fetch("http://127.0.0.1:8080/addProduct", {
        method: 'post',
        body:    JSON.stringify({
            FB_UUID: f,
            product: {
                variant_id: 41175576608940,
                price: 1200,
                quantity: 1,
                title: "Blue LGB Wristband"
            }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(r => r.json())
    .then(json => {
        // $("#ADD_VIP").text("YES! CLAIM MY FREE WRISTBANDS AND SIGN ME UP");
        window.location.href="http://127.0.0.1:5500/public/congrats.html"
        return json
    });
  
  });
  
  
  $("#DOWN_SELL_TWO").click( async (e) => {  
    e.preventDefault();
    const f = localStorage.getItem("FB_UUID");
  
    $("#DOWN_SELL_FOUR").text("LOADING....");
    $("#DOWN_SELL_THREE").text("LOADING....");
    $("#DOWN_SELL_TWO").text("LOADING....");
    $("#DOWN_SELL_ONE").text("LOADING....");
  
    // initiate Order 
    await fetch("http://127.0.0.1:8080/addProduct", {
        method: 'post',
        body:    JSON.stringify({
            FB_UUID: f,
            product: {
                variant_id: 41175576346796,
                price: 1200,
                quantity: 1,
                title: "Pink LGB Wristband"
            }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(r => r.json())
    .then(json => {
        // $("#ADD_VIP").text("YES! CLAIM MY FREE WRISTBANDS AND SIGN ME UP");
        window.location.href="http://127.0.0.1:5500/public/congrats.html"
        return json
    });
  
  });
  
  
  $("#DOWN_SELL_THREE").click( async (e) => {  
    e.preventDefault();
    const f = localStorage.getItem("FB_UUID");
  
    $("#DOWN_SELL_THREE").text("LOADING....");
    $("#DOWN_SELL_TWO").text("LOADING....");
    $("#DOWN_SELL_ONE").text("LOADING....");
  
    // initiate Order 
    await fetch("http://127.0.0.1:8080/addProduct", {
        method: 'post',
        body:    JSON.stringify({
            FB_UUID: f,
            product: {
                variant_id: 41175576838316,
                price: 1200,
                quantity: 1,
                title: "White LGB Wristband"
            }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(r => r.json())
    .then(json => {
        // $("#ADD_VIP").text("YES! CLAIM MY FREE WRISTBANDS AND SIGN ME UP");
        window.location.href="http://127.0.0.1:5500/public/congrats.html"
        return json
    });
  
  });
  
  
  $("#DOWN_SELL_FOUR").click( async (e) => {  
    e.preventDefault();
    const f = localStorage.getItem("FB_UUID");
  
    $("#DOWN_SELL_FOUR").text("LOADING....");
    $("#DOWN_SELL_THREE").text("LOADING....");
    $("#DOWN_SELL_TWO").text("LOADING....");
    $("#DOWN_SELL_ONE").text("LOADING....");
  
    // initiate Order 
    await fetch("http://127.0.0.1:8080/addProduct", {
        method: 'post',
        body:    JSON.stringify({
            FB_UUID: f,
            product: {
                variant_id: 41175577100460,
                price: 1200,
                quantity: 1,
                title: "Black LGB Wristband"
            }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(r => r.json())
    .then(json => {
        // $("#ADD_VIP").text("YES! CLAIM MY FREE WRISTBANDS AND SIGN ME UP");
        window.location.href="http://127.0.0.1:5500/public/congrats.html"
        return json
    });
  
  });
  
console.log('ended', localStorage);