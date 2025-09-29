// src/routes/category.routes.js
import { Router } from "express";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProducts,
    getCategoryStats,
} from "../controllers/category.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.get("/:id/products", getCategoryProducts);
router.get("/:id/stats", getCategoryStats);

// Protected
router.post(
    "/add-category",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CATEGORIES", "CREATE"),
    upload.fields([{ name: "image", maxCount: 1 }]),
    createCategory
);
router.patch(
    "/update-category/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CATEGORIES", "UPDATE"),
    upload.fields([{ name: "image", maxCount: 1 }]),
    updateCategory
);
router.delete(
    "/delete-category/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CATEGORIES", "DELETE"),
    deleteCategory
);

export default router;
