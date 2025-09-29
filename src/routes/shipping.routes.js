import express from "express";
import {
    createShipping,
    getShippingByOrder,
    updateShipping,
    deleteShipping,
    getAllShipping,
} from "../controllers/shipping.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router.post(
    "/create-shipping",
    verifyJWT,
    requireAdminAccess,
    requirePermission("SHIPPING", "CREATE"),
    createShipping
);
router.get(
    "/all-shipping",
    verifyJWT,
    requireAdminAccess,
    requirePermission("SHIPPING", "VIEW"),
    getAllShipping
);
router.get(
    "/:orderId",
    verifyJWT,
    requireAdminAccess,
    requirePermission("SHIPPING", "VIEW"),
    getShippingByOrder
);
router.put(
    "/update-shipping/:orderId",
    verifyJWT,
    requireAdminAccess,
    requirePermission("SHIPPING", "UPDATE"),
    updateShipping
);
router.delete(
    "/delete-shipping/:orderId",
    verifyJWT,
    requireAdminAccess,
    requirePermission("SHIPPING", "DELETE"),
    deleteShipping
);

export default router;
