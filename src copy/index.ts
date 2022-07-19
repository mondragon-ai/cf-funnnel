// IMPORTS
// ============================================================================================================
import * as functions from "firebase-functions";
import {app} from "./api/api";

// Export API Express app - path/api/{{query}}
export const funnelAPI = functions.https.onRequest(app);