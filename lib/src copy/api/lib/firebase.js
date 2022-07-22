"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerDoc = exports.createCustomerDoc = exports.getCustomerDoc = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.db = admin.firestore();
console.log(exports.db);
/**
 *  Get Firebase customer doc
 *  @param FB_UUID
 *  @returns customer || null
 */
exports.getCustomerDoc = async (FB_UUID) => {
    let customer = null;
    if (FB_UUID !== "") {
        // Doc Ref
        var docRef = exports.db.collection("customers").doc(FB_UUID);
        // Get Doc
        await docRef.get().then((doc) => {
            if (doc.exists) {
                console.log("Document data:", doc.data());
                customer = doc.data();
            }
            else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
                customer = null;
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
        return customer;
    }
    else {
        console.log("FB_UUID EMPTY");
        return customer;
    }
};
/**
 *  Create Doc with Data
 *  @param data
 *  @returns FB_UUID
 */
exports.createCustomerDoc = async (data) => {
    var FB_UUID = "";
    // Create Doc with Data
    await exports.db.collection("customers").add(data)
        .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
        FB_UUID = docRef.id;
    })
        .catch((error) => {
        console.error("Error adding document: ", error);
    });
    console.error("FB_UUID WRITTEN: ", FB_UUID);
    return FB_UUID;
};
/**
 *
 *  @param FB_UUID
 *  @param data
 *  @returns FB_UUID
 */
exports.updateCustomerDoc = async (FB_UUID, data) => {
    // Doc Ref
    var docRef = exports.db.collection("customers").doc(FB_UUID);
    // Doc Ref
    await docRef.set(data, { merge: true });
    console.log("updated customer", docRef);
    return FB_UUID;
};
//# sourceMappingURL=firebase.js.map