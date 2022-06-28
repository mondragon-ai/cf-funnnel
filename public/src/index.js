console.log("PUBLIC - INDEX.JS")
const stripe = Stripe('pk_test_51LCmGyE1N4ioGCdR6UcKcjiZDb8jfZaaDWcIGhdaUCyhcIDBxG9uYzLGFtziZjZ6R6VnSSVEMW8dUZ8IfnwvSSBa0044BHRyL5');

// Hide the second form on load
$("#EVENT_TWO").hide();

// Set El
let elements;

// Initalize fetch
initialize();
checkStatus();

// Get our secret 
document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

/**
 * Fetches a payment intent and captures the client secret
 */
async function initialize() {
  const response = await fetch("http://localhost:8080/createScene");
  const { clientSecret, fbuid } = await response.json();

  localStorage.setItem("fbuid", fbuid);
  localStorage.setItem("cSecret", clientSecret);
  
  const appearance = {
    theme: 'stripe',
  };
  
  elements = stripe.elements({ appearance, clientSecret });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  // setLoading(true);
  $("#EVENT_TWO").hide();

  var address = {}
  var name = ""
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

  const shippingAddress = {
    address: address,
    name: name
  }

  const d = {shippingAddress: shippingAddress, fbUID: localStorage.getItem("fbuid")}

  console.log("EVENT TWO - SHIPPING ADDED SUCCESS: ", d );

  const response = await fetch('http://localhost:8080/handleSubmit', {
    method: "POST",
    body: JSON.stringify(d),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  console.log("EVENT TWO - SHIPPING ADDED SUCCESS: ", data);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // GO to upsell page
      return_url: "http://localhost:5500/upsell.html",
    },
  });

  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occurred.");
  }

  // setLoading(false);
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
 * Show a spinner on payment submission
 * @param {*} isLoading 
 */
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}

/**
 * Submit email to FB & Shopify
 */
 $("#EVENT_ONE").submit(async function (ev) { 
  ev.preventDefault();
  const e = $("input").val();
  const f = localStorage.getItem("fbuid")
  const d =  { email: String(e), fbUID: String(f)};

  console.log("DATA: ", d);

  const response = await fetch('http://localhost:8080/addEmail', {
    method: "POST",
    body: JSON.stringify(d),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  console.log("EVENT ONE SUCCESS: ", data);

  $("#EVENT_TWO").show();
  $("#EVENT_ONE").hide();
});

// localStorage.clear()

// $("#EVENT_TWO").submit(async function (ev) { 
//   ev.preventDefault();

//   var address = {}
//   var cc = {}
//   $("form#EVENT_TWO input[type=text]").each(function(){
//       var input = $(this); 
//       if ([input.attr('name')] == 'cc' || [input.attr('name')] == 'exp_month' || [input.attr('name')] == 'exp_year' || [input.attr('name')] == 'cvc' ) {
//           cc = {
//               ...cc,
//               [input.attr('name')]: input.val()
//           }
//       } else {
//           address = {
//               ...address,
//               [input.attr('name')]: input.val()
//           }
//       }
//   });

//   // addShippingInfo(address,cc);
//   $("#EVENT_TWO").show();
//   $("#EVENT_ONE").hide();
// });

