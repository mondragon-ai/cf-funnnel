import "https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js";
console.log("PUBLIC - FIREBASE.JS");

// Config obj for FB
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
firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
console.log("FB & SHOPIFY INITALIZED");