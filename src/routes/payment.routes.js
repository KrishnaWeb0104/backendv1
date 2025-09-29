import express from "express";
import {
    createOrder,
    verifyPayment,
    webhookVerification,
    processCashPayment,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router.post(
    "/create-order",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PAYMENTS", "CREATE"),
    createOrder
);
router.post(
    "/verify-payment",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PAYMENTS", "UPDATE"),
    verifyPayment
);
router.post("/webhook-verify", webhookVerification); // No auth here
router.post(
    "/cash-payment",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PAYMENTS", "CREATE"),
    processCashPayment
);

export default router;
