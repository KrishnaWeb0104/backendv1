// src/routes/brand.routes.js
import { Router } from "express";
import {
    getBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
} from "../controllers/brand.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/get-brands", getBrands);
router.get("/get-brand/:id", getBrandById);

// Protected
router.post(
    "/add-brand",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PRODUCTS", "CREATE"),
    createBrand
);
router.patch(
    "/update-brand/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PRODUCTS", "UPDATE"),
    updateBrand
);
router.delete(
    "/delete-brand/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PRODUCTS", "DELETE"),
    deleteBrand
);

export default router;
