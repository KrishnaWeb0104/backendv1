import express from "express";
import {
    getCustomerReport,
    getOrderReport,
    getPaymentReport,
    getDashboardCounts,
    getTopProducts,
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router.get(
    "/customers",
    verifyJWT,
    requireAdminAccess,
    requirePermission("REPORTS", "VIEW"),
    getCustomerReport
);
router.get(
    "/orders",
    verifyJWT,
    requireAdminAccess,
    requirePermission("REPORTS", "VIEW"),
    getOrderReport
);
router.get(
    "/payments",
    verifyJWT,
    requireAdminAccess,
    requirePermission("REPORTS", "VIEW"),
    getPaymentReport
);
router.get(
    "/dashboard/counts",
    verifyJWT,
    requireAdminAccess,
    requirePermission("REPORTS", "VIEW"),
    getDashboardCounts
);
router.get(
    "/top-products",
    verifyJWT,
    requireAdminAccess,
    requirePermission("REPORTS", "VIEW"),
    getTopProducts
);

export default router;
