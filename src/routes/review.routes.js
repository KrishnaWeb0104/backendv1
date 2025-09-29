import express from "express";
import {
    createReview,
    getReviews,
    getReviewById,
    getReviewsByProduct,
    getReviewsByUser,
    updateReview,
    deleteReview,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../../src/middlewares/auth.js";

const router = express.Router();

// Public reads
router.get("/", getReviews); // /api/v1/reviews?productId=&userId=&page=&limit=
router.get("/product/:productId", getReviewsByProduct);
router.get("/user/:userId", getReviewsByUser);
router.get("/:id", getReviewById);

// Authenticated mutations
router.post("/", verifyJWT, createReview);
router.patch("/:id", verifyJWT, updateReview);
router.delete("/:id", verifyJWT, deleteReview);

export default router;
