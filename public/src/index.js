console.log("PUBLIC - INDEX.JS")
const stripe = Stripe('pk_test_51LCmGyE1N4ioGCdR6UcKcjiZDb8jfZaaDWcIGhdaUCyhcIDBxG9uYzLGFtziZjZ6R6VnSSVEMW8dUZ8IfnwvSSBa0044BHRyL5');
// import { db } from './lib/firebase.js'


// Hide the second form on load
$("#EVENT_TWO").hide();

/**
 * Submit email to FB & Shopify
 */
$("#EVENT_ONE").submit(async function (ev) { 
    ev.preventDefault();
    const e = $("input").val()
    const data =  { email: e }

    console.log("DATA: ", JSON.stringify(data))
    $("#EVENT_TWO").show();
    $("#EVENT_ONE").hide();
});


$("#EVENT_TWO").submit(async function (ev) { 
    ev.preventDefault();

    var address = {}
    var cc = {}
    $("form#EVENT_TWO input[type=text]").each(function(){
        var input = $(this); 
        if ([input.attr('name')] == 'cc' || [input.attr('name')] == 'exp_month' || [input.attr('name')] == 'exp_year' || [input.attr('name')] == 'cvc' ) {
            cc = {
                ...cc,
                [input.attr('name')]: input.val()
            }
        } else {
            address = {
                ...address,
                [input.attr('name')]: input.val()
            }
        }
    });

    // addShippingInfo(address,cc);
    $("#EVENT_TWO").show();
    $("#EVENT_ONE").hide();
});

let elements;

initialize();
checkStatus();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

// Fetches a payment intent and captures the client secret
async function initialize() {
  const response = await fetch("http://localhost:8080/createScene");
  const { clientSecret } = await response.json();

  const appearance = {
    theme: 'stripe',
  };
  elements = stripe.elements({ appearance, clientSecret });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: "http://localhost:5500/upsell.html",
    },
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occurred.");
  }

  setLoading(false);
}

// Fetches the payment intent status after payment submission
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

// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
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

