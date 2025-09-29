import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", verifyJWT, getWishlist);
router.post("/add", verifyJWT, addToWishlist);
router.delete("/delete", verifyJWT, removeFromWishlist);
router.delete("/clear", verifyJWT, clearWishlist);

export default router;
