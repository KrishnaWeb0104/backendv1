import { Wishlist } from "../models/wishlist.model.js";
import Product from "../models/product.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ✅ Get user's wishlist
export const getWishlist = asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
        "products"
    );
    res.status(200).json(
        new ApiResponse(
            200,
            wishlist || { user: req.user._id, products: [] },
            "Wishlist fetched"
        )
    );
});

// ✅ Add product to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!productId) throw new ApiError(400, "Product ID required");

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: req.user._id,
            products: [productId],
        });
    } else {
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }
    }

    res.status(200).json(new ApiResponse(200, wishlist, "Added to wishlist"));
});

// ✅ Remove product from wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!productId) throw new ApiError(400, "Product ID required");

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) throw new ApiError(404, "Wishlist not found");

    wishlist.products = wishlist.products.filter(
        (pid) => pid.toString() !== productId
    );
    await wishlist.save();

    res.status(200).json(
        new ApiResponse(200, wishlist, "Removed from wishlist")
    );
});

// ✅ Clear wishlist
export const clearWishlist = asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) throw new ApiError(404, "Wishlist not found");

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json(new ApiResponse(200, wishlist, "Wishlist cleared"));
});
