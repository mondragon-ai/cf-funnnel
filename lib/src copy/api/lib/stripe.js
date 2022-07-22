"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
// IMPORTS
// ============================================================================================================
const Stripe = require("stripe");
exports.stripe = Stripe(process.env.STRIPE_SECRET);
//# sourceMappingURL=stripe.js.map