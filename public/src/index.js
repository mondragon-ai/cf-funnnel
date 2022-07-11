console.log("PUBLIC - INDEX.JS")
console.log("PUBLIC - INDEX.JS", localStorage);
const stripe = Stripe('pk_test_51LCmGyE1N4ioGCdR6UcKcjiZDb8jfZaaDWcIGhdaUCyhcIDBxG9uYzLGFtziZjZ6R6VnSSVEMW8dUZ8IfnwvSSBa0044BHRyL5');

// Hide the second form on load
$("#EVENT_TWO").hide();

// Set El
let elements;

// Initalize & Create scene
initialize();
checkStatus();

// Get our secret 
document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
localStorage.clear();

/**
 * Fetches a payment intent and captures the client secret
 */
async function initialize() {
  // GET: BE to init/create scene for using FB/Shopify/Stripe
  // const response = await fetch("http://localhost:8080/createScene");
  // const { clientSecret, fbuid } = await response.json();

  const clientSecret = "seti_1LJMFUE1N4ioGCdRMh4KaX4r_secret_M1P3vVp9r0fRIiSC2X0AlDuR5AwNUh7"
  // Add FB_UUID & Stripe C_secret to Local Storage
  // localStorage.setItem("fbuid", "");
  localStorage.removeItem("fbuid")
  localStorage.setItem("fbuid", fbuid);
  localStorage.setItem("cSecret", clientSecret);
  console.log("PUBLIC - INDEX.JS", localStorage);
  
  // Styling when needed
  const appearance = {
    theme: 'stripe',
  };
  
  // Create our Form el
  elements = stripe.elements({ appearance,  clientSecret});

  // Use el and inject in our fomr (Stripe)
  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

/**
 * Fetches the payment intent status after payment submission
 * @returns 
 */
async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case "succeeded":
      showMessage("Payment succeeded!");
      break;
    case "processing":
      showMessage("Your payment is processing.");
      break;
    case "requires_payment_method":
      showMessage("Your payment was not successful, please try again.");
      break;
    default:
      showMessage("Something went wrong.");
      break;
  }
}

/**
 * Generate UI Messages
 * @param {*} messageText 
 */
function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
}

/**
 *  Submit email to Stripe, FB & Shopify
 *  @param {*} event 
 */
$("#EVENT_ONE").submit(async function (ev) { 
  ev.preventDefault();
  const e = $("input").val();
  const n = $("form#EVENT_ONE input[type=email]").val();
  const f = localStorage.getItem("fbuid")
  const d =  { email: String(e), fullName: n, fbUID: String(f)};

  console.log(e,n,f)

  // Post email to BE - Stripe/FB/Shopify
  // await fetch('http://localhost:8080/addEmail', {
  //   method: "POST",
  //   body: JSON.stringify(d),
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // });

  $("#EVENT_TWO").show();
  $("#EVENT_ONE").hide();
});

// localStorage.clear()   

let product = {}

$("#BRONZE").click(function(e) {    
  e.preventDefault();

  // TOGGLE TICKETS
  jQuery("input:radio[value='BRONZE']").prop('checked', true);
  jQuery("input:radio[value='SILVER']").prop('checked', false);
  jQuery("input:radio[value='GOLD']").prop('checked', false);
  jQuery("input:radio[value='PLATINUM']").prop('checked', false);

  // Get Value of Radio
  var radioValue = jQuery("input[name='LANDING_PRODUCT']:checked").val();

  product = {
    variant_id: 41513662578860,
    price: 900
  }
  console.log('VALUE SELECTED: ', radioValue, product);
  
});


$("#SILVER").click(function(e) {    
  e.preventDefault();

  // TOGGLE TICKETS
  jQuery("input:radio[value='BRONZE']").prop('checked', false);
  jQuery("input:radio[value='SILVER']").prop('checked', true);
  jQuery("input:radio[value='GOLD']").prop('checked', false);
  jQuery("input:radio[value='PLATINUM']").prop('checked', false);

  // Get Value of Radio
  var radioValue = jQuery("input[name='LANDING_PRODUCT']:checked").val();
  
  product = {
    variant_id: 41513667985580,
    price: 3000
  }
  console.log('VALUE SELECTED: ', radioValue, product);

});


$("#GOLD").click(function(e) {    
  e.preventDefault();

  // TOGGLE TICKETS
  jQuery("input:radio[value='BRONZE']").prop('checked', false);
  jQuery("input:radio[value='SILVER']").prop('checked', false);
  jQuery("input:radio[value='GOLD']").prop('checked', true);
  jQuery("input:radio[value='PLATINUM']").prop('checked', false);

  // Get Value of Radio
  var radioValue = jQuery("input[name='LANDING_PRODUCT']:checked").val();

  product = {
    variant_id: 41513672474796,
    price: 5000
  }

  console.log('VALUE SELECTED: ', radioValue, product);

});


$("#PLATINUM").click(function(e) {    
  e.preventDefault();

  // TOGGLE TICKETS
  jQuery("input:radio[value='BRONZE']").prop('checked', false);
  jQuery("input:radio[value='SILVER']").prop('checked', false);
  jQuery("input:radio[value='GOLD']").prop('checked', false);
  jQuery("input:radio[value='PLATINUM']").prop('checked', true);

  // Get Value of Radio
  var radioValue = jQuery("input[name='LANDING_PRODUCT']:checked").val();

  product = {
    variant_id: 41513860300972,
    price: 9900
  };

  console.log('VALUE SELECTED: ', radioValue, product);

});


/**
 *  Get the address & Submit to Stripe/FB 
 *  * Create PI object to collect CC info for Stripe
 *  ! SHOPIFY IS NOT MODIFIED -- NOT UNTIL '/CHEKCOUT'
 *  @param {*} event 
 */
async function handleSubmit(e) {
  e.preventDefault();

  var address = {}
  var name = ""

  // Get Form & Inputs for Address Obj
  $("form#payment-form input[type=text]").each(function(){
      var input = $(this); 
      if ([input.attr('name')] == 'firstName' ) {
        name = input.val()
      } else {
          address = {
              ...address,
              [input.attr('name')]: input.val()
          }
      }
  });
  
  // Form Shipping object for stripe
  const shippingAddress = {
    address: address,
    name: name
  }

  // Create Data Object to be POSTed
  const d = {shippingAddress: shippingAddress, fbUID: localStorage.getItem("fbuid"), product: product}


  // Post Data to BE for Stripe & FB
  const response = await fetch('http://localhost:8080/handleSubmit', {
    method: "POST",
    body: JSON.stringify(d),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ? Keep or naw? Data if needed 
  // const data = await response.json();

  // Handle Strie Client Tunnel 
  const {error} = await stripe.confirmSetup({
    //`Elements` instance that was used to create the Payment Element
    elements,
    confirmParams: {
      return_url: 'http://127.0.0.1:5500/public/upsell.html',
    }
  });

  if (error) {
    const messageContainer = document.querySelector('#error-message');
    messageContainer.textContent = error.message;
  } else { // avtivate return URL 
  }
}

// Pass the failed PaymentIntent to your client from your serve


