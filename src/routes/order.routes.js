import express from "express";
import {
    createOrder,
    getOrderById,
    cancelOrder,
    getUserOrders,
    updateOrderStatus,
    deleteOrder,
    returnOrder,
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router
    .route("/create-order")
    .post(
        verifyJWT,
        createOrder
    );
router
    .route("/get-all")
    .get(
        verifyJWT,
        getUserOrders
    );
router
    .route("/:id")
    .get(
        verifyJWT,
        getOrderById
    );
router
    .route("/delete-order/:id")
    .delete(
        verifyJWT,
        deleteOrder
    );
router.post(
    "/return-order/:id",
    verifyJWT,
    returnOrder
);
router
    .route("/status-order/:id")
    .put(
        verifyJWT,
        updateOrderStatus
    );
router.post(
    "/cancel-order/:id",
    verifyJWT,
    cancelOrder
);

export default router;
