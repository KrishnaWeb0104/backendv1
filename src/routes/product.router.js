// src/routes/product.routes.js
import { Router } from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";
import ApiError from "../utils/ApiError.js";

const router = Router();

// Custom upload middleware with error handling
const uploadProductImages = (req, res, next) => {
  upload.fields([
    { name: "image_url", maxCount: 1 },
    { name: "additional_images", maxCount: 5 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File size too large. Maximum 5MB allowed per image.'));
      }
      return next(new ApiError(400, `File upload error: ${err.message}`));
    }
    next();
  });
};

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected
router.post(
    "/add-product",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PRODUCTS", "CREATE"),
    uploadProductImages,
    createProduct
);
router.patch(
    "/update-product/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PRODUCTS", "UPDATE"),
    uploadProductImages,
    updateProduct
);
router.delete(
    "/delete-product/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("PRODUCTS", "DELETE"),
    deleteProduct
);

export default router;
