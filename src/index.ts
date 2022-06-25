require('dotenv').config()
const Stripe = require('stripe')
const {app} = require("./api/funnel");
const { initializeApp } = require("firebase/app");
const { addDoc, collection, getFirestore} = require("firebase/firestore"); 
// console.log("Error adding document: ");

const firebaseConfig = {
  apiKey: "AIzaSyBVbUajosWuWo6RDhcwarsoFb5vQULdm50",
  authDomain: "shopify-recharge-352914.firebaseapp.com",
  projectId: "shopify-recharge-352914",
  storageBucket: "shopify-recharge-352914.appspot.com",
  messagingSenderId: "282916076195",
  appId: "1:282916076195:web:5f4863d335fd2394ff5d16",
  measurementId: "G-3LFMNFVE5Y"
};

// Initialize Firebase
export const fbApp = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(fbApp);

// Export Stripe Obj
export const stripe = Stripe(process.env.STRIPE_SECRET);

// Create a port for listenign
const port = 8080
app.listen(port, () => console.log(`You are listening to http://localhost:${port}`))
