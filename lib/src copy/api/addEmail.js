"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ============================================================================================================
const api_1 = require("./api");
const firebase_1 = require("./lib/firebase");
// ROUTES
// ============================================================================================================
api_1.app.post("/firebase/addEmail", async (req, res) => {
    const { FB_UUID, email, name } = req.body;
    try {
        const customerDoc = await firebase_1.updateCustomerDoc(FB_UUID, {
            email: email,
            name: name,
        });
        res.status(200).json({
            m: "Successfly updated firebase doc.",
            c: customerDoc,
        });
    }
    catch (error) {
        res.status(400).json({
            m: "Error: Firebase -- likly missing valid FB_UUID.",
            e: error,
        });
    }
});
//# sourceMappingURL=addEmail.js.map